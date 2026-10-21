const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const voteRoutes = require('../routes/voteRoutes');

const TEST_SECRET = 'vote-authorization-test-secret';
const app = express();
app.use(express.json());
app.use('/api/votes', voteRoutes);

let server;
let baseUrl;
let token;

test.before(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  token = jwt.sign(
    { sub: '507f1f77bcf86cd799439012', role: 'admin' },
    TEST_SECRET,
    {
      expiresIn: '5m',
      issuer: 'securevote',
      audience: 'securevote-users'
    }
  );
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = 'http://127.0.0.1:' + server.address().port + '/api/votes';
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test('an administrator token cannot submit a vote', async () => {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ candidateId: '507f1f77bcf86cd799439013' })
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'Only voters can submit a vote.'
  });
});