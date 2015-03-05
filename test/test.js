var server = require('../lib/server');

var testHandlers = [
  '/',
  '404',
  '500'
];

var tests = [ {
  url  : '/',
  args : [],
  route: '/'
}, {
  url  : '/none-existent-url',
  args : [],
  route: '404'
} ];


var str = function (xs) {
  return xs.length === 0
    ? '[]'
    : '[ ' + xs.map(function (x) { return "'" + x + "'"; }).join(', ') + ' ]';
};

testHandlers.forEach(function (url) {
  server.on(url, [], function (req, res) {
    var args = Array.prototype.slice.call(arguments, 2);

    module.exports['Request url        : ' + req.url] = function (t) {
      t.deepEqual(url, req.route, 'caught by handler: ' + req.route);
      t.deepEqual(args, req.args, 'match arguments  : ' + str(req.args));
      t.done();
    };
  });
});

server.router.print();

tests.forEach(function (test) {
  server.dispatch(test, {});
});
