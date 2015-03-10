var Server = require(process.env.NNN_COV ? '../lib-cov/server' : '../');
var server = new Server({});

server.on('/', ['m1', 'm2', 'm3'], function (req, res) {
  res.state.push('/');
});
server.on('m1', function (req, res, callback) {
  res.state.push('m1');
  callback(req, res);
});
server.on('m2', function (req, res, callback) {
  res.state.push('m2');
  callback(req, res);
});
server.on('m3', function (req, res, callback) {
  res.state.push('m3');
  callback(req, res);
});

module.exports.middleware = function (t) {
  var res = {state: []};
  server.dispatch({url: '/'}, res);
  
  t.strictEqual(res.state[0], 'm1', 'middleware-1 ran in order');
  t.strictEqual(res.state[1], 'm2', 'middleware-2 ran in order');
  t.strictEqual(res.state[2], 'm3', 'middleware-3 ran in order');
  t.strictEqual(res.state[3], '/', 'main handler ran after middleware');
  t.done();
};
