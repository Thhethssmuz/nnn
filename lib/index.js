'use strict';

const co = require('co');
const url = require('url');
const build = require('./build');
const State = require('./router').State;
const expand = require('./expand');
const HttpError = require('standard-http-error');

const objectify = function (route) {
  const r = typeof route !== 'object' ? {url: route} : route;
  r.url = r.url.toString();
  return r;
};
const extend = function (dest, ...srcs) {
  for (const src of srcs)
    for (const prop in src)
      if (src.hasOwnProperty(prop))
        dest[prop] = src[prop];
  return dest;
};

const makeState = function (req) {
  const urlParts = url.parse(req.url, true);
  const path     = (urlParts.pathname || '').split('/');
  const query    = Object.keys(urlParts.query).map(x => [x, urlParts.query[x]]);
  const fragment = urlParts.hash ? urlParts.hash.slice(1) : null;
  const method   = req.method;
  const headers  = Object.keys(req.headers).map(x => [x, req.headers[x]]);
  return new State(path, query, fragment, method, headers, []);
};
const mergeState = function (state, url_, saved) {
  const newstate = makeState({
    url    : url_.toString(),
    method : state.method,
    headers: state.headers
  });
  newstate.saved = saved || [];
  return newstate;
};

const promise = function (f) {
  return new Promise((resolve, reject) =>
    f(err => err ? reject(err) : resolve()));
};

class App {

  constructor(opts, _parent) {
    this.opts    = opts || {};
    this.Context = this.opts.context;
    this.routes  = [];
    this.parent  = _parent || this;
    this.global  = [];

    if (!_parent) {
      this.middleware = new App(this.opts, this);
      this.catch = new App(this.opts, this);
    }
  }

  use(middleware) {
    this.global.push(middleware);
  }

  on(route, middleware, handler) {
    if (this.routes === null)
      throw new Error('cannot add routes after router has been finalized');

    if (!handler) {
      handler    = middleware;     // eslint-disable-line no-param-reassign
      middleware = [];             // eslint-disable-line no-param-reassign
    }

    middleware = middleware || []; // eslint-disable-line no-param-reassign

    expand(extend({method: '[.*]'}, objectify(route))).forEach(r => {
      this.routes.push(extend(r, {middleware, handler}));
    });

    return this;
  }

  get(route, middleware, handler) {
    return this
      .on(extend(objectify(route), {method: 'GET'}), middleware, handler);
  }
  post(route, middleware, handler) {
    return this
      .on(extend(objectify(route), {method: 'POST'}), middleware, handler);
  }
  put(route, middleware, handler) {
    return this
      .on(extend(objectify(route), {method: 'PUT'}), middleware, handler);
  }
  del(route, middleware, handler) {
    return this
      .on(extend(objectify(route), {method: 'DELETE'}), middleware, handler);
  }
  all(route, middleware, handler) {
    return this
      .on(extend(objectify(route), {method: '[.*]'}), middleware, handler);
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
      this.router.unRouter(state, (x, s) => {

        resolve(x.middleware.reduceRight((f, mw) => {
          if (typeof mw === 'function')
            return ctx => co(mw.call(ctx, f.bind(null, ctx)));

          return ctx => {
            const newstate = mergeState(state, mw, [f.bind(null, ctx)]);
            return this.parent.middleware.run(newstate).catch(() => {
              throw new Error(
                'No middleware handler found for `' +
                state.method + ' ' + mw + '`');
            }).then(h => h(ctx));
          };
        }, ctx => co(x.handler.apply(ctx, s.saved))));

      }, () => reject(new HttpError(404)));
    });
  }
  dispatch(req, res) {
    const ctx   = this.Context ? new this.Context(req, res) : {req, res};
    const state = makeState(req);

    const errorHandlerNotFound = code => () => {
      throw new Error(
        'No error handler for `' + state.method + ' ' + code + '`');
    };

    const errorHandler = err => {
      if (err instanceof HttpError)
        return this.parent.catch.run(mergeState(state, err.code, [err]))
          .catch(errorHandlerNotFound(err.code))
          .then(h => h(ctx))
          .catch(errorHandler);
      return this.parent.catch.run(mergeState(state, 500, [err]))
        .catch(errorHandlerNotFound(500))
        .then(h => h(ctx));
    };

    return this.global.reduceRight((f, mw) => {
      return ctx_ => co(mw.call(ctx_, f.bind(null, ctx_))).catch(errorHandler);
    }, ctx_ => {
      return this.run(state).then(h => h(ctx_)).catch(errorHandler);
    })(ctx).catch(errorHandler).catch(err => {
      // eslint-disable-next-line no-console
      console.log(err);
      if (res && !res.headersSent)
        res.statusCode = 500;
      if (res && !res.finished)
        res.end();
    });
  }

  start(opts) {
    this.finalize();

    if (!opts)
      throw new Error('missing options');

    if (!opts.hasOwnProperty('http') && !opts.hasOwnProperty('https'))
      throw new Error('unable to start server, missing server configuration');

    const cbs = [];

    if (opts.hasOwnProperty('http')) {
      this.httpServer = require('http').createServer((req, res) =>
        this.dispatch(req, res));
      cbs.push(promise(cb => this.httpServer.listen(opts.http, cb)));
    }

    if (opts.hasOwnProperty('https')) {
      this.httpsServer = require('https').createServer(opts, (req, res) =>
        this.dispatch(req, res));
      cbs.push(promise(cb => this.httpsServer.listen(opts.https, cb)));
    }

    return Promise.all(cbs);
  }
  stop() {
    const cbs = [];

    if (this.httpServer)
      cbs.push(promise(cb => this.httpServer.close(cb)));

    if (this.httpsServer)
      cbs.push(promise(cb => this.httpsServer.close(cb)));

    return Promise.all(cbs);
  }
}

module.exports = App;
module.exports.HttpError = HttpError;
