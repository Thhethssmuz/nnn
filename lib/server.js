var Router = require('./router.js');
var log = require('logule').init(module, 'Server');
var url = require('url');

var Server = module.exports = function (cfg) {
  this.cfg = cfg;
  this.router = new Router();

  // default error handlers
  this.on('404', function (req, res) {
    res.statusCode = 404;
    res.end();
  });
  this.on('500', function (req, res, err) {
    log.error(err.hasOwnProperty('stack') ? err.stack : err);
    res.statusCode = 500;
    res.end();
  });

  return this;
};

Server.prototype.dispatch = function (req, res) {
  var urlparts  = url.parse(req.url, true);
  var pathArray = urlparts.pathname.split('/');
  req.query     = urlparts.query;

  if (urlparts.search)
    pathArray.push('?');

  this.router.dispatch(pathArray, req, res, []);
  return this;
};

Server.prototype.raise = function (code, req, res) {
  this.router.dispatch([code], req, res, Array.prototype.slice.call(arguments, 3));
  return this;
};

Server.prototype.bind = function (requrl, method, middleware, handler) {
  if (typeof middleware === 'function') {
    handler = middleware;
    middleware = [];
  }

  var urlparts   = url.parse(requrl);
  var pathArray = urlparts.pathname.split('/');

  if (urlparts.query) {
    pathArray.push('?');
    pathArray = pathArray.concat(urlparts.query.split('&'));
  }

  this.router.on(pathArray, method, middleware, handler);
  return this;
};
Server.prototype.on = function (requrl, middleware, handler) {
  return this.bind(requrl, 'ALL', middleware, handler);
};
Server.prototype.get = function (requrl, middleware, handler) {
  return this.bind(requrl, 'GET', middleware, handler);
};
Server.prototype.post = function (requrl, middleware, handler) {
  return this.bind(requrl, 'POST', middleware, handler);
};

Server.prototype.start = function () {
  var self = this;

  if (!self.cfg) {
    log.error('missing config!');
    return;
  }

  if (self.cfg.hasOwnProperty('http')) {
    log.info('listening on port:', self.cfg.http);

    require('http').createServer(function (req, res) {
      res.on('finish', function () {
        log.info(req.connection.remoteAddress, req.method, req.url.toString(), res.statusCode);
      });
      req.secure = false;
      self.dispatch(req, res);
    }).listen(self.cfg.http);
  }

  if (self.cfg.hasOwnProperty('https')) {
    log.info('listening on port:', self.cfg.https);

    require('https').createServer(self.cfg, function (req, res) {
      res.on('finish', function () {
        log.info(req.connection.remoteAddress, req.method, req.url.toString(), res.statusCode);
      });
      req.secure = true;
      self.dispatch(req, res);
    }).listen(self.cfg.https);
  }
};
