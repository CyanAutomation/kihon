#!/usr/bin/env node

import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';

const defaultRoot = path.resolve(__dirname, '..');
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

export function createStaticServer(root = defaultRoot): http.Server {
  const staticRoot = path.resolve(root);
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const requestedPath = decodeURIComponent(url.pathname);
      let filePath = path.resolve(staticRoot, `.${requestedPath}`);

      if (filePath !== staticRoot && !filePath.startsWith(`${staticRoot}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const stats = await fs.promises.stat(filePath);
      if (stats.isDirectory()) filePath = path.join(filePath, 'index.html');
      const body = await fs.promises.readFile(filePath);
      response.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
      response.end(body);
    } catch (error) {
      const missing = error instanceof Error && 'code' in error && error.code === 'ENOENT';
      response.writeHead(missing ? 404 : 500).end('Not found');
    }
  });
}

function startServer(port: number): void {
  createStaticServer().listen(port, '127.0.0.1', () => {
    console.log(`Kihon style guide available at http://127.0.0.1:${port}/style-guide/`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  startServer(Number(process.env.PORT || process.argv[2] || 4173));
}
