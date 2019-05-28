'use strict';

const App = require('../lib');
const test = require('awfltst');
const util = require('util');
const request = util.promisify(require('request'));

test('start/stop', async function (t) {
  t.plan(7);

  let app = new App();
  app.on('/', async function () { this.res.end(); });

  await t.throws(() => app.start(), /missing options/, 'missing options');
  await t.throws(() => app.start({}), /missing server config/, 'missing config');
  await t.notThrows(app.start({http: 0}), 'server start');
  let port = app.httpServer.address().port;
  await t.notThrows(request(`http://localhost:${port}`), 'server accepts request');
  await t.notThrows(app.stop(), 'server stop');
  await t.throws(request(`http://localhost:${port}`), /ECONNREFUSED/, 'connection refused');
  await t.throws(app.stop(), /Not running/i, 'cannot stop not running server');
});

test('http dispatch', async function (t) {
  t.plan(6);

  let app = new App();

  app.on('/', async function () {
    this.res.end(JSON.stringify({ handler: '/', args: Array.from(arguments) }));
  });
  app.on('/test/(\\d+)', async function (id) {
    this.res.end(JSON.stringify({ handler: '/test/(\\d+)', args: Array.from(arguments) }));
  });
  app.on('/test?page', async function (page) {
    this.res.end(JSON.stringify({ handler: '/test?page', args: Array.from(arguments) }));
  });
  app.on('/throws', async function () {
    throw new Error('some error');
  });
  app.on('/static/**', async function (path) {
    this.res.end(JSON.stringify({ handler: '/static/**', args: Array.from(arguments) }));
  });
  app.catch.on(404, async function () {
    this.res.statusCode = 404;
    this.res.end(JSON.stringify({ catch: '404', args: Array.from(arguments) }));
  });
  app.catch.on(500, async function (err) {
    this.res.statusCode = 500;
    this.res.end(JSON.stringify({ catch: '500', err: err.message }));
  });

  await app.start({http: 0});
  let port = app.httpServer.address().port;

  let r1 = await request(`http://localhost:${port}`, {timeout: 1000});
  t.eq(JSON.parse(r1.body), { handler: '/', args: [] }, 'root handler matched');

  let r2 = await request(`http://localhost:${port}/test/123`, {timeout: 1000});
  t.eq(JSON.parse(r2.body), { handler: '/test/(\\d+)', args: ['123'] }, '/test/123 matched');

  let r3 = await request(`http://localhost:${port}/test?page=1337`, {timeout: 1000});
  t.eq(JSON.parse(r3.body), { handler: '/test?page', args: ['1337'] }, '/test?page=1337 matched');

  let r4 = await request(`http://localhost:${port}/lol`, {timeout: 1000});
  t.eq(JSON.parse(r4.body), { catch: '404', args: [{code: 404, message: 'Not Found', name: 'HttpError'}] }, '/lol caught by 404 handler');

  let r5 = await request(`http://localhost:${port}/throws`, {timeout: 1000});
  t.eq(JSON.parse(r5.body), { catch: '500', err: 'some error' }, '/throws caught by error handler');

  let r6 = await request(`http://localhost:${port}/static/my/resource`, {timeout: 1000});
  t.eq(JSON.parse(r6.body), { handler: '/static/**', args: ['my/resource'] }, '/static matched');

  await app.stop();
});

test('https', async function (t) {
  t.plan(2);

  // 1024 bit test key
  let key =
    '-----BEGIN PRIVATE KEY-----\n' +
    'MIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGBAKpCG1h6ENoJ8q9W\n' +
    'aahs5xB8ilKNwd40Me2Q5/OMKR/zYdplKIuPGL/p//dznvKyuTsXEorIZGdaQ8S3\n' +
    'EnYCLKvpUGlBIrDFH1aXL1l3hCPB/ZpBG/BZqnSx1vipFr1d2jmnaZ3/UdPevzTE\n' +
    'ghytMRGq7fikKUE2bqVOud8yb8atAgMBAAECgYBzg0ZqUOb+B6HPtCEbVEewt85h\n' +
    'FCxkRaVaOOYmJwH/23CYa+mGRh/UlT5E9PzyTK+/l3fNEQiN1oAEBvFPf0oufVdZ\n' +
    'QsiCYjtxG6y5jTe+9KXNiv00TB/5HIY+IRsEXPXzMZrgNLxNHHSoPUc1mGCPPGDb\n' +
    'rIqjTzHfZvUckfgtQQJBANSDWXecBNWP3OOuWFi9U6RsebWN4oKfGG5dFBYiYfpy\n' +
    'B/8hGexIqLMa71roCWrojtj/sseBUTCihZ/sFrgDsJcCQQDNGTTaX6zjIwgTsGpy\n' +
    'mQ02IqnMb+9jCpfikfeCItiIYTEnPClWw4QD7ZI6n8Uk3JhkxMXUsog9UMir1HzO\n' +
    'rydbAkBkZ7q5nGlcTaBbol/zbWA7a1UFxoeil3B/lFKNMqmAHqhQjl8lGB88oBk+\n' +
    'pirs6/ux4v2g7SRjCiaALJd/UZ75AkBoXBITp6kt7g5XDmYrp4scZ6jkmHRDfglo\n' +
    'xQMe2aI6StIa97bFKjkLUqAcal2C8ygr5iAPqUQ/htKE9FsJRACPAkAzLa9uNhYB\n' +
    'An85SOLCSf50MWgFUCil4VT0rXN/w0jBWDHo/xUJFQSEZPy8Z9OYcO2BNr1PSJ8I\n' +
    '4j9q+L5T2YqC\n' +
    '-----END PRIVATE KEY-----\n';
  let cert =
    '-----BEGIN CERTIFICATE-----\n' +
    'MIICWDCCAcGgAwIBAgIJAP/tscwN0c1cMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV\n' +
    'BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX\n' +
    'aWRnaXRzIFB0eSBMdGQwHhcNMTYwMzExMTkxMjExWhcNMjYwMzA5MTkxMjExWjBF\n' +
    'MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50\n' +
    'ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKB\n' +
    'gQCqQhtYehDaCfKvVmmobOcQfIpSjcHeNDHtkOfzjCkf82HaZSiLjxi/6f/3c57y\n' +
    'srk7FxKKyGRnWkPEtxJ2Aiyr6VBpQSKwxR9Wly9Zd4Qjwf2aQRvwWap0sdb4qRa9\n' +
    'Xdo5p2md/1HT3r80xIIcrTERqu34pClBNm6lTrnfMm/GrQIDAQABo1AwTjAdBgNV\n' +
    'HQ4EFgQUEzlFXaPyPCwVypfX2oPVDZitzl8wHwYDVR0jBBgwFoAUEzlFXaPyPCwV\n' +
    'ypfX2oPVDZitzl8wDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOBgQB0YrXQ\n' +
    'urMmcfJ2eTNJZNzpCMbPIB4MHnOX6vKOPoCB4SLijvz4lM90eSoD4MzQV1z+pZcI\n' +
    'towC3kyNtq3S2Y3IBe8SfiLQSI0VYWnLwVDeHBb8+9sHf29ve07ZpPzronRD564r\n' +
    'ALwWpXumAgvWJpPD6pn2wYmd9SG67LDESQ1l4Q==\n' +
    '-----END CERTIFICATE-----\n';

  let app = new App();
  app.on('/', async function () {
    t.ok(true, 'handler called');
    this.res.end();
  });

  await app.start({https: 0, key, cert});
  let port = app.httpsServer.address().port;
  await t.notThrows(
    request(`https://localhost:${port}`, {timeout: 1000, rejectUnauthorized: false}),
    'server accepts request'
  );
  await app.stop();
});

test('app failures', async function (t) {
  t.plan(4);

  let app1 = new App();
  await app1.start({http: 0});
  let port1 = app1.httpServer.address().port;
  let r1 = await request(`http://localhost:${port1}`, {timeout: 1000});
  t.eq(r1.statusCode, 500, 'no error handler throws out');
  await app1.stop();

  let app2 = new App();
  app2.catch.all(500, async function () {
    throw new Error('error');
  });
  await app2.start({http: 0});
  let port2 = app2.httpServer.address().port;
  let r2 = await request(`http://localhost:${port2}`, {timeout: 1000});
  t.eq(r2.statusCode, 500, 'error in error handler throws out');
  await app2.stop();

  let app3 = new App();
  app3.use(async function (next) {
    await next().catch(() => {
      t.ok(true, 'throw out caught in global middleware');
    });
    this.res.end();
  });
  await app3.start({http: 0});
  let port3 = app3.httpServer.address().port;
  let r3 = await request(`http://localhost:${port3}`, {timeout: 1000});
  t.eq(r3.statusCode, 200, 'response ok');
  await app3.stop();
});
