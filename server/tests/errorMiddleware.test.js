const test = require('node:test');
const assert = require('node:assert/strict');
const errorMiddleware = require('../middleware/errorMiddleware');

function handle(error) {
  const result = { status: null, body: null, nextError: null };
  const res = {
    headersSent: false,
    status(code) {
      result.status = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    }
  };

  errorMiddleware(error, {}, res, nextError => {
    result.nextError = nextError;
  });
  return result;
}

test('API error middleware maps malformed JSON to a stable client error', () => {
  const result = handle({ type: 'entity.parse.failed', message: 'parser detail' });
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    success: false,
    message: 'Request body must contain valid JSON.'
  });
});

test('API error middleware rejects oversized request bodies', () => {
  const result = handle({ type: 'entity.too.large' });
  assert.equal(result.status, 413);
  assert.equal(result.body.success, false);
});

test('API error middleware hides unexpected internal error details', () => {
  const result = handle(new Error('database password leaked'));
  assert.equal(result.status, 500);
  assert.equal(result.body.success, false);
  assert.equal(result.body.message, 'An unexpected server error occurred.');
  assert.doesNotMatch(JSON.stringify(result.body), /password leaked/);
});

test('API error middleware delegates after response headers are sent', () => {
  const error = new Error('stream failed');
  const result = { nextError: null };
  errorMiddleware(error, {}, { headersSent: true }, nextError => {
    result.nextError = nextError;
  });
  assert.equal(result.nextError, error);
});
