# nnn
[![npm status](http://img.shields.io/npm/v/nnn.svg)](https://www.npmjs.org/package/nnn)
[![build status](https://secure.travis-ci.org/Thhethssmuz/nnn.svg)](http://travis-ci.org/Thhethssmuz/nnn)
[![coverage status](http://img.shields.io/coveralls/Thhethssmuz/nnn.svg)](https://coveralls.io/r/Thhethssmuz/nnn)
[![dependency status](https://david-dm.org/thhethssmuz/nnn.svg)](https://david-dm.org/thhethssmuz/nnn)

## API

### new App(opts) :: App

Create a new App instance. 

- `opts.trim`: Trim trailing `/`'s from the router, i.e. treat the url `/my/path` and `/my/path/` as equals. Default is `false`.
- `opts.case`: Make the router case insensitive, default is `false`.
- `opts.context`: set the context for the router, i.e. the context each handler will be called in. By default the context is an object with two keys `req` and `res`, which corresponds to the request and response object gotten from Node.js. The context should be a class and will be instantiated using the `new` keyword. The constructor is also passed the request and response object, although what you do from that point is up to you.

```javascript
const App = require('nnn');

class MyContext {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }
  redirect(location) {
    this.res.writeHead(302, {'Location': location});
    this.res.end();
  }
}

let app = new App({context: MyContext});

app.get('/my-resource', function *() {
  this.redirect('/my-new-resource');
});
```

### app.on(route[, middleware], handler) :: App

Bind a listener to the app. The route option may be either a URL string or an object with a `url`, `method` and `headers` keys.

```javascript
app.on('/', function *() {
  // ...
});

app.on({
  url    : '/',
  method : 'GET',
  headers: {'X-Requested-With': 'XMLHttpRequest'}
}, function *() {
  // ...
});
```

All routes take an optional list of middleware to use. Middleware handlers are then called in left-to-right order before the main handler for the route.

```javascript
app.all('/', ['session'], function *(next) {
  // ...
});
```

### app.get|post|put|del|all(route[, middleware], handler) :: App

Short hands for binding listeners with a specific HTTP method, or any HTTP method in case of `all`.

```javascript
server.get('/', function *() {
  // ...
});
```

### app.start(opts) :: Promise

Start the server on the given `http` and/or `https` port, simply omit a key if you want only the one. All other options are passed directly to `https.createServer`. Returns a promise that resolves when the server has started listening.

```javascript
app.start({
  http : 8080,
  https: 3000,
  key  : fs.readFileSync('/keys/example-key.pem'),
  cert : fs.readFileSync('/keys/example-cert.pem')
});
```

### app.stop() :: Promise

Stop listening for new connections. Returns a promise that resolves when all open connections has ended.

### app.use(fn) :: App

Bind a global middleware function to the app that will be called for every request to the app, even if a handler cannot be found or throws an error. Useful for logging:

```javascript
app.use(function *(next) {
  yield next();
  console.log(this.req.url + ' ' + this.res.statusCode);
});
```

Or if you are of the sort that don't like to call `res.end` everywhere you can optionally do this:

```javascript
app.use(function *(next) {
  yield next();
  this.res.end();
});
```

### app.middleware :: App

`app.middleware` is a separate app instance used for routing middleware, allowing for dynamic middleware based on request method and headers. Middleware handlers are bound in the same manner as normal handlers, but all receive a inner callback as their first argument.

```javascript
app.middleware.get('session', function *(next) {

  // verify session

  if (!session) {
    this.res.writeHead('401', {Location: '/login'});
    return this.res.end();
  }

  yield next();

  if (session.hasChanged)
    session.save();
});
```

Middleware may also have middleware, which will be called before the main handler in the same manner as for normal routes. Apply with care! as there is nothing to stop you from defining a circular middleware dependency.

### app.catch :: App

`app.catch` is a separate app instance used for routing errors, allowing for dynamic error handlers based on request method and headers. Catch handlers are bound in the same manner as normal handlers.

```javascript
app.catch.all(404, function *() {
  this.res.statusCode = 404;
  this.res.end();
});
```

By default if a request do not match any possible handler the `404` event is triggered, or if a handler throws an error the `500` event is called with the error as an additional argument.

You may also directly call there handlers by throwing an [`HttpError`](https://www.npmjs.com/package/standard-http-error).

```javascript
app.get('/login?user&password', function *(user, password) {
  if (!authorize(user, password))
    throw new HttpError(403);

  // ...
});
```

## Routing

Each route consists of three parts, a `url`, `method` and `headers`, where the `url` further consists of a `path`, `query` and `fragment`. These parameters must all match in order for a request to trigger the handler bound on the route.

```javascript
app.on({
  url    : '/entries?page#main',
  method : 'GET',
  headers: {'X-Requested-With': 'XMLHttpRequest'}
}, function *() {
  // will only trigger for a request for `/entries` that contains a `page`
  // query, has a fragment of `main` and has a `X-Requested-With` header equal
  // to `XMLHttpRequest`.
});
```

Further, any of these parts may also contain any number of variadic patterns:

### Regular Expressions

Any part of the route may contain regular expressions. These expressions must match in order for the route to trigger.

Regular expressions may be specified in two ways, either by wrapping the expression in square braces (`[]`) or parentheses (`()`). The two environments differ in one key way, expressions wrapped in parentheses are captured and their result is passed to the handler, in order, as an additional argument.

```javascript
app.get('/entry/(\\d+)', function *(id) { ... });
app.get('/entries?page=(\\d+)', function *(page) { ... });
```

The `app.all` method is implemented with a method of `[.*]`.

### Variables

Any part of the route may contain variables, denoted with asterisk (`*`). These variables may match anything, but may not cross segment boundaries when they occur in paths.

The match of the variable is always passed to the handler function as an additional argument.

```javascript
app.get('/user/*', function *(name) { ... });
```

Queries without a value are interpreted as variable queries.

```javascript
app.get('/entries?search', function *(search) { ... });
// same as
app.get('/entries?search=*', function *(search) { ... });
```

### Globs

Paths may also contain glob patterns, denoted with double asterisks (`**`). These patterns function exactly like variables, but may cross segment boundaries.

The match of the glob is always passed to the handler function as an additional argument.

```javascript
app.get('/static/**', function *(resource) { ... });
app.get('/**.js', function *(jsFile) { ... });
```

### Brace Expansion

Patterns wrapped in curly braces (`{}`) are expanded according to [these](https://www.npmjs.com/package/brace-expansion) rules, and then the handler is bound individually for each expanded pattern. Brace expansion patterns are not captured.

```javascript
app.get('/{log,logs}-(\\d+)', function *(logId) { ... });
```

### Precedence

nnn will sort routes and try to always match the most specific match. The sorting rules are as follows:

1. It does not contain any variable patterns
2. It contains a regular expression
3. It contains a variable
4. It contains a glob

These rules still leave some room for ambiguity, in these cases nnn will use which ever handler was defined first.

```javascript
app.get('/([0-9]+)', function *(id) { ... });
app.get('/(\\d+)', function *(id) { ... }); // will never trigger
app.get('/123', function *(id) { ... }); // will always take precedence
```
