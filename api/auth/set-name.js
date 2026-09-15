import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { isBlank, isTooLong, MAX_NAME_LENGTH, sendError } from '../_lib/validation.js';

// ログイン後の名前入力画面: ユーザー自身の表示名を設定する
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const authUser = requireRole(req, res, null);
  if (!authUser) return;

  const { name } = req.body || {};

  // イレギュラーケース: 名前入力の欄が空っぽ
  if (isBlank(name)) {
    return sendError(res, 400, '入力ミスがあります');
  }
  // イレギュラーケース: 過剰に入力
  if (isTooLong(name, MAX_NAME_LENGTH)) {
    return sendError(res, 400, '入力ミスがあります');
  }

  const user = await prisma.user.update({
    where: { id: authUser.userId },
    data: { name: name.trim() },
    select: { id: true, name: true, role: true, loginId: true },
  });

  return res.status(200).json({ user });
}
