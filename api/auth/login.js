import bcrypt from 'bcryptjs';
import { prisma } from '../_lib/db.js';
import { signToken } from '../_lib/auth.js';
import { isBlank, isTooLong, sendError } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const { loginId, password, role } = req.body || {};

  if (isBlank(loginId) || isBlank(password) || isBlank(role)) {
    return sendError(res, 400, '入力ミスがあります');
  }
  if (isTooLong(loginId) || isTooLong(password)) {
    return sendError(res, 400, '字数オーバーです');
  }
  if (role !== 'MANAGER' && role !== 'EMPLOYEE') {
    return sendError(res, 400, '入力ミスがあります');
  }

  const user = await prisma.user.findUnique({ where: { loginId } });

  if (!user) {
    return sendError(res, 401, 'ID入力ミスがあります');
  }

  // 従業員が管理者ログインを使った（あるいはその逆）場合は専用メッセージを返す
  if (user.role !== role) {
    return sendError(res, 401, 'ログインIDが間違っている');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return sendError(res, 401, 'ID入力ミスがあります');
  }

  const token = signToken({ userId: user.id, role: user.role, name: user.name, loginId: user.loginId });

  return res.status(200).json({
    token,
    user: { id: user.id, name: user.name, role: user.role, loginId: user.loginId },
  });
}
