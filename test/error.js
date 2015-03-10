var Server = require(process.env.NNN_COV ? '../lib-cov/server' : '../');
var server = new Server({});

server.on('/1', ['bad-meddleware'], function (req, res) {});
server.on('/2', function (req, res) { throw 'error-2'; });

server.on('bad-meddleware', function (req, res, callback) { throw 'error-1'; });

server.on('404', function (req, res) {
  module.exports['not-found'] = function (t) {
    t.strictEqual(req.url, '/3', '404');
    t.done();
  };
});
server.on('500', function (req, res, err) {
  module.exports[err] = function (t) {
    t.strictEqual(err, req.expected, '500');
    t.done();
  };
});

server.dispatch({url: '/1', expected: 'error-1'}, {});
server.dispatch({url: '/2', expected: 'error-2'}, {});
server.dispatch({url: '/3', expected: 'not-found'}, {});
