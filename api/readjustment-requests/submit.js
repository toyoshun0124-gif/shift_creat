import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import {
  isBlank,
  isTooLong,
  isValidDate,
  isValidTimeRange,
  MAX_REASON_LENGTH,
  sendError,
} from '../_lib/validation.js';

// 再調整申請ボタン: 変更する日程・時間帯をマネージャーに申請する
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, 'EMPLOYEE');
  if (!user) return;

  const { date, startTime, endTime, reason } = req.body || {};

  if (isBlank(date) || isBlank(startTime) || isBlank(endTime)) {
    return sendError(res, 400, '入力ミスがあります');
  }
  if (isTooLong(date, 20) || isTooLong(startTime, 10) || isTooLong(endTime, 10) || isTooLong(reason, MAX_REASON_LENGTH)) {
    return sendError(res, 400, '字数オーバーです');
  }
  if (!isValidDate(date)) {
    return sendError(res, 400, '入力ミスがあります');
  }
  if (!isValidTimeRange(startTime, endTime)) {
    return sendError(res, 400, '入力ミスがあります');
  }

  const period = await prisma.shiftPeriod.findFirst({
    where: { status: 'FINALIZED', isShared: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!period) {
    return sendError(res, 400, '対象のシフトがありません');
  }

  const request = await prisma.readjustmentRequest.create({
    data: {
      periodId: period.id,
      userId: user.userId,
      date,
      startTime,
      endTime,
      reason: isBlank(reason) ? null : reason,
    },
  });

  return res.status(201).json({ request });
}
