var extractPath = function (router, pathArray) {
  var path = pathArray.shift();

  if (path && path[0] === ':') {
    router.argName = path.slice(1);
    path = ':';
  }

  return path;
};

var insertHandler = function (router, method, middleware, handler) {
  router.methods[method] = {
    handler   : handler,
    middleware: middleware
  };
};
var insertQuery = function (router, queryArgs, method, middleware, handler) {
  if (!router.hasOwnProperty('queries'))
    router.queries = [];

  var query;
  for (var i in router.queries) {
    if (router.queries[i].eq(queryArgs, method)) {
      query = router.queries[i];
      break;
    }
  }

  if (!query) { 
    query = new Query(queryArgs, method, middleware, handler);
    router.queries.push(query);
    router.queries.sort(function (x, y) { return x.numargs < y.numargs; });
  } else {
    query.middleware = middleware;
    query.handler    = handler;
  }
};

var applyMiddleware = function (root, middleware, req, res, callback) {
  if (middleware.length === 0)
    return callback(req, res);

  var m = middleware.pop();
  applyMiddleware(root, middleware, req, res, function (req, res) {
    root.dispatch([m], req, res, callback);
  });
};
var callHandler = function (root, handler, req, res, args) {
  try {
    applyMiddleware(root, handler.middleware, req, res, function (req, res) {
      try {
        handler.handler.apply(handler.handler, [req, res].concat(args));
      } catch (err) {
        return root.dispatch(['500'], req, res, err);
      }
    });
  } catch (err) {
    return root.dispatch(['500'], req, res, err);
  }
  return root;
};

var matchHandler = function (router, req, res, args) {
  var method;

  if (router.methods.hasOwnProperty(req.method))
    method = req.method;
  else if (router.methods.hasOwnProperty('ALL'))
    method = 'ALL';
  else if (router.parent)
    return router.backtrack([], req, res, args);
  else
    return router.root.dispatch(['404'], req, res, []);

  return callHandler(router.root, router.methods[method], req, res, args);
};
var matchQueryHandler = function (router, req, res, args) {
  if (!router.hasOwnProperty('queries'))
    return matchHandler(router, req, res, args);

  for (var i in router.queries) {
    if (router.queries[i].match(req)) {
      args = args.concat(router.queries[i].parseArgs(req));
      return callHandler(router.root, router.queries[i], req, res, args);
    }
  }
  return matchHandler(router, req, res, args);
};


var Query = function (args, method, middleware, handler) {
  this.numargs    = args.length;
  this.args       = args;
  this.method     = method;
  this.handler    = handler;
  this.middleware = middleware;
  return this;
};
Query.prototype.eq = function (args, method) {
  var self = this;

  if (args.length !== self.numargs)
    return false;

  if (!self.hasOwnProperty(method))
    return false;

  var match = self.args
    .map(function (arg)     { return args.indexOf(arg) !== -1; })
    .reduce(function (x, y) { return x && y; });

  return match;
};
Query.prototype.match = function (req) {
  var self = this;

  if (self.method !== 'ALL' && req.method !== self.method)
    return false;

  for (var i in self.args)
    if (!req.query.hasOwnProperty(self.args[i]))
      return false;

  return true;
};
Query.prototype.parseArgs = function (req) {
  var self = this;

  return self.args.map(function (arg) {
    return req.query[arg];
  });
};


var Router = module.exports = function (root, parent, path) {
  this.root     = root || this;
  this.parent   = parent;
  this.name     = path;
  this.children = {};
  this.methods  = {};
  return this;
};
Router.prototype.dispatch = function (pathArray, req, res, args) {
  var self = this;
  var path = pathArray.shift();

  if (path === undefined)
    return matchHandler(self, req, res, args);

  if (path === '?')
    return matchQueryHandler(self, req, res, args);

  if (self.children.hasOwnProperty(path))
    return self.children[path].dispatch(pathArray, req, res, args);

  else if (self.children.hasOwnProperty(':') && path.length > 0) {
    args.push(path);
    return self.children[':'].dispatch(pathArray, req, res, args);
  }

  else if (self.parent)
    return self.backtrack([path].concat(pathArray), req, res, args);

  else
    return self.root.dispatch(['404'], req, res, []);
};
Router.prototype.backtrack = function (pathArray, req, res, args) {
  var self = this;

  if (self.children.hasOwnProperty('*') && pathArray.length > 0) {
    args = ['/' + pathArray.join('/')];
    return self.children['*'].dispatch([], req, res, args);
  }

  else if (self.parent) {
    var path = self.name === ':' ? args.pop() : self.name;
    return self.parent.backtrack([path].concat(pathArray), req, res, args);
  }

  else
    return self.root.dispatch(['404'], req, res, []);
};
Router.prototype.on = function (pathArray, method, middleware, handler) {
  var self = this;
  var path = extractPath(self, pathArray);

  if (path === undefined)
    return insertHandler(self, method, middleware, handler);

  if (path === '?')
    return insertQuery(self, pathArray, method, middleware, handler);

  if (self.children.hasOwnProperty(path))
    return self.children[path].on(pathArray, method, middleware, handler);

  else {
    self.children[path] = new Router(self.root, self, path);
    return self.children[path].on(pathArray, method, middleware, handler);
  }
};
Router.prototype.print = function (pathArray) {
  if (!pathArray) pathArray = [];

  var self = this;

  for (var method in self.methods)
    if (self.methods.hasOwnProperty(method))
      console.log(method, pathArray.join('/'));

  if (self.hasOwnProperty('queries')) {
    self.queries.reverse().forEach(function (query) {
      console.log(query.method, pathArray.join('/') + '?' + query.args.join('&'));
    });
    self.queries.reverse();
  }

  var array = [];
  for (var i in self.children)
    array.push({key: (i === ':' ? i+self.argName : i), val: self.children[i]});
  array.sort(function (x, y) { return x.key > y.key; });

  array.forEach(function (child) {
    child.val.print(pathArray.concat(child.key));
  });
};
