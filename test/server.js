'use strict';

const App = require('../lib');
const test = require('bandage');
const request = require('co-request');

test('start/stop', function *(t) {
  t.plan(7);

  let app = new App();
  app.on('/', function *() { this.res.end(); });

  yield t.throws(() => app.start(), /missing options/, 'missing options');
  yield t.throws(() => app.start({}), /missing server config/, 'missing config');
  yield t.notThrows(app.start({ http: 8080 }), 'server start');
  yield t.notThrows(request('http://localhost:8080'), 'server accepts request');
  yield t.notThrows(app.stop(), 'server stop');
  yield t.throws(request('http://localhost:8080'), /ECONNREFUSED/, 'connection refused');
  yield t.throws(app.stop(), /Not running/, 'cannot stop not running server');
});

test('dispatch', function *(t) {
  t.plan(6);

  let app = new App();

  app.on('/', function *() {
    this.res.end(JSON.stringify({ handler: '/', args: Array.from(arguments) }));
  });
  app.on('/test/(\\d+)', function *(id) {
    this.res.end(JSON.stringify({ handler: '/test/(\\d+)', args: Array.from(arguments) }));
  });
  app.on('/test?page', function *(page) {
    this.res.end(JSON.stringify({ handler: '/test?page', args: Array.from(arguments) }));
  });
  app.on('/throws', function *() {
    throw new Error('some error');
  });
  app.on('/static/**', function *(path) {
    this.res.end(JSON.stringify({ handler: '/static/**', args: Array.from(arguments) }));
  });
  app.catch.on(404, function *() {
    this.res.statusCode = 404;
    this.res.end(JSON.stringify({ catch: '404', args: Array.from(arguments) }));
  });
  app.catch.on(500, function *(err) {
    this.res.statusCode = 500;
    this.res.end(JSON.stringify({ catch: '500', err: err.message }));
  });

  yield app.start({ http: 8080 });

  let r1 = yield request('http://localhost:8080', {timeout: 1000});
  t.eq(JSON.parse(r1.body), { handler: '/', args: [] }, 'root handler matched');

  let r2 = yield request('http://localhost:8080/test/123', {timeout: 1000});
  t.eq(JSON.parse(r2.body), { handler: '/test/(\\d+)', args: ['123'] }, '/test/123 matched');

  let r3 = yield request('http://localhost:8080/test?page=1337', {timeout: 1000});
  t.eq(JSON.parse(r3.body), { handler: '/test?page', args: ['1337'] }, '/test?page=1337 matched');

  let r4 = yield request('http://localhost:8080/lol', {timeout: 1000});
  t.eq(JSON.parse(r4.body), { catch: '404', args: [] }, '/lol caught by 404 handler');

  let r5 = yield request('http://localhost:8080/throws', {timeout: 1000});
  t.eq(JSON.parse(r5.body), { catch: '500', err: 'some error' }, '/throws caught by error handler');

  let r6 = yield request('http://localhost:8080/static/my/resource', {timeout: 1000});
  t.eq(JSON.parse(r6.body), { handler: '/static/**', args: ['my/resource'] }, '/static matched');

  yield app.stop();
});
