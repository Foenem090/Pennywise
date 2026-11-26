import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractApiErrorMessage, toSafeDisplayMessage } from './apiError.js';

const FALLBACK = 'Unable to complete request. Please try again.';

describe('extractApiErrorMessage', () => {
  it('returns clean string detail for 4xx FastAPI HTTPException responses', () => {
    const err = {
      response: {
        status: 429,
        data: { detail: 'Too many submissions. Please try again in 60 seconds.' },
      },
    };
    assert.equal(
      extractApiErrorMessage(err, FALLBACK),
      'Too many submissions. Please try again in 60 seconds.'
    );
  });

  it('formats a single FastAPI 422 Pydantic email validation error into a clean string', () => {
    const err = {
      response: {
        status: 422,
        data: {
          detail: [
            {
              type: 'value_error',
              loc: ['body', 'email'],
              msg: 'value is not a valid email address: The part after the @-sign is not valid. It should have a period.',
              input: 'a@b',
            },
          ],
        },
      },
    };
    assert.equal(
      extractApiErrorMessage(err, FALLBACK),
      'Value is not a valid email address: The part after the @-sign is not valid. It should have a period.'
    );
  });

  it('formats multiple FastAPI 422 validation objects with field labels when needed', () => {
    const err = {
      response: {
        status: 422,
        data: {
          detail: [
            {
              type: 'string_too_short',
              loc: ['body', 'name'],
              msg: 'String should have at least 2 characters',
              input: 'A',
            },
            {
              type: 'value_error',
              loc: ['body', 'email'],
              msg: 'value is not a valid email address: An email address must have an @-sign.',
              input: 'bad',
            },
            {
              type: 'string_too_short',
              loc: ['body', 'message'],
              msg: 'String should have at least 10 characters',
              input: 'short',
            },
          ],
        },
      },
    };
    assert.equal(
      extractApiErrorMessage(err, FALLBACK),
      'Name: String should have at least 2 characters. Value is not a valid email address: An email address must have an @-sign. Message: String should have at least 10 characters.'
    );
  });

  it('strips Pydantic v2 "Value error, " prefix cleanly and formats field prefix with word boundaries', () => {
    const errWithFieldInMsg = {
      response: {
        status: 422,
        data: {
          detail: [
            {
              type: 'value_error',
              loc: ['body', 'asset'],
              msg: 'Value error, unsupported asset symbol',
            },
          ],
        },
      },
    };
    assert.equal(
      extractApiErrorMessage(errWithFieldInMsg, FALLBACK),
      'Unsupported asset symbol.'
    );

    const errNeedingPrefix = {
      response: {
        status: 422,
        data: {
          detail: [
            {
              type: 'value_error',
              loc: ['body', 'amount'],
              msg: 'Value error, must be greater than zero',
            },
            {
              type: 'value_error',
              loc: ['body', 'id'],
              msg: 'Invalid input provided',
            },
          ],
        },
      },
    };
    assert.equal(
      extractApiErrorMessage(errNeedingPrefix, FALLBACK),
      'Amount: Must be greater than zero. Id: Invalid input provided.'
    );
  });

  it('caps excessive validation error lists cleanly without duplicating items', () => {
    const err = {
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['body', 'a'], msg: 'Field required' },
            { loc: ['body', 'a'], msg: 'Field required' },
            { loc: ['body', 'b'], msg: 'Field required' },
            { loc: ['body', 'c'], msg: 'Field required' },
            { loc: ['body', 'd'], msg: 'Field required' },
          ],
        },
      },
    };
    assert.equal(
      extractApiErrorMessage(err, FALLBACK),
      'A: Field required. B: Field required. C: Field required.'
    );
  });

  it('returns fallback when combined validation messages exceed 300 characters', () => {
    const itemMsg =
      'must follow the strict formatting guideline of alphanumeric characters and spaces without disallowed punctuation marks';
    assert.ok(itemMsg.length < 300);

    const err = {
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['body', 'first_field'], msg: itemMsg },
            { loc: ['body', 'second_field'], msg: itemMsg },
            { loc: ['body', 'third_field'], msg: itemMsg },
          ],
        },
      },
    };
    assert.equal(extractApiErrorMessage(err, FALLBACK), FALLBACK);
  });

  it('falls back safely when detail array is empty or holds unusable objects', () => {
    assert.equal(
      extractApiErrorMessage({ response: { status: 422, data: { detail: [] } } }, FALLBACK),
      FALLBACK
    );
    assert.equal(
      extractApiErrorMessage(
        { response: { status: 422, data: { detail: [{ foo: 'bar' }, null, {}] } } },
        FALLBACK
      ),
      FALLBACK
    );
  });

  it('falls back safely on unexpected object detail shapes without rendering [object Object]', () => {
    const err = {
      response: {
        status: 400,
        data: { detail: { code: 'BAD_PAYLOAD', meta: { nested: true } } },
      },
    };
    const result = extractApiErrorMessage(err, FALLBACK);
    assert.equal(result, FALLBACK);
    assert.ok(!result.includes('object Object'));
  });

  it('extracts message from unexpected object detail when it provides a safe string message', () => {
    const err = {
      response: {
        status: 400,
        data: { detail: { message: 'Email domain is not supported.' } },
      },
    };
    assert.equal(extractApiErrorMessage(err, FALLBACK), 'Email domain is not supported.');
  });

  it('suppresses 5xx server error bodies, stack traces, and HTML error pages', () => {
    const serverErr = {
      response: {
        status: 500,
        data: { detail: 'psycopg.errors.UndefinedTable: relation missing' },
      },
    };
    assert.equal(extractApiErrorMessage(serverErr, FALLBACK), FALLBACK);

    const htmlGatewayErr = {
      response: {
        status: 502,
        data: '<!DOCTYPE html><html><body><h1>502 Bad Gateway</h1></body></html>',
      },
    };
    assert.equal(extractApiErrorMessage(htmlGatewayErr, FALLBACK), FALLBACK);

    const leakedTraceback = {
      response: {
        status: 400,
        data: {
          detail:
            'Traceback (most recent call last):\n  File "app.py", line 12, in sub\nsqlalchemy.exc.OperationalError',
        },
      },
    };
    assert.equal(extractApiErrorMessage(leakedTraceback, FALLBACK), FALLBACK);
  });

  it('returns fallback on network errors, timeouts, or nullish inputs without leaking raw error text', () => {
    assert.equal(
      extractApiErrorMessage(new Error('timeout of 15000ms exceeded'), FALLBACK),
      FALLBACK
    );
    assert.equal(extractApiErrorMessage(null, FALLBACK), FALLBACK);
    assert.equal(extractApiErrorMessage(undefined, FALLBACK), FALLBACK);
  });
});

describe('toSafeDisplayMessage', () => {
  it('preserves ordinary non-empty strings and returns empty string for empty inputs', () => {
    assert.equal(toSafeDisplayMessage('Subscribed successfully!'), 'Subscribed successfully!');
    assert.equal(toSafeDisplayMessage(''), '');
    assert.equal(toSafeDisplayMessage(null), '');
    assert.equal(toSafeDisplayMessage(undefined), '');
  });

  it('safely converts raw validation arrays or objects so Toast never passes objects to React JSX', () => {
    const rawDetail = [{ loc: ['body', 'email'], msg: 'Invalid email address' }];
    assert.equal(toSafeDisplayMessage(rawDetail, FALLBACK), 'Invalid email address.');

    const opaqueObject = { unexpected: { nested: 42 } };
    assert.equal(toSafeDisplayMessage(opaqueObject, FALLBACK), FALLBACK);
    assert.equal(typeof toSafeDisplayMessage(opaqueObject, FALLBACK), 'string');
  });

  it('blocks unsafe HTML or traceback strings passed directly', () => {
    assert.equal(
      toSafeDisplayMessage('<html><body>500 Error</body></html>', FALLBACK),
      FALLBACK
    );
  });

  it('returns fallback for JS Error objects and Axios-style errors without response', () => {
    assert.equal(
      toSafeDisplayMessage(new Error('timeout of 15000ms exceeded'), FALLBACK),
      FALLBACK
    );

    const axiosNetworkError = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 15000ms exceeded',
      request: {},
    };
    assert.equal(toSafeDisplayMessage(axiosNetworkError, FALLBACK), FALLBACK);
    assert.equal(extractApiErrorMessage(axiosNetworkError, FALLBACK), FALLBACK);

    const axiosErrorWithResponse = Object.assign(new Error('Request failed with status 422'), {
      isAxiosError: true,
      response: {
        status: 422,
        data: { detail: [{ loc: ['body', 'email'], msg: 'Invalid email address' }] },
      },
    });
    assert.equal(toSafeDisplayMessage(axiosErrorWithResponse, FALLBACK), 'Invalid email address.');
  });

  it('returns fallback for non-finite numbers while preserving finite numbers and booleans', () => {
    assert.equal(toSafeDisplayMessage(NaN, FALLBACK), FALLBACK);
    assert.equal(toSafeDisplayMessage(Infinity, FALLBACK), FALLBACK);
    assert.equal(toSafeDisplayMessage(-Infinity, FALLBACK), FALLBACK);

    assert.equal(toSafeDisplayMessage(0, FALLBACK), '0');
    assert.equal(toSafeDisplayMessage(42, FALLBACK), '42');
    assert.equal(toSafeDisplayMessage(true, FALLBACK), 'true');
    assert.equal(toSafeDisplayMessage(false, FALLBACK), 'false');
  });
});
