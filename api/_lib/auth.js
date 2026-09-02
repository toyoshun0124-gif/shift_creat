import crypto from 'node:crypto';

const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12時間

function sign(body) {
  return crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
}

export function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  if (sign(body) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.iat || Date.now() - payload.iat > TOKEN_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuthUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return verifyToken(token);
}

// レスポンスを返して true を返した場合、呼び出し元は処理を中断すること
export function requireRole(req, res, role) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'ログインが必要です' });
    return null;
  }
  if (role && user.role !== role) {
    res.status(403).json({ error: '権限がありません' });
    return null;
  }
  return user;
}
