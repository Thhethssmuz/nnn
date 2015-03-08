var Router = require('./router.js');
var log = require('logule').init(module, 'Server');
var url = require('url');

var Server = function () {
  this.router = new Router();
  return this;
};

Server.prototype.dispatch = function (req, res) {
  var urlparts = url.parse(req.url, true);
  req.query = urlparts.query;
  path_array = urlparts.pathname.split('/');
  if (urlparts.search)
    path_array.push('?');
  this.router.dispatch(path_array, req, res, []);
  return this;
};

Server.prototype.raise = function (code, req, res) {
  this.router.dispatch([code], req, res, []);
  return this;
};

Server.prototype.bind = function (requrl, method, flags, handler) {
  var urlparts   = url.parse(requrl);
  var path_array = urlparts.pathname.split('/');

  if (urlparts.query) {
    path_array.push('?');
    path_array = path_array.concat(urlparts.query.split('&'));
  }

  this.router.on(path_array, method, flags, handler);
  return this;
};

Server.prototype.on = function (requrl, flags, handler) {
  return this.bind(requrl, 'ALL', flags, handler);
};

Server.prototype.get = function (requrl, flags, handler) {
  return this.bind(requrl, 'GET', flags, handler);
};

Server.prototype.post = function (requrl, flags, handler) {
  return this.bind(requrl, 'POST', flags, handler);
};

Server.prototype.config = function (cfg) {
  this.cfg = cfg;
  return this;
};

Server.prototype.start = function () {
  var self = this;

  if (!self.hasOwnProperty('cfg')) {
    log.error('missing config!');
    return;
  }

  if (self.cfg.hasOwnProperty('http')) {
    log.info('server listening on port:', self.cfg.http);

    require('http').createServer(function (req, res) {
      log.info(req.connection.remoteAddress, req.method, req.url.toString());
      req.secure = false;
      self.dispatch(req, res);
    }).listen(self.cfg.http);
  }

  if (self.cfg.hasOwnProperty('https')) {
    log.info('server listening on port:', self.cfg.https);

    require('https').createServer(self.cfg, function (req, res) {
      log.info(req.connection.remoteAddress, req.method, req.url.toString());
      req.secure = true;
      self.dispatch(req, res);
    }).listen(self.cfg.https);
  }
};

module.exports = new Server();
