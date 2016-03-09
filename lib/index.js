'use strict';

const co = require('co');
const url = require('url');
const build = require('./build');
const State = require('./router').State;
const expand = require('./expand');
const HttpError = require('standard-http-error');

let objectify = r => typeof r !== 'object' ? { url: r.toString() } : r;
let extend = function (dest) {
  for (let src of Array.from(arguments).slice(1))
    for (let prop in src)
      if (src.hasOwnProperty(prop))
        dest[prop] = src[prop];
  return dest;
};

let makeState = function (req) {
  let urlParts = url.parse(req.url, true);
  let path     = (urlParts.pathname || '').split('/');
  let query    = Object.keys(urlParts.query).map(x => [x, urlParts.query[x]]);
  let fragment = urlParts.hash ? urlParts.hash.slice(1) : null;
  let method   = req.method;
  let headers  = Object.keys(req.headers).map(x => [x, req.headers[x]]);
  return new State(path, query, fragment, method, headers, []);
};
let mergeState = function (state, url, saved) {
  let newstate = makeState({
    url    : url.toString(),
    method : state.method,
    headers: state.headers
  });
  newstate.saved = saved || [];
  return newstate;
};


class App {

  constructor(opts, _parent) {
    this.opts   = opts || {};
    this.Context= this.opts.context;
    this.routes = [];
    this.parent = _parent || this;

    if (!_parent) {
      this.middleware = new App(this.opts, this);
      this.catch = new App(this.opts, this);
    }
  }

  on(route, middleware, handler) {
    if (this.routes === null)
      throw new Error('cannot add routes after router has been finalized');

    if (!handler) {
      handler = middleware;
      middleware = [];
    }

    middleware = middleware || [];

    expand(extend({method: '[.*]'}, objectify(route))).forEach(route => {
      this.routes.push(extend(route, {middleware, handler}));
    });

    return this;
  }

  get(route, middleware, handler) {
    return this.on(extend(objectify(route), {method: 'GET'}), middleware, handler);
  }
  post(route, middleware, handler) {
    return this.on(extend(objectify(route), {method: 'POST'}), middleware, handler);
  }
  put(route, middleware, handler) {
    return this.on(extend(objectify(route), {method: 'PUT'}), middleware, handler);
  }
  del(route, middleware, handler) {
    return this.on(extend(objectify(route), {method: 'DELETE'}), middleware, handler);
  }
  all(route, middleware, handler) {
    return this.on(extend(objectify(route), {method: '[.*]'}), middleware, handler);
  }

  finalize() {
    if (this.routes === null)
      return this;

    if (this.middleware)
      this.middleware.finalize(this.opts);

    if (this.catch)
      this.catch.finalize(this.opts);

    this.router = build(this.routes, this.opts);
    this.routes = null;

    return this;
  }

  run(state) {
    return new Promise((resolve, reject) => {
      this.router.unRouter(state, (x,s) => {

        resolve((x.middleware || []).reduceRight((f, mw) => {
          if (typeof mw === 'function')
            return ctx => co(mw.call(ctx, f.bind(null, ctx)));

          return ctx => {
            let newstate = mergeState(state, mw, [f.bind(null, ctx)]);
            return this.parent.middleware.run(newstate).then(h => h(ctx));
          };

        }, ctx => co(x.handler.apply(ctx, s.saved))));

      }, () => reject(new HttpError(404)));
    });
  }
  dispatch(req, res) {
    let ctx   = this.Context ? new this.Context(req, res) : {req, res};
    let state = makeState(req);

    let errorHandlerNotFound = code => () => {
      throw new Error('No error handler for `' + state.method + ' ' + code + '`');
    };

    let errorHandler = err => {
      if (err instanceof HttpError)
        return this.parent.catch.run(mergeState(state, err.code))
          .catch(errorHandlerNotFound(err.code))
          .then(h => h(ctx))
          .catch(errorHandler);
      else
        return this.parent.catch.run(mergeState(state, 500, [err]))
          .catch(errorHandlerNotFound(500))
          .then(h => h(ctx));
    };

    return this.run(state).then(h => h(ctx)).catch(errorHandler);
  }

  start(opts) {
    this.finalize(this.opts);

    if (this.http)
      this.httpServer = require('http').createServer(this.dispatch).listen(opts.http);
    if (this.https)
      this.httpsServer = require('https').createServer(this.dispatch).listen(opts.https);
  }
  stop() {
    if (this.httpServer)
      this.httpServer.close();
    if (this.httpsServer)
      this.httpsServer.close();
  }
}

module.exports = App;
module.exports.HttpError = HttpError;