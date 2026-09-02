import { prisma } from '../_lib/db.js';
import { requireRole } from '../_lib/auth.js';
import { getLatestPeriod } from '../_lib/period.js';
import { sendError } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = requireRole(req, res, null);
  if (!user) return;

  const period = await getLatestPeriod();
  if (!period) {
    return res.status(200).json({ period: null });
  }

  const [preferenceCount, pendingRequestCount] = await Promise.all([
    prisma.preference.count({ where: { periodId: period.id } }),
    prisma.readjustmentRequest.count({ where: { periodId: period.id, status: 'PENDING' } }),
  ]);

  let myPreferences = [];
  if (user.role === 'EMPLOYEE') {
    myPreferences = await prisma.preference.findMany({
      where: { periodId: period.id, userId: user.userId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  return res.status(200).json({
    period,
    preferenceCount,
    pendingRequestCount,
    myPreferences,
  });
}
