export const MAX_TEXT_LENGTH = 200;
export const MAX_REASON_LENGTH = 300;

const TIME_RE = /^([01]\d|2[0-3]|24):([0-5]\d)$/; // 00:00〜24:00 のみ許可（25:00 等は不正）
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

export function isTooLong(value, max = MAX_TEXT_LENGTH) {
  return typeof value === 'string' && value.length > max;
}

export function isValidDate(date) {
  if (typeof date !== 'string' || !DATE_RE.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

export function isValidTimeRange(start, end) {
  if (typeof start !== 'string' || typeof end !== 'string') return false;
  if (!TIME_RE.test(start) || !TIME_RE.test(end)) return false;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return e > s;
}

export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
