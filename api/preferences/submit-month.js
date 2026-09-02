import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { getOrCreateOpenPeriod } from '../_lib/period.js';
import { isTooLong, isValidDate, isValidTimeRange, sendError } from '../_lib/validation.js';

const MONTH_RE = /^\d{4}-\d{2}$/;

function daysInMonth(month) {
  const [year, mon] = month.split('-').map(Number);
  return new Date(Date.UTC(year, mon, 0)).getUTCDate();
}

// 希望シフト提出ボタン: 1ヶ月分の希望をまとめて提出する
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, 'EMPLOYEE');
  if (!user) return;

  const { month, entries } = req.body || {};

  if (typeof month !== 'string' || !MONTH_RE.test(month)) {
    return sendError(res, 400, '入力ミスがあります');
  }

  // イレギュラーケース: 何も入力せずに提出
  if (!Array.isArray(entries) || entries.length === 0) {
    return sendError(res, 400, '入力ミスがあります');
  }

  const maxDays = daysInMonth(month);
  // イレギュラーケース: 想定を超える件数（1ヶ月の日数を超える／重複）
  if (entries.length > maxDays) {
    return sendError(res, 400, '字数オーバーです');
  }

  const seenDates = new Set();
  for (const entry of entries) {
    const { date, startTime, endTime } = entry || {};

    if (isTooLong(date, 20) || isTooLong(startTime, 10) || isTooLong(endTime, 10)) {
      return sendError(res, 400, '字数オーバーです');
    }
    // イレギュラーケース(v2): 1ヶ月の内、1つでも入力ミスがあれば全体を差し戻す
    if (!isValidDate(date) || !date.startsWith(`${month}-`)) {
      return sendError(res, 400, '入力ミスがあります');
    }
    if (!isValidTimeRange(startTime, endTime)) {
      return sendError(res, 400, '入力ミスがあります');
    }
    if (seenDates.has(date)) {
      return sendError(res, 400, '入力ミスがあります');
    }
    seenDates.add(date);
  }

  const period = await getOrCreateOpenPeriod();

  // イレギュラーケース: 提出締め切りを過ぎている
  if (period.status !== 'COLLECTING' || new Date() > new Date(period.deadline)) {
    return sendError(res, 400, '締め切られている');
  }

  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(maxDays).padStart(2, '0')}`;

  await prisma.$transaction(async (tx) => {
    await tx.preference.deleteMany({
      where: {
        periodId: period.id,
        userId: user.userId,
        date: { gte: monthStart, lte: monthEnd },
      },
    });
    await tx.preference.createMany({
      data: entries.map((e) => ({
        periodId: period.id,
        userId: user.userId,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
    });
  });

  return res.status(201).json({ count: entries.length });
}
