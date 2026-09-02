import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { getOrCreateOpenPeriod } from '../_lib/period.js';
import { isBlank, isTooLong, isValidDate, isValidTimeRange, sendError } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, 'EMPLOYEE');
  if (!user) return;

  const { date, startTime, endTime } = req.body || {};

  // イレギュラーケース1: 空っぽで送信
  if (isBlank(date) || isBlank(startTime) || isBlank(endTime)) {
    return sendError(res, 400, '入力ミスがあります');
  }
  // イレギュラーケース2: 想定外に長い入力
  if (isTooLong(date, 20) || isTooLong(startTime, 10) || isTooLong(endTime, 10)) {
    return sendError(res, 400, '字数オーバーです');
  }
  if (!isValidDate(date)) {
    return sendError(res, 400, '入力ミスがあります');
  }
  // イレギュラーケース3: 時間帯を間違えた（例: 9:00〜25:00）
  if (!isValidTimeRange(startTime, endTime)) {
    return sendError(res, 400, '入力ミスがあります');
  }

  const period = await getOrCreateOpenPeriod();

  // イレギュラーケース3: 提出締め切りを過ぎている
  if (period.status !== 'COLLECTING' || new Date() > new Date(period.deadline)) {
    return sendError(res, 400, '締め切られている');
  }

  const preference = await prisma.preference.create({
    data: {
      periodId: period.id,
      userId: user.userId,
      date,
      startTime,
      endTime,
    },
  });

  return res.status(201).json({ preference });
}
