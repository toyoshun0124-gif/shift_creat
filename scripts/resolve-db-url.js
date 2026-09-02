// Vercel Marketplace経由でStorageを接続すると、DATABASE_URL ではなく
// 接続名を接頭辞に付けた環境変数（例: shift_create_DATABASE_URL）で
// 発行されることがある。ビルド時にそれを検出し、標準の DATABASE_URL として
// 子プロセス（prisma generate / migrate deploy / seed）に引き継ぐ。
import { spawnSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  const prefixedKey = Object.keys(process.env).find((key) => key.endsWith('_DATABASE_URL'));
  if (prefixedKey) {
    process.env.DATABASE_URL = process.env[prefixedKey];
  }
}

const [, , cmd, ...args] = process.argv;
const result = spawnSync(cmd, args, { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
