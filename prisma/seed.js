import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertUser({ loginId, password, role }) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { loginId },
    update: {},
    create: { loginId, password: hash, role },
  });
}

async function main() {
  await upsertUser({ loginId: 'manager1', password: 'password123', role: 'MANAGER' });
  await upsertUser({ loginId: 'employee1', password: 'password123', role: 'EMPLOYEE' });
  await upsertUser({ loginId: 'employee2', password: 'password123', role: 'EMPLOYEE' });
  await upsertUser({ loginId: 'employee3', password: 'password123', role: 'EMPLOYEE' });
  console.log('Seed completed: manager1 / employee1-3 (password: password123). 名前は初回ログイン後に設定してください。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
