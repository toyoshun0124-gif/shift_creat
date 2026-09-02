import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { isBlank, sendError } from '../_lib/validation.js';

// 中断ケース対応: 特定のボタン操作のたびに呼び出し、入力途中の内容を自動保存する
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, null);
  if (!user) return;

  const { key, data } = req.body || {};
  if (isBlank(key)) {
    return sendError(res, 400, '入力ミスがあります');
  }

  const draft = await prisma.draft.upsert({
    where: { userId_key: { userId: user.userId, key } },
    update: { data: data ?? {} },
    create: { userId: user.userId, key, data: data ?? {} },
  });

  return res.status(200).json({ draft });
}
