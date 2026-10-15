const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('node:path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../db');
const Vote = require('../models/Vote');

const API_URL = 'http://localhost:5000/api/votes/results';

test('1. Results API rejects requests without a token', async () => {
  const response = await fetch(API_URL);

  assert.equal(response.status, 401);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Authentication token is required.');
});

test('2. Results API rejects an invalid token', async () => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: 'Bearer invalid.test.token'
    }
  });

  assert.equal(response.status, 401);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Invalid or expired authentication token.');
});

test('3. Results API rejects a valid voter token', async () => {
  const secret = process.env.JWT_SECRET;
  assert.ok(secret, 'JWT_SECRET must be configured in server/.env');

  const voterToken = jwt.sign(
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

  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${voterToken}`
    }
  });

  assert.equal(response.status, 403);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Admin access required.');
});

test('4. Vote model declares a unique voter-election index', () => {
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

test('5. Vote model prevents duplicate votes for the same voter and election', async () => {
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