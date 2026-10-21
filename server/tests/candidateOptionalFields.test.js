const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const candidateRoutes = require('../routes/candidateRoutes');

const TEST_SECRET = 'candidate-validation-test-secret';
const app = express();
app.use(express.json());
app.use('/api/candidates', candidateRoutes);

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
  baseUrl = 'http://127.0.0.1:' + server.address().port + '/api/candidates';
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

async function createCandidate(body) {
  return fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

test('candidate creation rejects a non-string description', async () => {
  const response = await createCandidate({
    name: 'Valid Candidate',
    party: 'Valid Party',
    description: 42
  });

  assert.equal(response.status, 400);
  assert.equal(
    (await response.json()).message,
    'Description and election ID must be strings.'
  );
});

test('candidate creation rejects a non-string election ID', async () => {
  const response = await createCandidate({
    name: 'Valid Candidate',
    party: 'Valid Party',
    electionId: { value: 'college-election-2026' }
  });

  assert.equal(response.status, 400);
  assert.equal(
    (await response.json()).message,
    'Description and election ID must be strings.'
  );
});