#!/usr/bin/env node

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || process.argv[2] || 4173);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const requestedPath = decodeURIComponent(url.pathname);
    let filePath = path.resolve(root, `.${requestedPath}`);

    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) filePath = path.join(filePath, 'index.html');
    const body = await fs.promises.readFile(filePath);
    response.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Kihon style guide available at http://127.0.0.1:${port}/style-guide/`);
});
