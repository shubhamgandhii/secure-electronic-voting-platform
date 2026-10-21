const test = require('node:test');
const assert = require('node:assert/strict');

const configuredOrigin = 'https://voters.example.test';
process.env.CLIENT_ORIGIN = configuredOrigin;

const { app } = require('../server');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test('CORS allows the configured frontend origin', async () => {
  const response = await fetch(baseUrl + '/api/health', {
    headers: { Origin: configuredOrigin }
  });

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    configuredOrigin
  );
});