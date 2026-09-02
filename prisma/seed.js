import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertUser({ loginId, password, name, role }) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { loginId },
    update: {},
    create: { loginId, password: hash, name, role },
  });
}

async function main() {
  await upsertUser({ loginId: 'manager1', password: 'password123', name: '北村彩奈', role: 'MANAGER' });
  await upsertUser({ loginId: 'employee1', password: 'password123', name: '山田太郎', role: 'EMPLOYEE' });
  await upsertUser({ loginId: 'employee2', password: 'password123', name: '佐藤花子', role: 'EMPLOYEE' });
  await upsertUser({ loginId: 'employee3', password: 'password123', name: '鈴木一郎', role: 'EMPLOYEE' });
  console.log('Seed completed: manager1 / employee1-3 (password: password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
