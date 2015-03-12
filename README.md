# nnn
[![build status](https://secure.travis-ci.org/Thhethssmuz/nnn.svg)](http://travis-ci.org/Thhethssmuz/nnn)
[![coverage status](http://img.shields.io/coveralls/Thhethssmuz/nnn.svg)](https://coveralls.io/r/Thhethssmuz/nnn)

## Setup

```javascript
var Server = require('nnn');

var server = new Server({
  http: 8080,
  https: 3000,
  key: fs.readFileSync('/keys/example-key.pem'),
  cert: fs.readFileSync('/keys/example-cert.pem')
});
```

This will start an http server on port 8080 and an https server on port 3000. Both will share one single routing table. If you only want to use one of the protocols simply omit the http or https key from the configuration.

## Routing

Creating routing entries are done through the server's `on`, `get`, `post` and `bind` methods.

### Server.get(route[, middleware], handler)

Creates a routing entry for `HTTP(S) GET` requests.

```javascript
server.get('/', function (req, res) {
  // do stuff
  res.end();
});
```

### Server.post(route[, middleware], handler)

Creates a routing entry for `HTTP(S) POST` requests.

```javascript
server.post('/', function (req, res) {
  // do stuff
  res.end();
});
```

### Server.on(route[, middleware], handler)

Creates a routing entry for any `HTTP(S)` request. The internal `ALL` method, used to implement this, has a lower precedence than any other routing method, and will therefore only trigger if it is not caught by a more specific method defined for the same route.

```javascript
server.on('/', function (req, res) {
  // do stuff
  res.end();
});
```

### Server.bind(route, method[, middleware], handler)

Creates a routing entry for a `HTTP(S)` request where the second argument specifies the method to use.

```javascript
server.bind('/', 'HEAD', function (req, res) {
  // do stuff
  res.end();
});
```


## Routing Variables and Queries

### Variables

Routes beginning with `:` are can match anything till the next `/`. This variable will then be passed as a string argument to the handler function.

```javascript
server.get('/index/:id', function (req, res, id) { ... });
```

Multiple variables may be specified in a single route and each will be passed to the handler function in order.

```javascript
server.get('/index/:id/:name', function (req, res, id, name) { ... });
```

Variables have lower precedence than concrete routes and will not trigger if there is a more specific path defined for the same route. For example, if there existed a handler for the path `/index/lol/` and a handler for the path `/index/:id`, the first would take precedence over the latter if a request for the path `/index/lol` where to occur.

### Queries

Routes beginning with or containing `?` and `&` matches named query arguments. The values of these queries will then be passed to the handler function in order.

```javascript
server.get('/index?search&page', function (req, res, search, page) { ... });
```

### Catch All

Routes consisting only of `*` may match anything including `/`s. The match will be passed as a string argument to the handler function.

```javascript
server.on('/static/*', function (req, res, path) { ... });
```

Catch alls have the lowest precedence of all, and will only match if there is not any other more specific route matching the path.


## Middleware

All routing entries take an optional list of middleware to use. Middleware handlers are then called in left-to-right order before the main handler for the routing entry.

```javascript
server.get('/', ['require-session'], function (req, res) {});
```

Middleware handlers are all given a callback argument to call if the middleware is successful and must be passed the request and response objects.

```javascript
server.on('require-session', function (req, res, callback) {
  // verify session ...

  if (session){
    req.session = session;
    callback();
  } else {
    res.writeHead('401', {Location: '/login'});
    res.end();
  }
});
```

Middleware may also be given a list of middleware, which will be called before the main handler in the same manner as for normal routing entries. Apply with care! as there is nothing to stop you from defining a circular middleware dependency.


## Error Handlers

Error handlers are implemented the same way as middleware, except they do not have a callback.

```javascript
server.on('404', function (req, res) {
  res.statusMessage = 'Not Found';
  res.statusCode = 404;
  res.end();
});
```

By default if a request do not match any possible handler the `404` event is called, or if a handler throws an error the `500` event is called with the error as en additional argument. The above example is the default implementation for the `404` handler and a similar default implementation exists for the `500` handler, however, these defaults can easily be overwritten by redeclaring them.

### Server.raise(route, request, response[, ...])

You may also directly call there handlers by the raise function, passing any additional arguments along with it.

```javascript
server.on('/entries/:id', function (req, res, id) {
  database.getEntry(id, function (err, entry) {
    if (err)
      return server.raise('500', req, res, err);
    res.end(entry);
  });
});
```
