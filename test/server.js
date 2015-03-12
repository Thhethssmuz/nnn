var log = require('logule').init(module).mute('info', 'error');
var Server = require(process.env.NNN_COV ? '../lib-cov/server' : '../');
var server = new Server();
var request = require('request');

var host = 'http://localhost:8080';

var testHandlers = [
  'GET /',
  'GET /throwmiddleware throw',
  'POST / m1 m2',
  'POST m2',
  'ALL /index/*',
  'ALL /index/:id',
  'ALL /index/:id?name',
  'ALL /test?arg1&arg2',
  'ALL /test?arg1&arg2 m1'
];

testHandlers.forEach(function (handler) {
  var hs = handler.split(' ');
  server.bind(hs[1], hs[0], hs.slice(2), function (req, res) {
    var r = {
      handler   : hs[0] + ' ' + hs[1],
      method    : hs[0],
      url       : hs[1],
      middleware: hs.slice(2),
      args      : Array.prototype.slice.call(arguments, 2).map(function (arg) {
                    return typeof arg === 'function' ? '[Function]' : arg;
                  }),
      extra     : res.extra
    };
    res.end(JSON.stringify(r));
  });
});

server.on('m1', function (req, res, callback) {
  res.extra = 'm1 called';
  callback(req, res);
});

server.on('/throw', function (req, res) { throw 'handler error'; });
server.on('throw',  function (req, res) { throw 'middleware error'; });

server.on('/stop', function (req, res) {
  process.exit();
});

server.start();
server.cfg = {http: 8080};
server.start();

//-----------------------------------------------------------------------------

module.exports.root = function (t) {
  request.get(host+'/', function (err, res, body) {
    var r = JSON.parse(body);

    t.strictEqual(res.statusCode, 200, 'status code');
    t.strictEqual(res.statusMessage, 'OK', 'status message');
    t.strictEqual(r.handler, 'GET /', 'handler');
    t.deepEqual(r.middleware, [], 'middleware');
    t.deepEqual(r.args, [], 'arguments');

    t.done();
  });
};

module.exports.middleware = function (t) {
  request.post(host+'/', function (err, res, body) {
    var r = JSON.parse(body);

    t.strictEqual(res.statusCode, 200, 'status code');
    t.strictEqual(res.statusMessage, 'OK', 'status message');
    t.strictEqual(r.handler, 'POST m2', 'handler');
    t.deepEqual(r.middleware, [], 'middleware');
    t.deepEqual(r.args, ['[Function]'], 'arguments');
    t.deepEqual(r.extra, 'm1 called', 'middleware called in order');

    t.done();
  });
};

module.exports.variable = function (t) {
  request.get(host+'/index/123', function (err, res, body) {
    var r = JSON.parse(body);

    t.strictEqual(res.statusCode, 200, 'status code');
    t.strictEqual(res.statusMessage, 'OK', 'status message');
    t.strictEqual(r.handler, 'ALL /index/:id', 'handler');
    t.deepEqual(r.middleware, [], 'middleware');
    t.deepEqual(r.args, ['123'], 'arguments');

    t.done();
  });
};
module.exports.catchAll = function (t) {
  request.get(host+'/index/catch/all', function (err, res, body) {
    var r = JSON.parse(body);

    t.strictEqual(res.statusCode, 200, 'status code');
    t.strictEqual(res.statusMessage, 'OK', 'status message');
    t.strictEqual(r.handler, 'ALL /index/*', 'handler');
    t.deepEqual(r.middleware, [], 'middleware');
    t.deepEqual(r.args, ['/catch/all'], 'arguments');

    t.done();
  });
};
module.exports.query = function (t) {
  request.get(host+'/index/123?name=John%20Doe', function (err, res, body) {
    var r = JSON.parse(body);

    t.strictEqual(res.statusCode, 200, 'status code');
    t.strictEqual(res.statusMessage, 'OK', 'status message');
    t.strictEqual(r.handler, 'ALL /index/:id?name', 'handler');
    t.deepEqual(r.middleware, [], 'middleware');
    t.deepEqual(r.args, ['123', 'John Doe'], 'arguments');

    t.done();
  });
};

module.exports.overwrite = function (t) {
  request.post(host+'/test?arg1=1&arg2=2', function (err, res, body) {
    var r = JSON.parse(body);

    t.strictEqual(res.statusCode, 200, 'status code');
    t.strictEqual(res.statusMessage, 'OK', 'status message');
    t.strictEqual(r.handler, 'ALL /test?arg1&arg2', 'handler');
    t.deepEqual(r.middleware, ['m1'], 'middleware');
    t.deepEqual(r.args, ['1', '2'], 'arguments');
    t.deepEqual(r.extra, 'm1 called', 'middleware called')

    t.done();
  });
};

module.exports.notFound = function (t) {
  request.get(host+'/non-existent-url', function (err, res, body) {
    t.strictEqual(res.statusCode, 404, 'status code');
    t.strictEqual(res.statusMessage, 'Not Found', 'status message');
    t.done();
  });
};
module.exports.error = function (t) {
  request.get(host+'/throw', function (err, res, body) {
    t.strictEqual(res.statusCode, 500, 'status code');
    t.strictEqual(res.statusMessage, 'Internal Server Error', 'status message');
    t.done();
  });
};
module.exports.middlewareError = function (t) {
  request.get(host+'/throwmiddleware', function (err, res, body) {
    t.strictEqual(res.statusCode, 500, 'status code');
    t.strictEqual(res.statusMessage, 'Internal Server Error', 'status message');
    t.done();
    request.get(host+'/stop', function (err, res, body) {});
  });
};
