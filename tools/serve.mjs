// Minimal zero-dependency static file server for local play. The game itself needs no Node —
// this is just a convenience so ES modules load over http:// (they don't from file://).
// Usage: node tools/serve.mjs [port] [rootDir]   (defaults: 8000, repo root)
//   e.g. `node tools/serve.mjs 8000 dist` to preview the built deploy bundle.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname, resolve } from 'node:path';

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.argv[2]) || 8000;
// Optional second arg: directory to serve, relative to the repo root (default: repo root).
const ROOT = process.argv[3] ? resolve(REPO_ROOT, process.argv[3]) : REPO_ROOT;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url || '/', 'http://x').pathname);
    if (urlPath === '/') urlPath = '/index.html';
    // Prevent path traversal: resolve and ensure it stays under ROOT.
    const filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Elaria served at http://localhost:${PORT}  (Ctrl+C to stop)`);
});
