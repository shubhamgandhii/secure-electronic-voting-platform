const test = require('node:test');
const { before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test('registration rejects passwords that exceed bcrypt UTF-8 byte limit', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unicode Password User',
      email: 'unicode-password@example.com',
      password: '\u00e9'.repeat(37)
    })
  });

  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(
    data.message,
    'Password must contain 12 to 72 characters and no more than 72 UTF-8 bytes.'
  );
});
