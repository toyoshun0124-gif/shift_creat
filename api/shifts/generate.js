import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { getLatestPeriod } from '../_lib/period.js';
import { generateCandidates } from '../_lib/scheduler.js';
import { sendError } from '../_lib/validation.js';

// シフト作成依頼ボタン: 希望日程からシフト（5案）を作成する
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, 'MANAGER');
  if (!user) return;

  const period = await getLatestPeriod();
  if (!period || period.status === 'FINALIZED') {
    return sendError(res, 400, '対象の希望日程がありません');
  }

  const preferences = await prisma.preference.findMany({ where: { periodId: period.id } });
  if (preferences.length === 0) {
    return sendError(res, 400, '希望日程が提出されていません');
  }

  const entries = preferences.map((p) => ({ userId: p.userId, date: p.date, startTime: p.startTime, endTime: p.endTime }));
  const candidateSets = generateCandidates(entries, 5);

  await prisma.$transaction(async (tx) => {
    await tx.shiftCandidate.deleteMany({ where: { periodId: period.id } });
    for (let i = 0; i < candidateSets.length; i++) {
      await tx.shiftCandidate.create({
        data: {
          periodId: period.id,
          index: i + 1,
          assignments: { create: candidateSets[i] },
        },
      });
    }
    await tx.shiftPeriod.update({ where: { id: period.id }, data: { status: 'GENERATED' } });
  });

  const candidates = await prisma.shiftCandidate.findMany({
    where: { periodId: period.id },
    orderBy: { index: 'asc' },
    include: { assignments: { include: { user: { select: { id: true, name: true, loginId: true } } } } },
  });

  return res.status(200).json({ period: { ...period, status: 'GENERATED' }, candidates });
}
