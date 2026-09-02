import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { isBlank, sendError } from '../_lib/validation.js';

// 中断ケース対応: いつでも直前の入力状態を復元できるようにする
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, null);
  if (!user) return;

  const { key } = req.query || {};
  if (isBlank(key)) {
    return sendError(res, 400, '入力ミスがあります');
  }

  const draft = await prisma.draft.findUnique({
    where: { userId_key: { userId: user.userId, key: String(key) } },
  });

  return res.status(200).json({ data: draft?.data ?? null, updatedAt: draft?.updatedAt ?? null });
}
