const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual web helper against isolated HTTP servers, without changing
// the running app, customer data, or the development API.
const source = readFileSync(resolve(__dirname, '../apps/web/lib/order-api.ts'), 'utf8');
const context = { exports: {}, fetch, AbortSignal, setTimeout };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText, context);
const { fetchOrderData, OrderApiResponseError, OrderApiUnavailableError } = context.exports;
const headers = { Authorization: 'Bearer isolated-test-session' };

async function serve(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}/dashboard/orders`;
}

test('recovers from a dropped connection and keeps authenticated GET requests', async (t) => {
  const requests = [];
  const url = await serve(t, (req, res) => {
    requests.push({ method: req.method, auth: req.headers.authorization, path: req.url });
    if (requests.length === 1) return req.socket.destroy();
    res.end(JSON.stringify({ orders: [{ id: 'saved-order' }] }));
  });
  const data = await fetchOrderData(url, headers);
  assert.equal(data.orders[0].id, 'saved-order');
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.method, 'GET');
    assert.equal(request.auth, headers.Authorization);
    assert.equal(request.path, '/dashboard/orders');
  }
});

test('recovers when the API responds 503 during a restart', async (t) => {
  let requests = 0;
  const url = await serve(t, (req, res) => {
    requests += 1;
    res.statusCode = requests < 3 ? 503 : 200;
    res.end(JSON.stringify({ orders: [{ id: 'saved-order' }] }));
  });
  assert.equal((await fetchOrderData(url, headers)).orders[0].id, 'saved-order');
  assert.equal(requests, 3);
});

test('preserves authentication and missing-order errors without retry or fallback', async (t) => {
  for (const status of [401, 403, 404]) {
    let requests = 0;
    const url = await serve(t, (req, res) => {
      requests += 1;
      res.writeHead(status).end('{}');
    });
    await assert.rejects(fetchOrderData(url, headers), (error) =>
      error instanceof OrderApiResponseError && error.status === status);
    assert.equal(requests, 1);
  }
});

test('persistent connection failures produce a recoverable error, never an empty order list', async (t) => {
  let requests = 0;
  const url = await serve(t, (req) => {
    requests += 1;
    req.socket.destroy();
  });
  await assert.rejects(fetchOrderData(url, headers), OrderApiUnavailableError);
  assert.equal(requests, 3);
});

test('persistent API failures produce the same recoverable error', async (t) => {
  const url = await serve(t, (req, res) => res.writeHead(500).end('{}'));
  await assert.rejects(fetchOrderData(url, headers), OrderApiUnavailableError);
});

test('times out when the API accepts a connection but never completes its response', async (t) => {
  let requests = 0;
  const url = await serve(t, (req, res) => {
    requests += 1;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write('{"orders":');
  });
  const started = Date.now();
  await assert.rejects(fetchOrderData(url, headers), OrderApiUnavailableError);
  assert.equal(requests, 1);
  assert.ok(Date.now() - started < 11000, 'timeout must cover reading the response body too');
});
