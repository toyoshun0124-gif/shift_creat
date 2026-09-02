import { PrismaClient } from '@prisma/client';

// Vercel MarketplaceでStorageを接続すると、接続名（例: shift_create_）を
// 接頭辞に付けた環境変数名で発行されることがあるため、DATABASE_URL が
// 未設定の場合はそちらにフォールバックする。
if (!process.env.DATABASE_URL) {
  const prefixedKey = Object.keys(process.env).find((key) => key.endsWith('_DATABASE_URL'));
  if (prefixedKey) {
    process.env.DATABASE_URL = process.env[prefixedKey];
  }
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
