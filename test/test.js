var Server = require(process.env.NNN_COV ? '../lib-cov/server' : '../');
var server = new Server({});

// list of handlers for test server
var testHandlers = [
  'GET /',
  'ALL /static/*',
  'GET /static/my_special_file',
  'GET /index',
  'GET /index/:id',
  'GET /index/special_id',
  'GET /index/:id/:prop',
  'GET /search?id',
  'GET /search?name',
  'GET /search?surname',
  'GET /search?name&surname',
  'ALL 404',
  'ALL 500'
];

// list of requests to pass to the server
var tests = [ {
  url   : '/',        // req.url
  method: 'GET',      // req.method
  args  : [],         // expected additional arguments given to the handler
  route : 'GET /'     // expected handler for the request
}, {
  url   : '/none-existent-url',
  method: 'GET',
  args  : [],
  route : 'ALL 404'
}, {
  url   : '/static/',
  method: 'GET',
  args  : [ '/' ],
  route : 'ALL /static/*'
}, {
  url   : '/static/index.html',
  method: 'GET',
  args  : [ '/index.html' ],
  route : 'ALL /static/*'
}, {
  url   : '/static/lol',
  method: 'GET',
  args  : [ '/lol' ],
  route : 'ALL /static/*'
}, {
  url   : '/static/my_special_file',
  method: 'GET',
  args  : [],
  route : 'GET /static/my_special_file'
}, {
  url   : '/static/my_special_file',
  method: 'POST',
  args  : [ '/my_special_file' ],
  route : 'ALL /static/*'
}, {
  url   : '/index',
  method: 'GET',
  args  : [],
  route : 'GET /index'
}, {
  url   : '/index/',
  method: 'GET',
  args  : [],
  route : 'ALL 404'
}, {
  url   : '/index/100',
  method: 'GET',
  args  : [ '100' ],
  route : 'GET /index/:id'
}, {
  url   : '/index/101',
  method: 'GET',
  args  : [ '101' ],
  route : 'GET /index/:id'
}, {
  url   : '/index/special_id',
  method: 'GET',
  args  : [],
  route : 'GET /index/special_id'
}, {
  url   : '/index/special_id/123',
  method: 'GET',
  args  : [],
  route : 'ALL 404'
}, {
  url   : '/index/123/321',
  method: 'GET',
  args  : [ '123', '321' ],
  route : 'GET /index/:id/:prop'
}, {
  url   : '/index/123/321/',
  method: 'GET',
  args  : [ ],
  route : 'ALL 404'
}, {
  url   : '/search',
  method: 'GET',
  args  : [ ],
  route : 'ALL 404'
}, {
  url   : '/search?id=123',
  method: 'GET',
  args  : [ '123' ],
  route : 'GET /search?id'
}, {
  url   : '/search?name=John',
  method: 'GET',
  args  : [ 'John' ],
  route : 'GET /search?name'
}, {
  url   : '/search?surname=Doe',
  method: 'GET',
  args  : [ 'Doe' ],
  route : 'GET /search?surname'
}, {
  url   : '/search?name=John&surname=Doe',
  method: 'GET',
  args  : [ 'John', 'Doe' ],
  route : 'GET /search?name&surname'
}, {
  url   : '/search?surname=Doe&name=John',
  method: 'GET',
  args  : [ 'John', 'Doe' ],
  route : 'GET /search?name&surname'
}, {
  url   : '/search?surname=Doe&name=John&undefined_argument=1',
  method: 'GET',
  args  : [ 'John', 'Doe' ],
  route : 'GET /search?name&surname'
} ];


var str = function (xs) {
  return xs.length === 0
    ? '[]'
    : '[ ' + xs.map(function (x) { return "'" + x + "'"; }).join(', ') + ' ]';
};

testHandlers.forEach(function (handler) {
  var h = handler.split(' ');
  var url = h[1];
  var method = h[0];
  server.bind(url, method, [], function (req, res) {
    var args = Array.prototype.slice.call(arguments, 2);

    module.exports['Request url        : ' + req.method + ' ' + req.url] = function (t) {
      var h = req.route.split(' ');

      t.ok(
        (h[0] === 'ALL' || h[0] === method) &&
        (url === h[1]),
        'caught by handler: ' + req.route
      );

      t.deepEqual(args, req.args, 'matched arguments: ' + str(req.args) + '\n');

      t.done();
    };
  });
});

// run tests
tests.forEach(function (test) {
  server.dispatch(test, {});
});
