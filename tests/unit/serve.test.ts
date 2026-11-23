import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { createStaticServer } from '../../scripts/serve.ts';

test('serves files, resolves directory indexes, and handles invalid paths', async (context) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kihon-static-server-'));
  const root = path.join(tempRoot, 'site');
  await fs.mkdir(path.join(root, 'docs'), { recursive: true });
  await fs.writeFile(path.join(root, 'docs', 'index.html'), '<h1>Docs</h1>');
  await fs.writeFile(path.join(root, 'theme.css'), 'body { color: red; }');
  await fs.writeFile(path.join(root, 'opaque.bin'), 'opaque');
  await fs.writeFile(path.join(tempRoot, 'outside.txt'), 'outside');

  const server = createStaticServer(root);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  context.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const stylesheet = await fetch(`${baseUrl}/theme.css`);
  assert.equal(stylesheet.status, 200);
  assert.equal(stylesheet.headers.get('content-type'), 'text/css; charset=utf-8');
  assert.equal(await stylesheet.text(), 'body { color: red; }');

  const directory = await fetch(`${baseUrl}/docs/`);
  assert.equal(directory.status, 200);
  assert.equal(directory.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(await directory.text(), '<h1>Docs</h1>');

  const unknownType = await fetch(`${baseUrl}/opaque.bin`);
  assert.equal(unknownType.headers.get('content-type'), 'application/octet-stream');

  const missing = await fetch(`${baseUrl}/missing.txt`);
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), 'Not found');

  const traversal = await fetch(`${baseUrl}/%2e%2e%2foutside.txt`);
  assert.equal(traversal.status, 403);
  assert.equal(await traversal.text(), 'Forbidden');

  const malformedEncoding = await fetch(`${baseUrl}/%E0%A4%A`);
  assert.equal(malformedEncoding.status, 500);
  assert.equal(await malformedEncoding.text(), 'Internal server error');
});
