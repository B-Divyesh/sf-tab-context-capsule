import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('dist/site');
const port = Number(process.env.SITE_PORT || 4173);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.webp', 'image/webp'],
  ['.avif', 'image/avif'], ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'], ['.zip', 'application/zip']
]);

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const candidate = resolve(root, `.${pathname}`);
    if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) throw new Error('invalid path');
    let file = candidate;
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      await stat(file);
    } catch {
      file = resolve(root, '404.html');
      response.statusCode = 404;
    }
    const body = await readFile(file);
    response.setHeader('Content-Type', types.get(extname(file)) || 'application/octet-stream');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method === 'HEAD') response.end();
    else response.end(body);
  } catch {
    response.statusCode = 500;
    response.end('Static preview failed.');
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static preview listening on http://127.0.0.1:${port}\n`);
});
