const test = require('node:test');
const assert = require('node:assert/strict');
const connectDB = require('../db');

test('database connection failures reject instead of terminating the process', async () => {
  const originalUri = process.env.MONGO_URI;
  process.env.MONGO_URI = 'not-a-valid-mongodb-uri';

  try {
    await assert.rejects(connectDB());
  } finally {
    if (originalUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = originalUri;
  }
});
