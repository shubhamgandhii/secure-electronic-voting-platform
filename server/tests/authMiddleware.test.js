const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

const TEST_SECRET = 'auth-middleware-test-secret';
const TOKEN_OPTIONS = {
  issuer: 'securevote',
  audience: 'securevote-users',
  expiresIn: '5m'
};

function invokeMiddleware(authorization) {
  const req = { headers: {} };
  if (authorization !== undefined) req.headers.authorization = authorization;

  const result = { status: null, body: null, nextCalled: false };
  const res = {
    status(code) {
      result.status = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    }
  };

  authMiddleware(req, res, () => {
    result.nextCalled = true;
    result.user = req.user;
  });

  return result;
}

test('auth middleware rejects expired tokens', () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const token = jwt.sign(
      { sub: 'voter-1', role: 'voter' },
      TEST_SECRET,
      { ...TOKEN_OPTIONS, expiresIn: '-1s' }
    );
    const result = invokeMiddleware(`Bearer ${token}`);

    assert.equal(result.status, 401);
    assert.equal(result.nextCalled, false);
    assert.equal(
      result.body.message,
      'Invalid or expired authentication token.'
    );
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test('auth middleware rejects tokens for a different audience', () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const token = jwt.sign(
      { sub: 'voter-1', role: 'voter' },
      TEST_SECRET,
      { ...TOKEN_OPTIONS, audience: 'another-service' }
    );
    const result = invokeMiddleware(`Bearer ${token}`);

    assert.equal(result.status, 401);
    assert.equal(result.nextCalled, false);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test('auth middleware exposes only the verified subject and role to routes', () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const token = jwt.sign(
      { sub: 'voter-1', role: 'voter', email: 'private@example.com' },
      TEST_SECRET,
      TOKEN_OPTIONS
    );
    const result = invokeMiddleware(`Bearer ${token}`);

    assert.equal(result.nextCalled, true);
    assert.deepEqual(result.user, { id: 'voter-1', role: 'voter' });
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
