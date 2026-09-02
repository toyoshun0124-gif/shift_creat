import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { isBlank, sendError } from '../_lib/validation.js';

// シフトを選択して確定（コピー）し、全体へ共有する
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, 'MANAGER');
  if (!user) return;

  const { periodId, candidateId } = req.body || {};
  if (isBlank(periodId) || isBlank(candidateId)) {
    return sendError(res, 400, '入力ミスがあります');
  }

  const candidate = await prisma.shiftCandidate.findUnique({ where: { id: candidateId } });
  if (!candidate || candidate.periodId !== periodId) {
    return sendError(res, 404, '対象のシフト案が見つかりません');
  }

  const period = await prisma.shiftPeriod.update({
    where: { id: periodId },
    data: { status: 'FINALIZED', selectedCandidateId: candidateId, isShared: true },
  });

  return res.status(200).json({ period });
}
