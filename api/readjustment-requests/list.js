import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { sendError } from '../_lib/validation.js';

// 再調整通知ボタン: 再調整依頼者の情報を出す（従業員ID・日程・時間帯）
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, 'MANAGER');
  if (!user) return;

  const requests = await prisma.readjustmentRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, loginId: true } } },
  });

  return res.status(200).json({ requests });
}
