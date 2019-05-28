'use strict';

const test = require('awfltst');
const build = require('../lib/build');

test('errors', async function (t) {
  t.plan(3);

  await t.throws(async function () {
    build([{ url: '[', method: 'GET'}], {});
  }, /Expected .* end of input found/, 'parse error');

  await t.throws(async function () {
    build([{ url: '***', method: 'GET'}], {});
  }, /is not a valid pattern/, 'invalid pattern');

  await t.throws(async function () {
    build([{ url: '/', header: 123 }], {});
  }, TypeError, 'header type');
});

test('duplicate handlers', async function (t) {
  t.plan(58);

  let show = r => (r.method || 'ALL') + ' ' + r.url + (r.header ? ' ' + JSON.stringify(r.header) : '');
  let eq = async (x, y) => {
    let msg = '`' + show(x) + '` equals `' + show(y) + '`';
    return t.throws(() => { build([x,y], {}); }, /duplicate route/, msg);
  }
  let ne = async (x, y) => {
    let msg = '`' + show(x) + '` not equals `' + show(y) + '`';
    return t.notThrows(async () => { build([x,y], {}); }, msg);
  }

  await eq({url: '/a'  }, {url: '/a'  });
  await ne({url: '/a'  }, {url: '/b'  });
  await eq({url: '/[a]'}, {url: '/[a]'});
  await ne({url: '/[a]'}, {url: '/[b]'});
  await eq({url: '/(a)'}, {url: '/(a)'});
  await ne({url: '/(a)'}, {url: '/(b)'});
  await eq({url: '/*a' }, {url: '/*a' });
  await ne({url: '/*a' }, {url: '/*b' });
  await eq({url: '/**a'}, {url: '/**a'});
  await ne({url: '/**a'}, {url: '/**b'});

  await eq({url: '?a=1'  }, {url: '?a=1'  });
  await ne({url: '?a=1'  }, {url: '?a=2'  });
  await eq({url: '?a=[1]'}, {url: '?a=[1]'});
  await ne({url: '?a=[1]'}, {url: '?a=[2]'});
  await eq({url: '?a=(1)'}, {url: '?a=(1)'});
  await ne({url: '?a=(1)'}, {url: '?a=(2)'});
  await eq({url: '?a=*1' }, {url: '?a=*1' });
  await ne({url: '?a=*1' }, {url: '?a=*2' });

  await eq({url: '?a'  }, {url: '?a'  });
  await ne({url: '?a'  }, {url: '?b'  });
  await eq({url: '?[a]'}, {url: '?[a]'});
  await ne({url: '?[a]'}, {url: '?[b]'});
  await eq({url: '?(a)'}, {url: '?(a)'});
  await ne({url: '?(a)'}, {url: '?(b)'});
  await eq({url: '?*a' }, {url: '?*a' });
  await ne({url: '?*a' }, {url: '?*b' });

  await eq({url: '#a'  }, {url: '#a'  });
  await ne({url: '#a'  }, {url: '#b'  });
  await eq({url: '#[a]'}, {url: '#[a]'});
  await ne({url: '#[a]'}, {url: '#[b]'});
  await eq({url: '#(a)'}, {url: '#(a)'});
  await ne({url: '#(a)'}, {url: '#(b)'});
  await eq({url: '#*a' }, {url: '#*a' });
  await ne({url: '#*a' }, {url: '#*b' });

  await eq({url: '/', method: 'a'  }, {url: '/', method: 'a'  });
  await ne({url: '/', method: 'a'  }, {url: '/', method: 'b'  });
  await eq({url: '/', method: '[a]'}, {url: '/', method: '[a]'});
  await ne({url: '/', method: '[a]'}, {url: '/', method: '[b]'});
  await eq({url: '/', method: '(a)'}, {url: '/', method: '(a)'});
  await ne({url: '/', method: '(a)'}, {url: '/', method: '(b)'});
  await eq({url: '/', method: '*a' }, {url: '/', method: '*a' });
  await ne({url: '/', method: '*a' }, {url: '/', method: '*b' });

  await eq({url: '/', header: {'a': 'a'  }}, {url: '/', header: {'a': 'a'  }});
  await ne({url: '/', header: {'a': 'a'  }}, {url: '/', header: {'a': 'b'  }});
  await eq({url: '/', header: {'a': '[a]'}}, {url: '/', header: {'a': '[a]'}});
  await ne({url: '/', header: {'a': '[a]'}}, {url: '/', header: {'a': '[b]'}});
  await eq({url: '/', header: {'a': '(a)'}}, {url: '/', header: {'a': '(a)'}});
  await ne({url: '/', header: {'a': '(a)'}}, {url: '/', header: {'a': '(b)'}});
  await eq({url: '/', header: {'a': '*a' }}, {url: '/', header: {'a': '*a' }});
  await ne({url: '/', header: {'a': '*a' }}, {url: '/', header: {'a': '*b' }});

  await eq({url: '/', header: 'a'  }, {url: '/', header: 'a'  });
  await ne({url: '/', header: 'a'  }, {url: '/', header: 'b'  });
  await eq({url: '/', header: '[a]'}, {url: '/', header: '[a]'});
  await ne({url: '/', header: '[a]'}, {url: '/', header: '[b]'});
  await eq({url: '/', header: '(a)'}, {url: '/', header: '(a)'});
  await ne({url: '/', header: '(a)'}, {url: '/', header: '(b)'});
  await eq({url: '/', header: '*a' }, {url: '/', header: '*a' });
  await ne({url: '/', header: '*a' }, {url: '/', header: '*b' });
});

test('case conflicts', async function (t) {
  t.plan(83);

  let show = r => (r.method || 'ALL') + ' ' + r.url + (r.header ? ' ' + JSON.stringify(r.header) : '');
  let eq = async (x, y, c) => {
    let msg = 'case ' + (c ? 'in' : '') + 'sensitive `' + show(x) + '` conflicts with `' + show(y) + '`';
    return t.throws(async () => { build([x,y], {case: c}); }, /case conflict/, msg);
  }
  let ne = async (x, y, c) => {
    let msg = 'case ' + (c ? 'in' : '') + 'sensitive `' + show(x) + '` does not conflict with `' + show(y) + '`';
    return t.notThrows(async () => { build([x,y], {case: c}); }, msg);
  }

  await eq({url: '/a'   }, {url: '/A'   }, true);
  await ne({url: '/a'   }, {url: '/A'   }, false);
  await eq({url: '/[a]' }, {url: '/[A]' }, true);
  await ne({url: '/[a]' }, {url: '/[A]' }, false);
  await eq({url: '/(a)' }, {url: '/(A)' }, true);
  await ne({url: '/(a)' }, {url: '/(A)' }, false);
  await eq({url: '/a*'  }, {url: '/A*'  }, true);
  await ne({url: '/a*'  }, {url: '/A*'  }, false);
  await eq({url: '/a**' }, {url: '/A**' }, true);
  await ne({url: '/a**' }, {url: '/A**' }, false);

  await eq({url: '/a/b'}, {url: '/A/b'}, true);
  await ne({url: '/a/b'}, {url: '/A/b'}, false);
  await ne({url: '/a/b'}, {url: '/a/c'}, true);
  await eq({url: '/a/b'}, {url: '/A/c'}, true);
  await ne({url: '/a/b'}, {url: '/A/c'}, false);

  await eq({url: '?a=b'  }, {url: '?a=B'  }, true);
  await ne({url: '?a=b'  }, {url: '?a=B'  }, false);
  await eq({url: '?a=[b]'}, {url: '?a=[B]'}, true);
  await ne({url: '?a=[b]'}, {url: '?a=[B]'}, false);
  await eq({url: '?a=(b)'}, {url: '?a=(B)'}, true);
  await ne({url: '?a=(b)'}, {url: '?a=(B)'}, false);
  await eq({url: '?a=b*' }, {url: '?a=B*' }, true);
  await ne({url: '?a=b*' }, {url: '?a=B*' }, false);

  await eq({url: '?a=b&c'}, {url: '?a=B&c'}, true);
  await ne({url: '?a=b&c'}, {url: '?a=B&c'}, false);
  await ne({url: '?a=b&c'}, {url: '?a=b&d'}, true);
  await eq({url: '?a=b&c'}, {url: '?a=B&d'}, true);
  await ne({url: '?a=b&c'}, {url: '?a=B&d'}, false);

  await eq({url: '?a'  }, {url: '?A'  }, true);
  await ne({url: '?a'  }, {url: '?A'  }, false);
  await eq({url: '?[a]'}, {url: '?[A]'}, true);
  await ne({url: '?[a]'}, {url: '?[A]'}, false);
  await eq({url: '?(a)'}, {url: '?(A)'}, true);
  await ne({url: '?(a)'}, {url: '?(A)'}, false);
  await eq({url: '?a*' }, {url: '?A*' }, true);
  await ne({url: '?a*' }, {url: '?A*' }, false);

  await eq({url: '?a&b'}, {url: '?A&b'}, true);
  await ne({url: '?a&b'}, {url: '?A&b'}, false);
  await ne({url: '?a&b'}, {url: '?a&c'}, true);
  await eq({url: '?a&b'}, {url: '?A&c'}, true);
  await ne({url: '?a&b'}, {url: '?A&c'}, false);

  await eq({url: '#a'  }, {url: '#A'  }, true);
  await ne({url: '#a'  }, {url: '#A'  }, false);
  await eq({url: '#[a]'}, {url: '#[A]'}, true);
  await ne({url: '#[a]'}, {url: '#[A]'}, false);
  await eq({url: '#(a)'}, {url: '#(A)'}, true);
  await ne({url: '#(a)'}, {url: '#(A)'}, false);
  await eq({url: '#a*' }, {url: '#A*' }, true);
  await ne({url: '#a*' }, {url: '#A*' }, false);

  await eq({url: '/', method: 'a'  }, {url: '/', method: 'A'  }, true);
  await ne({url: '/', method: 'a'  }, {url: '/', method: 'A'  }, false);
  await eq({url: '/', method: '[a]'}, {url: '/', method: '[A]'}, true);
  await ne({url: '/', method: '[a]'}, {url: '/', method: '[A]'}, false);
  await eq({url: '/', method: '(a)'}, {url: '/', method: '(A)'}, true);
  await ne({url: '/', method: '(a)'}, {url: '/', method: '(A)'}, false);
  await eq({url: '/', method: 'a*' }, {url: '/', method: 'A*' }, true);
  await ne({url: '/', method: 'a*' }, {url: '/', method: 'A*' }, false);

  await eq({url: '/', header: {'a': 'a'  }}, {url: '/', header: {'a': 'A'  }}, true);
  await ne({url: '/', header: {'a': 'a'  }}, {url: '/', header: {'a': 'A'  }}, false);
  await eq({url: '/', header: {'a': '[a]'}}, {url: '/', header: {'a': '[A]'}}, true);
  await ne({url: '/', header: {'a': '[a]'}}, {url: '/', header: {'a': '[A]'}}, false);
  await eq({url: '/', header: {'a': '(a)'}}, {url: '/', header: {'a': '(A)'}}, true);
  await ne({url: '/', header: {'a': '(a)'}}, {url: '/', header: {'a': '(A)'}}, false);
  await eq({url: '/', header: {'a': 'a*' }}, {url: '/', header: {'a': 'A*' }}, true);
  await ne({url: '/', header: {'a': 'a*' }}, {url: '/', header: {'a': 'A*' }}, false);

  await eq({url: '/', header: {'a': 'a', 'b': 'b'}}, {url: '/', header: {'a': 'A', 'b': 'b'}}, true);
  await ne({url: '/', header: {'a': 'a', 'b': 'b'}}, {url: '/', header: {'a': 'A', 'b': 'b'}}, false);
  await ne({url: '/', header: {'a': 'a', 'b': 'b'}}, {url: '/', header: {'a': 'a', 'c': 'c'}}, true);
  await eq({url: '/', header: {'a': 'a', 'b': 'b'}}, {url: '/', header: {'a': 'A', 'c': 'c'}}, true);
  await ne({url: '/', header: {'a': 'a', 'b': 'b'}}, {url: '/', header: {'a': 'A', 'c': 'c'}}, false);

  await eq({url: '/', header: 'a'  }, {url: '/', header: 'A'  }, true);
  await ne({url: '/', header: 'a'  }, {url: '/', header: 'A'  }, false);
  await eq({url: '/', header: '[a]'}, {url: '/', header: '[A]'}, true);
  await ne({url: '/', header: '[a]'}, {url: '/', header: '[A]'}, false);
  await eq({url: '/', header: '(a)'}, {url: '/', header: '(A)'}, true);
  await ne({url: '/', header: '(a)'}, {url: '/', header: '(A)'}, false);
  await eq({url: '/', header: 'a*' }, {url: '/', header: 'A*' }, true);
  await ne({url: '/', header: 'a*' }, {url: '/', header: 'A*' }, false);

  await eq({url: '/', header: ['a', 'b']  }, {url: '/', header: ['A', 'b']  }, true);
  await ne({url: '/', header: ['a', 'b']  }, {url: '/', header: ['A', 'b']  }, false);
  await ne({url: '/', header: ['a', 'b']  }, {url: '/', header: ['a', 'c']  }, true);
  await eq({url: '/', header: ['a', 'b']  }, {url: '/', header: ['A', 'c']  }, true);
  await ne({url: '/', header: ['a', 'b']  }, {url: '/', header: ['A', 'c']  }, false);
});

test('trim conflicts', async function (t) {
  t.plan(7);

  let show = r => (r.method || 'ALL') + ' ' + r.url + (r.header ? ' ' + JSON.stringify(r.header) : '');
  let eq = async (x, y, trim) => {
    let msg = (trim ? '' : 'non ') +'trimming `' + show(x) + '` conflicts with `' + show(y) + '`';
    return t.throws(async () => { build([x,y], {trim}); }, /duplicate route/, msg);
  }
  let ne = async (x, y, trim) => {
    let msg = (trim ? '' : 'non ') +'trimming `' + show(x) + '` does not conflict with `' + show(y) + '`';
    return t.notThrows(async () => { build([x,y], {trim}); }, msg);
  }

  await eq({url: ''}, {url: '/'}, true);
  await ne({url: ''}, {url: '/'}, false);
  await eq({url: '/a'}, {url: '/a/'}, true);
  await ne({url: '/a'}, {url: '/a/'}, false);
  await eq({url: '/a/b'}, {url: '/a/b/'}, true);
  await ne({url: '/a/b'}, {url: '/a/b/'}, false);
  await ne({url: '/a/b'}, {url: '/a//b/'}, true);
});

test('trace', async function (t) {
  t.plan(6);

  let tree = function (routes) {
    for (let route of routes)
      delete route.handler;

    t.eq(routes[0], {method: ['GET'], segment: ['', '']}, '1: GET  /');
    t.eq(routes[1], {method: ['GET'], segment: ['', 'a']}, '2: GET  /a');
    t.eq(routes[2], {method: ['POST'], segment: ['', 'b']}, '3: POST /b');
    t.eq(routes[3], {method: ['PUT'], segment: ['', 'b', '*'], query: [['c', 'd']]}, '4: PUT  /b/*?c=d');
    t.eq(routes[4], {method: ['GET'], segment: ['', 'b', '*']}, '5: GET  /b/*');
    t.eq(routes[5], {method: ['[.*]'], segment: ['', '**']}, '6: ALL  /**');
  };

  build([
    {method: 'GET', url: '/'},
    {method: 'GET', url: '/a'},
    {method: 'POST', url: '/b'},
    {method: 'PUT', url: '/b/*?c=d'},
    {method: 'GET', url: '/b/*'},
    {url: '/**'}
  ].sort(() => Math.random() - 0.5), {tree: tree});
});
