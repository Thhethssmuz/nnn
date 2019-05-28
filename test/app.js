'use strict';

const test = require('awfltst');
const App = require('../lib');

let trace = x => '`' + x.method + ' ' + x.url + ' ' + JSON.stringify(x.headers) + '`';

let makeTest = async function (t, opts, routes) {
  let app = new App(opts);

  for (let x of routes) {

    let route = x.handler || x.middleware || x.catch;
    let mw    = route.middleware || [];

    let handler = async function () {
      t.in(this.req, x.match, trace(route) + ' matches ' + trace(this.req));

      let xs   = this.req.args.map(x => {
        if (typeof x === 'function')
          return x.name;
        if (x instanceof RegExp)
          return x;
        return "'" + x + "'"
      });
      let msg  = trace(this.req) + ' matches arguments [' + xs.join(', ') + ']';

      let args = this.req.args.map((x,i) => {
        if (typeof x === 'function' && arguments[i] instanceof x)
          return arguments[i];

        if (x instanceof RegExp && x.test(arguments[i].message))
          return arguments[i];

        return x;
      })

      t.eq(Array.from(arguments), args, msg);
    };

    if (x.handler)
      app.on(route, mw, handler);
    else if (x.middleware)
      app.middleware.on(route, mw, handler);
    else if (x.catch)
      app.catch.on(route, mw, handler);
  }

  app.finalize();

  t.plan(routes.map(x => x.match.length).reduce((x,y) => x + y, 0) * 2);

  for (let x of routes) {
    for (let e of x.match) {
      await app.dispatch(e);
    }
  }
};

test('basic', async function (t) {
  t.plan(4);

  let app = new App();
  await t.notThrows(() => app.get('/', async function () {}), 'binding to router ok');
  await t.notThrows(() => app.finalize(), 'finalize router ok');
  await t.notThrows(() => app.finalize(), 'refinalize router ok');
  await t.throws(() => app.get('/a', async function () {}), Error, 'cannot bind to finalized router');
});

test('methods', async function (t) {
  t.plan(5);

  let app = new App();
  app.get('/', async function () { t.eq(this.req.method, 'GET', 'GET dispatched'); });
  app.post('/', async function () { t.eq(this.req.method, 'POST', 'POST dispatched'); });
  app.put('/', async function () { t.eq(this.req.method, 'PUT', 'PUT dispatched'); });
  app.del('/', async function () { t.eq(this.req.method, 'DELETE', 'DELETE dispatched'); });
  app.all('/', async function () { t.eq(this.req.method, 'HEAD', 'ALL dispatched'); });
  app.finalize();

  await app.dispatch({url: '/', method: 'GET', headers: {}});
  await app.dispatch({url: '/', method: 'POST', headers: {}});
  await app.dispatch({url: '/', method: 'PUT', headers: {}});
  await app.dispatch({url: '/', method: 'DELETE', headers: {}});
  await app.dispatch({url: '/', method: 'HEAD', headers: {}});
});

test('context', async function (t) {
  t.plan(1);

  let CTX = function (req, res) {
    this.req = req;
    this.res = res;
  };

  let app = new App({context: CTX});
  app.all('/', async function () {
    t.instance(this, CTX, 'correct context');
  });
  app.finalize();

  await app.dispatch({url: '/', method: 'GET', headers: {}});
});

test('middleware', async function (t) {
  t.plan(7);

  let CTX = function (req, res) {
    this.req = req;
    this.res = res;
    this.test = 0;
  };

  let app = new App({context: CTX});

  app.middleware.get('a', async function (next) {
    t.eq(this.test += 1, 1, 'first middleware');
    await next();
    t.eq(this.test += 1, 7, 'end of first middleware');
  });
  app.middleware.get('b', ['a'], async function (next) {
    t.eq(this.test += 1, 2, 'second middleware');
    await next();
    t.eq(this.test += 1, 6, 'end of second middleware');
  });
  let c = async function (next) {
    t.eq(this.test += 1, 3, 'last middleware');
    await next();
    t.eq(this.test += 1, 5, 'end of last middleware');
  };

  app.get('/', ['b', c], async function () {
    t.eq(this.test += 1, 4, 'handler!');
  });

  app.finalize();

  await app.dispatch({url: '/', method: 'GET', headers: {}});
});
test('middleware not found', async function (t) {
  t.plan(1);
  let app = new App();
  app.all('/', ['a'], async function () {});
  app.catch.all(500, async function (err) {
    t.ok(/No middleware handler/.test(err.message), 'catch middleware not found');
  });
  app.finalize();

  await app.dispatch({url: '/', method: 'GET', headers: {}});
});
test('middleware short circuit', async function (t) {
  t.plan(4);

  let CTX = function (req, res) {
    this.req = req;
    this.res = res;
    this.test = 0;
  };

  let app = new App({context: CTX});
  app.use(async function (next) {
    t.eq(this.test += 1, 1, 'global middleware');
    await next();
    t.ok(true, 'global middleware finishes execution after error');
  });
  app.middleware.all('a', async function (next) {
    t.eq(this.test += 1, 2, 'middleware');
    await next();
    t.fail('middleware did not short circuit');
  });
  app.all('/', ['a','b'], async function () {
    t.fail('handler executed');
  });
  app.catch.all(500, async function (err) {
    t.ok(/No middleware handler/.test(err.message), 'catch middleware not found');
  });
  app.finalize();

  await app.dispatch({url: '/', method: 'GET', headers: {}});
});

test('not found', async function (t) {
  await makeTest(t, {}, [
    { catch: { url: '404', method: 'GET',  headers: {} },
      match: [
        { url: '/a', method: 'GET', headers: {}, args: [/Not Found/] }
      ]
    }, {
      catch: { url: '404', method: 'POST', headers: {} },
      match: [
        { url: '/a', method: 'POST', headers: {}, args: [/Not Found/] }
      ]
    }, {
      catch: { url: '404', method: '[.*]', headers: {} },
      match: [
        { url: '/a', method: 'PUT',    headers: {}, args: [/Not Found/] },
        { url: '/a', method: 'DELETE', headers: {}, args: [/Not Found/] }
      ]
    }
  ]);
});
test('internal error', async function (t) {
  await makeTest(t, {}, [
    { catch: { url: '500', method: 'GET',  headers: {} },
      match: [
        { url: '/a', method: 'GET', headers: {}, args: [/No error handler for `GET 404`/] }
      ]
    }, {
      catch: { url: '500', method: 'POST', headers: {} },
      match: [
        { url: '/a', method: 'POST', headers: {}, args: [/No error handler for `POST 404`/] }
      ]
    }, {
      catch: { url: '500', method: '[.*]', headers: {} },
      match: [
        { url: '/a', method: 'PUT',    headers: {}, args: [/No error handler for `PUT 404`/] },
        { url: '/a', method: 'DELETE', headers: {}, args: [/No error handler for `DELETE 404`/] }
      ]
    }
  ]);
});

test('segments', async function (t) {
  await makeTest(t, {}, [
    { handler: { url: '/', method: 'GET', headers: {} },
      match  : [
        { url: '/', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/a', method: 'GET', headers: {} },
      match  : [
        { url: '/a', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/a/[b]', method: 'GET', headers: {} },
      match  : [
        { url: '/a/b', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/a/(c)', method: 'GET', headers: {} },
      match  : [
        { url: '/a/c', method: 'GET', headers: {}, args: ['c'] }
      ]
    }, {
      handler: { url: '/a/*', method: 'GET', headers: {} },
      match  : [
        { url: '/a/d', method: 'GET', headers: {}, args: ['d'] }
      ]
    }, {
      handler: { url: '/a/**', method: 'GET', headers: {} },
      match  : [
        { url: '/a/b/c', method: 'GET', headers: {}, args: ['b/c'] }
      ]
    }, {
      catch  : { url: '404', method: 'GET', headers: {} },
      match  : [
        { url: '/b', method: 'GET', headers: {}, args: [/Not Found/] }
      ]
    }
  ]);
});

test('queries', async function (t) {
  await makeTest(t, {}, [
    { handler: { url: '?a&b', method: 'GET', headers: {} },
      match  : [
        { url: '?a=1&b=2',     method: 'GET', headers: {}, args: ['1','2'] },
        { url: '?b=2&a=1',     method: 'GET', headers: {}, args: ['1','2'] },
        { url: '?a=1&b=2&d=3', method: 'GET', headers: {}, args: ['1','2'] }
      ]
    }, {
      handler: { url: '?b&c', method: 'GET', headers: {} },
      match  : [
        { url: '?b=2&c=3',     method: 'GET', headers: {}, args: ['2','3'] },
        { url: '?c=3&b=2',     method: 'GET', headers: {}, args: ['2','3'] },
        { url: '?b=2&c=3&d=4', method: 'GET', headers: {}, args: ['2','3'] }
      ]
    }, {
      handler: { url: '?a&b&c', method: 'GET', headers: {} },
      match  : [
        { url: '?a=1&b=2&c=3',     method: 'GET', headers: {}, args: ['1','2','3'] },
        { url: '?c=3&b=2&a=1',     method: 'GET', headers: {}, args: ['1','2','3'] },
        { url: '?a=1&b=2&c=3&d=4', method: 'GET', headers: {}, args: ['1','2','3'] }
      ]
    }, {
      catch  : { url: '404', method: 'GET', headers: {} },
      match  : [
        { url: '?b=2',     method: 'GET', headers: {}, args: [/Not Found/] },
        { url: '?b=2&d=4', method: 'GET', headers: {}, args: [/Not Found/] }
      ]
    }
  ]);
});

test('fragments', async function (t) {
  await makeTest(t, {}, [
    { handler: { url: '#', method: 'GET', headers: {} },
      match  : [
        { url: '#', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '#a', method: 'GET', headers: {} },
      match  : [
        { url: '#a', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '#[b]', method: 'GET', headers: {} },
      match  : [
        { url: '#b', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '#(c)', method: 'GET', headers: {} },
      match  : [
        { url: '#c', method: 'GET', headers: {}, args: ['c'] }
      ]
    }, {
      handler: { url: '#*', method: 'GET', headers: {} },
      match  : [
        { url: '#d', method: 'GET', headers: {}, args: ['d'] }
      ]
    }, {
      catch  : { url: '404', method: 'GET', headers: {} },
      match  : [
        { url: '', method: 'GET', headers: {}, args: [/Not Found/] }
      ]
    }
  ]);
});

test('methods', async function (t) {
  await makeTest(t, {}, [
    { handler: { url: '/', method: 'GET', headers: {} },
      match  : [
        { url: '/', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/', method: 'POST', headers: {} },
      match  : [
        { url: '/', method: 'POST', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/', method: '[A]', headers: {} },
      match  : [
        { url: '/', method: 'A', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/', method: '(B)', headers: {} },
      match  : [
        { url: '/', method: 'B', headers: {}, args: ['B'] }
      ]
    }, {
      handler: { url: '/', method: '*', headers: {} },
      match  : [
        { url: '/', method: 'LOL', headers: {}, args: ['LOL'] }
      ]
    }
  ]);
});

test('headers', async function (t) {
  await makeTest(t, {}, [
    { handler: { url: '/', method: 'GET', headers: [] },
      match  : [
        { url: '/', method: 'GET', headers: {'b': '2'          }, args: [] },
        { url: '/', method: 'GET', headers: {'b': '2', 'd': '4'}, args: [] },
      ]
    }, {
      handler: { url: '/', method: 'GET', headers: ['a','b'] },
      match  : [
        { url: '/', method: 'GET', headers: {'a': '1', 'b': '2'          }, args: ['1','2'] },
        { url: '/', method: 'GET', headers: {'b': '2', 'a': '1'          }, args: ['1','2'] },
        { url: '/', method: 'GET', headers: {'a': '1', 'b': '2', 'd': '4'}, args: ['1','2'] }
      ]
    }, {
      handler: { url: '/', method: 'GET', headers: ['b','c'] },
      match  : [
        { url: '/', method: 'GET', headers: {'b': '2', 'c': '3'          }, args: ['2','3'] },
        { url: '/', method: 'GET', headers: {'c': '3', 'b': '2'          }, args: ['2','3'] },
        { url: '/', method: 'GET', headers: {'b': '2', 'c': '3', 'd': '4'}, args: ['2','3'] }
      ]
    }, {
      handler: { url: '/', method: 'GET', headers: ['a','b','c'] },
      match  : [
        { url: '/', method: 'GET', headers: {'a': '1', 'b': '2', 'c': '3'          }, args: ['1','2','3'] },
        { url: '/', method: 'GET', headers: {'c': '3', 'b': '2', 'a': '1'          }, args: ['1','2','3'] },
        { url: '/', method: 'GET', headers: {'a': '1', 'b': '2', 'c': '3', 'd': '4'}, args: ['1','2','3'] }
      ]
    }
  ]);
});

test('brace expansion', async function (t) {
  await makeTest(t, {}, [
    { handler: { url: '/{a,b}', method: '{GET,POST}', headers: ['n', {'{x,y}': '*'}] },
      match  : [
        { url: '/a', method: 'GET',  headers: {'n':'n', 'x':'1'}, args: ['n', '1'] },
        { url: '/a', method: 'GET',  headers: {'n':'n', 'y':'2'}, args: ['n', '2'] },
        { url: '/a', method: 'POST', headers: {'n':'n', 'x':'1'}, args: ['n', '1'] },
        { url: '/a', method: 'POST', headers: {'n':'n', 'y':'2'}, args: ['n', '2'] },
        { url: '/b', method: 'GET',  headers: {'n':'n', 'x':'1'}, args: ['n', '1'] },
        { url: '/b', method: 'GET',  headers: {'n':'n', 'y':'2'}, args: ['n', '2'] },
        { url: '/b', method: 'POST', headers: {'n':'n', 'x':'1'}, args: ['n', '1'] },
        { url: '/b', method: 'POST', headers: {'n':'n', 'y':'2'}, args: ['n', '2'] },
      ]
    }
  ]);
});

test('case insensitivity', async function (t) {
  await makeTest(t, {case: true}, [
    { handler: { url: '/a', method: 'GET', headers: {} },
      match  : [
        { url: '/a', method: 'GET', headers: {}, args: [] },
        { url: '/A', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/[b]', method: 'GET', headers: {} },
      match  : [
        { url: '/b', method: 'GET', headers: {}, args: [] },
        { url: '/B', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/(c)', method: 'GET', headers: {} },
      match  : [
        { url: '/c', method: 'GET', headers: {}, args: ['c'] },
        { url: '/C', method: 'GET', headers: {}, args: ['C'] }
      ]
    }, {
      handler: { url: '/d*', method: 'GET', headers: {} },
      match  : [
        { url: '/de', method: 'GET', headers: {}, args: ['e'] },
        { url: '/De', method: 'GET', headers: {}, args: ['e'] }
      ]
    }, {
      handler: { url: '/e**', method: 'GET', headers: {} },
      match  : [
        { url: '/e/f', method: 'GET', headers: {}, args: ['/f'] },
        { url: '/E/f', method: 'GET', headers: {}, args: ['/f'] }
      ]
    }
  ]);
});

test('trimming', async function (t) {
  await makeTest(t, {trim: true}, [
    { handler: { url: '', method: 'GET', headers: {} },
      match  : [
        { url: '', method: 'GET', headers: {}, args: [] },
        { url: '/', method: 'GET', headers: {}, args: [] }
      ]
    }, {
      handler: { url: '/a', method: 'GET', headers: {} },
      match  : [
        { url: '/a', method: 'GET', headers: {}, args: [] },
        { url: '/a/', method: 'GET', headers: {}, args: [] }
      ]
    }
  ]);
});


test('edge-case 1', async function (t) {
  await makeTest(t, {}, [
    { handler: { url: '/a/*/*', method: 'GET', headers: {} },
      match  : [
        { url: '/a/a/', method: 'GET', headers: {}, args: ['a', ''] },
        { url: '/a/a/a', method: 'GET', headers: {}, args: ['a', 'a'] },
        { url: '/a/a/b', method: 'GET', headers: {}, args: ['a', 'b'] }
      ]
    }, {
      handler: { url: '/a/b/*', method: 'GET', headers: {} },
      match  : [
        { url: '/a/b/', method: 'GET', headers: {}, args: [''] },
        { url: '/a/b/c', method: 'GET', headers: {}, args: ['c'] },
        { url: '/a/b/d', method: 'GET', headers: {}, args: ['d'] }
      ]
    }, {
      catch  : { url: '404', method: 'GET', headers: {} },
      match  : [
        { url: '/a/a', method: 'GET', headers: {}, args: [/Not Found/] },
        { url: '/a/b', method: 'GET', headers: {}, args: [/Not Found/] },
        { url: '/a/b?c', method: 'GET', headers: {}, args: [/Not Found/] }
      ]
    }
  ]);
});
test('edge-case 2', async function (t) {
  await makeTest(t, {trim: true, case: true}, [
    { handler: { url: '/?a&b', method: 'GET', headers: {} },
      match  : [
        { url: '/?a=1&b=2', method: 'GET', headers: {}, args: ['1', '2'] },
      ]
    }, {
      handler: { url: '/?a&c', method: 'GET', headers: {} },
      match  : [
        { url: '/?a=1&c=3', method: 'GET', headers: {}, args: ['1', '3'] },
      ]
    }, {
      catch  : { url: '404', method: 'GET', headers: {} },
      match  : [
        { url: '/?a=1', method: 'GET', headers: {}, args: [/Not Found/] },
      ]
    }
  ]);
});
