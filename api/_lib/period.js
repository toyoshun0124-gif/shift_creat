import { prisma } from './db.js';

const DEFAULT_COLLECTION_DAYS = 7;

// 従業員が希望を提出する際に、募集中の期間が無ければ自動的に新しい期間を作成する。
export async function getOrCreateOpenPeriod() {
  let period = await prisma.shiftPeriod.findFirst({
    where: { status: 'COLLECTING' },
    orderBy: { createdAt: 'desc' },
  });
  if (!period) {
    const deadline = new Date(Date.now() + DEFAULT_COLLECTION_DAYS * 24 * 60 * 60 * 1000);
    period = await prisma.shiftPeriod.create({
      data: {
        title: `シフト募集 ${new Date().toISOString().slice(0, 10)}`,
        deadline,
        status: 'COLLECTING',
      },
    });
  }
  return period;
}

export async function getLatestPeriod() {
  return prisma.shiftPeriod.findFirst({ orderBy: { createdAt: 'desc' } });
}
