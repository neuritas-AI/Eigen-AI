const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@neuritas.ai';
  const password = 'Demo123!';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('Demo user already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      plan: 'FREE',
    },
  });

  console.log('Created demo user:', email);
  console.log('Password:', password);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
