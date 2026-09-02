// ローカル開発専用の簡易サーバー。
// api/ 配下の各ファイル（Vercel Functions 形式: export default (req, res) => {}）を
// そのままルーティングして実行する。`vite dev` の /api プロキシ先として使う。
import http from 'node:http';
import { URL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function loadHandler(apiPath) {
  const filePath = path.join(projectRoot, 'api', `${apiPath}.js`);
  const mod = await import(`file://${filePath}`);
  return mod.default;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const apiPath = url.pathname.replace('/api/', '');

  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch {
      req.body = {};
    }
    req.query = Object.fromEntries(url.searchParams.entries());

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (obj) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(obj));
      return res;
    };

    try {
      const handler = await loadHandler(apiPath);
      if (!handler) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      res.status(500).json({ error: String(err.message || err) });
    }
  });
});

const PORT = process.env.DEV_API_PORT || 3000;
server.listen(PORT, () => console.log(`Dev API server listening on :${PORT}`));
