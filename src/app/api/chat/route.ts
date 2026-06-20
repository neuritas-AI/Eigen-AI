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

function createFallbackBody(message: string) {
  return {
    success: false,
    error: 'AI backend temporarily unavailable',
    response: createFallbackResponse(message),
  };
}

export async function POST(request: Request) {
  const session: any = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const message = typeof body.message === 'string' ? body.message : '';
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;
  const projectId = typeof body.projectId === 'string' ? body.projectId : undefined;
  const requestedModel = typeof body.model === 'string'
    ? body.model
    : typeof body.modelKey === 'string'
    ? body.modelKey
    : 'brainz-local';

  const modelMap: Record<string, string> = {
    'brainz-local': 'llama3',
    'gpt-5': 'gpt-5',
    'gpt5': 'gpt-5',
    claude: 'claude-3-5-sonnet',
    gemini: 'gemini-1.5-pro',
  };

  const modelKeyMap: Record<string, string> = {
    'brainz-local': 'brainz_local',
    'gpt-5': 'gpt5',
    'gpt5': 'gpt5',
    claude: 'claude',
    gemini: 'gemini',
  };

  console.log('Selected model:', requestedModel);

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

  const requestedModelKey = modelKeyMap[requestedModel] ?? 'brainz_local';
  let modelProvider = await prisma.modelProvider.findUnique({ where: { key: requestedModelKey } });
  if (!modelProvider || !modelProvider.active) {
    modelProvider = await prisma.modelProvider.findFirst({ where: { key: 'brainz_local' } });
  }

  const actualModelKey = modelProvider?.key ?? 'brainz_local';
  const creditsUsed = modelProvider?.pricePerMsg ?? 1;
  const resolvedModel = modelProvider && modelProvider.active ? modelMap[requestedModel] || 'llama3' : 'llama3';

  console.log('Resolved model:', resolvedModel);

  const project = projectId
    ? await prisma.project.findUnique({ where: { id: projectId } })
    : null;

  const projectContext = project?.instructions || project?.description || '';
  const prompt = projectContext
    ? `Project context: ${projectContext}\n\n${message}`
    : message;

  const openAIKey = process.env.OPENAI_API_KEY;
  const useOpenAI = openAIKey && actualModelKey === 'gpt5';
  const ollamaUrl = process.env.OLLAMA_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!useOpenAI && !ollamaUrl) {
    return NextResponse.json({ response: 'AI backend is not configured.' }, { status: 200 });
  }

  let conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId: user.id } })
    : null;

  const recordMessages = conversation ? JSON.parse(conversation.messages) : [];

  try {
    const openAiPayload = {
      model: resolvedModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
    };

    const ollamaPayload = {
      model: resolvedModel,
      prompt,
      stream: false,
    };

    const requestUrl = useOpenAI
      ? 'https://api.openai.com/v1/chat/completions'
      : `${ollamaUrl!.replace(/\/+$/, '')}/api/generate`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: useOpenAI
        ? {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAIKey}`,
          }
        : { 'Content-Type': 'application/json' },
      body: JSON.stringify(useOpenAI ? openAiPayload : ollamaPayload),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    const answer = useOpenAI
      ? data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || 'No response returned.'
      : data.response || 'No response returned.';

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
  } catch (error: any) {
    console.error('AI chat request failed:', error);
    const fallbackData = createFallbackBody(message);
    const updatedMessages = [
      ...recordMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: fallbackData.response },
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
        response: fallbackData.response,
        creditsUsed,
        tokensUsed: null,
        projectId,
      },
    });

    return NextResponse.json(fallbackData, { status: 200 });
  }
}
