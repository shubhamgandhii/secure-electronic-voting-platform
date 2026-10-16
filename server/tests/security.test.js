
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('node:path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../db');
const Vote = require('../models/Vote');

const BASE_URL = 'http://localhost:5000/api';

function createVoterToken() {
  const secret = process.env.JWT_SECRET;
  assert.ok(secret, 'JWT_SECRET must be configured in server/.env');

  return jwt.sign(
    {
      sub: '507f1f77bcf86cd799439011',
      role: 'voter'
    },
    secret,
    {
      expiresIn: '5m',
      issuer: 'securevote',
      audience: 'securevote-users'
    }
  );
}

test('1. Results API rejects requests without a token', async () => {
  const response = await fetch(`${BASE_URL}/votes/results`);

  assert.equal(response.status, 401);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Authentication token is required.');
});

test('2. Results API rejects an invalid token', async () => {
  const response = await fetch(`${BASE_URL}/votes/results`, {
    headers: {
      Authorization: 'Bearer invalid.test.token'
    }
  });

  assert.equal(response.status, 401);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Invalid or expired authentication token.');
});

test('3. A voter cannot access administrator-only results', async () => {
  const response = await fetch(`${BASE_URL}/votes/results`, {
    headers: {
      Authorization: `Bearer ${createVoterToken()}`
    }
  });

  assert.equal(response.status, 403);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Admin access required.');
});

test('4. A voter cannot add a candidate', async () => {
  const response = await fetch(`${BASE_URL}/candidates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createVoterToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Security Test Candidate',
      party: 'Test Party'
    })
  });

  assert.equal(response.status, 403);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Only an admin can add candidates.');
});

test('5. Registration rejects missing fields', async () => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: '',
      email: '',
      password: ''
    })
  });

  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Name, email and password are required.');
});

test('6. Registration rejects an invalid email address', async () => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test User',
      email: 'invalid-email',
      password: 'TestPassword123'
    })
  });

  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Please provide a valid email address.');
});

test('7. Vote model declares a unique voter-election index', () => {
  const indexes = Vote.schema.indexes();

  const uniqueVoteIndex = indexes.find(([fields, options]) =>
    fields.voterId === 1 &&
    fields.electionId === 1 &&
    options.unique === true
  );

  assert.ok(
    uniqueVoteIndex,
    'A unique voterId + electionId index should exist'
  );
});

test('8. MongoDB rejects duplicate votes for the same voter and election', async () => {
  process.env.MONGO_URI =
    'mongodb://127.0.0.1:27017/securevote_test?replicaSet=rs0';

  try {
    await connectDB();

    assert.equal(
      mongoose.connection.name,
      'securevote_test',
      'Test must use the separate securevote_test database'
    );

    await Vote.init();

    const indexes = await Vote.collection.indexes();

    const uniqueVoteIndex = indexes.find(index =>
      index.key.voterId === 1 &&
      index.key.electionId === 1 &&
      index.unique === true
    );

    assert.ok(
      uniqueVoteIndex,
      'Unique voter-election index must exist in MongoDB'
    );

    const voterId = new mongoose.Types.ObjectId();
    const candidateId = new mongoose.Types.ObjectId();
    const electionId = 'integration-test-election';

    try {
      await Vote.create({
        voterId,
        candidate: candidateId,
        electionId
      });

      await assert.rejects(
        Vote.create({
          voterId,
          candidate: candidateId,
          electionId
        }),
        error => error.code === 11000
      );
    } finally {
      await Vote.deleteMany({ voterId, electionId });
    }
  } finally {
    await mongoose.disconnect();
  }
});
test('9. Login is rate-limited after too many attempts', async () => {
  const responses = [];

  for (let i = 0; i < 6; i++) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'ratelimit-test@example.com',
        password: 'WrongPassword123!'
      })
    });

    responses.push(response.status);
  }

  assert.equal(
    responses[5],
    429,
    'The sixth login attempt should be rate-limited'
  );
});

function createAdminToken() {
  const secret = process.env.JWT_SECRET;
  assert.ok(secret, 'JWT_SECRET must be configured in server/.env');

  return jwt.sign(
    {
      sub: '507f1f77bcf86cd799439012',
      role: 'admin'
    },
    secret,
    {
      expiresIn: '5m',
      issuer: 'securevote',
      audience: 'securevote-users'
    }
  );
}

test('10. Candidate creation rejects missing name and party', async () => {
  const response = await fetch(`${BASE_URL}/candidates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createAdminToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: '', party: '' })
  });

  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.message, 'Candidate name and party are required.');
});

test('11. Candidate creation rejects a name shorter than two characters', async () => {
  const response = await fetch(`${BASE_URL}/candidates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createAdminToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'A', party: 'Test Party' })
  });

  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(
    data.message,
    'Candidate name must contain 2 to 80 characters.'
  );
});

test('12. Candidate creation rejects a party name longer than 100 characters', async () => {
  const response = await fetch(`${BASE_URL}/candidates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createAdminToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Candidate',
      party: 'P'.repeat(101)
    })
  });

  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.message, 'Party name cannot exceed 100 characters.');
});

test('13. Candidate creation rejects a description longer than 500 characters', async () => {
  const response = await fetch(`${BASE_URL}/candidates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createAdminToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Candidate',
      party: 'Test Party',
      description: 'D'.repeat(501)
    })
  });

  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.message, 'Description cannot exceed 500 characters.');
});

test('14. Registration rejects a password shorter than 12 characters', async () => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Password Test User',
      email: 'short-password-test@example.com',
      password: 'Short123!'
    })
  });

  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(
    data.message,
    'Password must contain 12 to 72 characters.'
  );
});

test('15. Registration rejects a password longer than 72 characters', async () => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Password Test User',
      email: 'long-password-test@example.com',
      password: 'P'.repeat(73)
    })
  });

  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(
    data.message,
    'Password must contain 12 to 72 characters.'
  );
});
test('Candidate listing requires authentication', async () => {
  const response = await fetch(`${BASE_URL}/candidates`);

  assert.equal(response.status, 401);
  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Authentication token is required.');
});

test('An authenticated voter can list candidates without exposing internal fields', async () => {
  const response = await fetch(`${BASE_URL}/candidates`, {
    headers: {
      Authorization: `Bearer ${createVoterToken()}`
    }
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.count, data.candidates.length);

  for (const candidate of data.candidates) {
    assert.equal(typeof candidate.name, 'string');
    assert.equal(typeof candidate.party, 'string');
    assert.equal(Object.hasOwn(candidate, '__v'), false);
  }
});
