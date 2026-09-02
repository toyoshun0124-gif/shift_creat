import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { sendError } from '../_lib/validation.js';

// シフト閲覧ボタン: 作成・共有されたシフトを表示する
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, null);
  if (!user) return;

  const period = await prisma.shiftPeriod.findFirst({
    where: { status: 'FINALIZED', isShared: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!period || !period.selectedCandidateId) {
    return res.status(200).json({ period: null, assignments: [], myAssignments: [] });
  }

  const candidate = await prisma.shiftCandidate.findUnique({
    where: { id: period.selectedCandidateId },
    include: {
      assignments: {
        include: { user: { select: { id: true, name: true, loginId: true } } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      },
    },
  });

  const assignments = candidate?.assignments || [];
  const myAssignments = user.role === 'EMPLOYEE' ? assignments.filter((a) => a.userId === user.userId) : assignments;

  return res.status(200).json({ period, assignments, myAssignments });
}
