import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRateLimiter } from '@/lib/rate-limit';

function createFallbackResponse(message: string) {
  const normalized = message.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return 'The AI backend is currently unavailable. Please try again in a moment.';
  }

  return `The AI backend is currently unavailable, but your prompt was received: "${normalized}". Please try again when the live model endpoint is reachable.`;
}

export async function POST(request: Request) {
  const session: any = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const message = typeof body.message === 'string' ? body.message : '';
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;
  const modelKey = typeof body.modelKey === 'string' ? body.modelKey : 'brainz_local';
  const projectId = typeof body.projectId === 'string' ? body.projectId : undefined;

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: String(session.user.email) } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const limiter = getRateLimiter(user.plan);
  const identifier = `user:${user.id}`;
  const { success } = await limiter.limit(identifier);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const month = new Date().toISOString().slice(0, 7);
  const usage = await prisma.usage.upsert({
    where: { userId_month: { userId: user.id, month } },
    update: { requestCount: { increment: 1 } },
    create: { userId: user.id, month, requestCount: 1 },
  });

  if (user.plan === 'FREE' && usage.requestCount > 20) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  if (user.plan === 'PRO' && usage.requestCount > 200) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let modelProvider = await prisma.modelProvider.findUnique({ where: { key: modelKey } });
  if (!modelProvider || !modelProvider.active) {
    modelProvider = await prisma.modelProvider.findFirst({ where: { key: 'brainz_local' } });
  }

  const actualModelKey = modelProvider?.key ?? 'brainz_local';
  const creditsUsed = modelProvider?.pricePerMsg ?? 1;

  const project = projectId
    ? await prisma.project.findUnique({ where: { id: projectId } })
    : null;

  const projectContext = project?.instructions || project?.description || '';
  const prompt = projectContext
    ? `Project context: ${projectContext}\n\n${message}`
    : message;

  const ollamaUrl = process.env.OLLAMA_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!ollamaUrl) {
    return NextResponse.json({ response: 'AI backend is not configured.' }, { status: 200 });
  }

  let conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId: user.id } })
    : null;

  const recordMessages = conversation ? JSON.parse(conversation.messages) : [];

  try {
    const response = await fetch(`${ollamaUrl.replace(/\/+$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: actualModelKey === 'brainz_local' ? 'llama3' : actualModelKey, prompt, stream: false }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    const answer = data.response || 'No response returned.';

    const updatedMessages = [
      ...recordMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: answer },
    ];

    if (conversation) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          messages: JSON.stringify(updatedMessages),
          modelKey: actualModelKey,
          projectId,
        },
      });
    } else {
      await prisma.conversation.create({
        data: {
          id: conversationId ?? crypto.randomUUID(),
          userId: user.id,
          messages: JSON.stringify(updatedMessages),
          modelKey: actualModelKey,
          projectId,
        },
      });
    }

    await prisma.usageLog.create({
      data: {
        userId: user.id,
        modelKey: actualModelKey,
        prompt: message,
        response: answer,
        creditsUsed,
        tokensUsed: null,
        projectId,
      },
    });

    return NextResponse.json({ response: answer, conversationId: conversation?.id ?? conversationId });
  } catch {
    const answer = createFallbackResponse(message);
    const updatedMessages = [
      ...recordMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: answer },
    ];

    if (conversation) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          messages: JSON.stringify(updatedMessages),
          modelKey: actualModelKey,
          projectId,
        },
      });
    } else {
      await prisma.conversation.create({
        data: {
          id: conversationId ?? crypto.randomUUID(),
          userId: user.id,
          messages: JSON.stringify(updatedMessages),
          modelKey: actualModelKey,
          projectId,
        },
      });
    }

    await prisma.usageLog.create({
      data: {
        userId: user.id,
        modelKey: actualModelKey,
        prompt: message,
        response: answer,
        creditsUsed,
        tokensUsed: null,
        projectId,
      },
    });

    return NextResponse.json({ response: answer }, { status: 200 });
  }
}
