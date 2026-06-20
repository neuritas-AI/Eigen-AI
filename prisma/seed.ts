import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MODEL_PROVIDERS = [
  { key: 'brainz_local', name: 'Brainz Local', active: true, priority: 1, pricePerMsg: 1 },
  { key: 'gpt5', name: 'GPT-5', active: true, priority: 2, pricePerMsg: 5 },
  { key: 'claude', name: 'Claude', active: true, priority: 3, pricePerMsg: 5 },
  { key: 'gemini', name: 'Gemini', active: true, priority: 4, pricePerMsg: 3 },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'chat@neuritas-ai.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('ChangeMe123!', 10),
        role: 'ADMIN',
        plan: 'ENTERPRISE',
      },
    });
  }

  for (const provider of MODEL_PROVIDERS) {
    await prisma.modelProvider.upsert({
      where: { key: provider.key },
      update: { ...provider },
      create: provider,
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
