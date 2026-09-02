import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { generateCandidates, mergeReadjustments } from '../_lib/scheduler.js';
import { isBlank, sendError } from '../_lib/validation.js';

// シフト再調整ボタン: 最初に提示した5つのシフトを、再調整依頼を反映して作り直す
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, 'MANAGER');
  if (!user) return;

  const { periodId } = req.body || {};
  if (isBlank(periodId)) {
    return sendError(res, 400, '入力ミスがあります');
  }

  const period = await prisma.shiftPeriod.findUnique({ where: { id: periodId } });
  if (!period) {
    return sendError(res, 404, '対象のシフトが見つかりません');
  }

  const [preferences, pendingRequests] = await Promise.all([
    prisma.preference.findMany({ where: { periodId } }),
    prisma.readjustmentRequest.findMany({ where: { periodId, status: 'PENDING' } }),
  ]);

  if (pendingRequests.length === 0) {
    return sendError(res, 400, '再調整依頼がありません');
  }

  const merged = mergeReadjustments(
    preferences.map((p) => ({ userId: p.userId, date: p.date, startTime: p.startTime, endTime: p.endTime })),
    pendingRequests.map((r) => ({ userId: r.userId, date: r.date, startTime: r.startTime, endTime: r.endTime }))
  );

  const candidateSets = generateCandidates(merged, 5);

  await prisma.$transaction(async (tx) => {
    await tx.shiftCandidate.deleteMany({ where: { periodId } });
    for (let i = 0; i < candidateSets.length; i++) {
      await tx.shiftCandidate.create({
        data: {
          periodId,
          index: i + 1,
          assignments: { create: candidateSets[i] },
        },
      });
    }
    await tx.readjustmentRequest.updateMany({
      where: { id: { in: pendingRequests.map((r) => r.id) } },
      data: { status: 'APPLIED' },
    });
    await tx.shiftPeriod.update({ where: { id: periodId }, data: { status: 'GENERATED', isShared: false, selectedCandidateId: null } });
  });

  const candidates = await prisma.shiftCandidate.findMany({
    where: { periodId },
    orderBy: { index: 'asc' },
    include: { assignments: { include: { user: { select: { id: true, name: true, loginId: true } } } } },
  });

  return res.status(200).json({ candidates });
}
