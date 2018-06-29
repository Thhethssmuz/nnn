'use strict';

const test = require('bandage');
const build = require('../lib/build');

test('errors', function *(t) {
  t.plan(3);

  yield t.throws(function *() {
    build([{ url: '[', method: 'GET'}], {});
  }, /Expected .* end of input found/, 'parse error');

  yield t.throws(function *() {
    build([{ url: '***', method: 'GET'}], {});
  }, /is not a valid pattern/, 'invalid pattern');

  yield t.throws(function *() {
    build([{ url: '/', header: 123 }], {});
  }, TypeError, 'header type');
});

test('duplicate handlers', function *(t) {
  t.plan(58);

  let show = r => (r.method || 'ALL') + ' ' + r.url + (r.header ? ' ' + JSON.stringify(r.header) : '');
  let eq = (x, y) => {
    let msg = '`' + show(x) + '` equals `' + show(y) + '`';
    return t.throws(() => build([x,y], {}), /duplicate route/, msg);
  }
  let ne = (x, y) => {
    let msg = '`' + show(x) + '` not equals `' + show(y) + '`';
    return t.notThrows(() => build([x,y], {}), msg);
  }

  yield eq({url: '/a'  }, {url: '/a'  });
  yield ne({url: '/a'  }, {url: '/b'  });
  yield eq({url: '/[a]'}, {url: '/[a]'});
  yield ne({url: '/[a]'}, {url: '/[b]'});
  yield eq({url: '/(a)'}, {url: '/(a)'});
  yield ne({url: '/(a)'}, {url: '/(b)'});
  yield eq({url: '/*a' }, {url: '/*a' });
  yield ne({url: '/*a' }, {url: '/*b' });
  yield eq({url: '/**a'}, {url: '/**a'});
  yield ne({url: '/**a'}, {url: '/**b'});

  yield eq({url: '?a=1'  }, {url: '?a=1'  });
  yield ne({url: '?a=1'  }, {url: '?a=2'  });
  yield eq({url: '?a=[1]'}, {url: '?a=[1]'});
  yield ne({url: '?a=[1]'}, {url: '?a=[2]'});
  yield eq({url: '?a=(1)'}, {url: '?a=(1)'});
  yield ne({url: '?a=(1)'}, {url: '?a=(2)'});
  yield eq({url: '?a=*1' }, {url: '?a=*1' });
  yield ne({url: '?a=*1' }, {url: '?a=*2' });

  yield eq({url: '?a'  }, {url: '?a'  });
  yield ne({url: '?a'  }, {url: '?b'  });
  yield eq({url: '?[a]'}, {url: '?[a]'});
  yield ne({url: '?[a]'}, {url: '?[b]'});
  yield eq({url: '?(a)'}, {url: '?(a)'});
  yield ne({url: '?(a)'}, {url: '?(b)'});
  yield eq({url: '?*a' }, {url: '?*a' });
  yield ne({url: '?*a' }, {url: '?*b' });

  yield eq({url: '#a'  }, {url: '#a'  });
  yield ne({url: '#a'  }, {url: '#b'  });
  yield eq({url: '#[a]'}, {url: '#[a]'});
  yield ne({url: '#[a]'}, {url: '#[b]'});
  yield eq({url: '#(a)'}, {url: '#(a)'});
  yield ne({url: '#(a)'}, {url: '#(b)'});
  yield eq({url: '#*a' }, {url: '#*a' });
  yield ne({url: '#*a' }, {url: '#*b' });

  yield eq({url: '/', method: 'a'  }, {url: '/', method: 'a'  });
  yield ne({url: '/', method: 'a'  }, {url: '/', method: 'b'  });
  yield eq({url: '/', method: '[a]'}, {url: '/', method: '[a]'});
  yield ne({url: '/', method: '[a]'}, {url: '/', method: '[b]'});
  yield eq({url: '/', method: '(a)'}, {url: '/', method: '(a)'});
  yield ne({url: '/', method: '(a)'}, {url: '/', method: '(b)'});
  yield eq({url: '/', method: '*a' }, {url: '/', method: '*a' });
  yield ne({url: '/', method: '*a' }, {url: '/', method: '*b' });

  yield eq({url: '/', header: {'a': 'a'  }}, {url: '/', header: {'a': 'a'  }});
  yield ne({url: '/', header: {'a': 'a'  }}, {url: '/', header: {'a': 'b'  }});
  yield eq({url: '/', header: {'a': '[a]'}}, {url: '/', header: {'a': '[a]'}});
  yield ne({url: '/', header: {'a': '[a]'}}, {url: '/', header: {'a': '[b]'}});
  yield eq({url: '/', header: {'a': '(a)'}}, {url: '/', header: {'a': '(a)'}});
  yield ne({url: '/', header: {'a': '(a)'}}, {url: '/', header: {'a': '(b)'}});
  yield eq({url: '/', header: {'a': '*a' }}, {url: '/', header: {'a': '*a' }});
  yield ne({url: '/', header: {'a': '*a' }}, {url: '/', header: {'a': '*b' }});

  yield eq({url: '/', header: 'a'  }, {url: '/', header: 'a'  });
  yield ne({url: '/', header: 'a'  }, {url: '/', header: 'b'  });
  yield eq({url: '/', header: '[a]'}, {url: '/', header: '[a]'});
  yield ne({url: '/', header: '[a]'}, {url: '/', header: '[b]'});
  yield eq({url: '/', header: '(a)'}, {url: '/', header: '(a)'});
  yield ne({url: '/', header: '(a)'}, {url: '/', header: '(b)'});
  yield eq({url: '/', header: '*a' }, {url: '/', header: '*a' });
  yield ne({url: '/', header: '*a' }, {url: '/', header: '*b' });
});

test('case conflicts', function *(t) {
  t.plan(58);

  let show = r => (r.method || 'ALL') + ' ' + r.url + (r.header ? ' ' + JSON.stringify(r.header) : '');
  let eq = (x, y, c) => {
    let msg = 'case ' + (c ? 'in' : '') + 'sensitive `' + show(x) + '` conflicts with `' + show(y) + '`';
    return t.throws(() => build([x,y], {case: c}), /case conflict/, msg);
  }
  let ne = (x, y, c) => {
    let msg = 'case ' + (c ? 'in' : '') + 'sensitive `' + show(x) + '` does not conflict with `' + show(y) + '`';
    return t.notThrows(() => build([x,y], {case: c}), msg);
  }

  yield eq({url: '/a'   }, {url: '/A'   }, true);
  yield ne({url: '/a'   }, {url: '/A'   }, false);
  yield eq({url: '/[a]' }, {url: '/[A]' }, true);
  yield ne({url: '/[a]' }, {url: '/[A]' }, false);
  yield eq({url: '/(a)' }, {url: '/(A)' }, true);
  yield ne({url: '/(a)' }, {url: '/(A)' }, false);
  yield eq({url: '/a*'  }, {url: '/A*'  }, true);
  yield ne({url: '/a*'  }, {url: '/A*'  }, false);
  yield eq({url: '/a**' }, {url: '/A**' }, true);
  yield ne({url: '/a**' }, {url: '/A**' }, false);

  yield eq({url: '?a=b'  }, {url: '?a=B'  }, true);
  yield ne({url: '?a=b'  }, {url: '?a=B'  }, false);
  yield eq({url: '?a=[b]'}, {url: '?a=[B]'}, true);
  yield ne({url: '?a=[b]'}, {url: '?a=[B]'}, false);
  yield eq({url: '?a=(b)'}, {url: '?a=(B)'}, true);
  yield ne({url: '?a=(b)'}, {url: '?a=(B)'}, false);
  yield eq({url: '?a=b*' }, {url: '?a=B*' }, true);
  yield ne({url: '?a=b*' }, {url: '?a=B*' }, false);

  yield eq({url: '?a'  }, {url: '?A'  }, true);
  yield ne({url: '?a'  }, {url: '?A'  }, false);
  yield eq({url: '?[a]'}, {url: '?[A]'}, true);
  yield ne({url: '?[a]'}, {url: '?[A]'}, false);
  yield eq({url: '?(a)'}, {url: '?(A)'}, true);
  yield ne({url: '?(a)'}, {url: '?(A)'}, false);
  yield eq({url: '?a*' }, {url: '?A*' }, true);
  yield ne({url: '?a*' }, {url: '?A*' }, false);

  yield eq({url: '#a'  }, {url: '#A'  }, true);
  yield ne({url: '#a'  }, {url: '#A'  }, false);
  yield eq({url: '#[a]'}, {url: '#[A]'}, true);
  yield ne({url: '#[a]'}, {url: '#[A]'}, false);
  yield eq({url: '#(a)'}, {url: '#(A)'}, true);
  yield ne({url: '#(a)'}, {url: '#(A)'}, false);
  yield eq({url: '#a*' }, {url: '#A*' }, true);
  yield ne({url: '#a*' }, {url: '#A*' }, false);

  yield eq({url: '/', method: 'a'  }, {url: '/', method: 'A'  }, true);
  yield ne({url: '/', method: 'a'  }, {url: '/', method: 'A'  }, false);
  yield eq({url: '/', method: '[a]'}, {url: '/', method: '[A]'}, true);
  yield ne({url: '/', method: '[a]'}, {url: '/', method: '[A]'}, false);
  yield eq({url: '/', method: '(a)'}, {url: '/', method: '(A)'}, true);
  yield ne({url: '/', method: '(a)'}, {url: '/', method: '(A)'}, false);
  yield eq({url: '/', method: 'a*' }, {url: '/', method: 'A*' }, true);
  yield ne({url: '/', method: 'a*' }, {url: '/', method: 'A*' }, false);

  yield eq({url: '/', headers: {'a': 'a'  }}, {url: '/', headers: {'a': 'A'  }}, true);
  yield ne({url: '/', headers: {'a': 'a'  }}, {url: '/', headers: {'a': 'A'  }}, false);
  yield eq({url: '/', headers: {'a': '[a]'}}, {url: '/', headers: {'a': '[A]'}}, true);
  yield ne({url: '/', headers: {'a': '[a]'}}, {url: '/', headers: {'a': '[A]'}}, false);
  yield eq({url: '/', headers: {'a': '(a)'}}, {url: '/', headers: {'a': '(A)'}}, true);
  yield ne({url: '/', headers: {'a': '(a)'}}, {url: '/', headers: {'a': '(A)'}}, false);
  yield eq({url: '/', headers: {'a': 'a*' }}, {url: '/', headers: {'a': 'A*' }}, true);
  yield ne({url: '/', headers: {'a': 'a*' }}, {url: '/', headers: {'a': 'A*' }}, false);

  yield eq({url: '/', headers: 'a'  }, {url: '/', headers: 'A'  }, true);
  yield ne({url: '/', headers: 'a'  }, {url: '/', headers: 'A'  }, false);
  yield eq({url: '/', headers: '[a]'}, {url: '/', headers: '[A]'}, true);
  yield ne({url: '/', headers: '[a]'}, {url: '/', headers: '[A]'}, false);
  yield eq({url: '/', headers: '(a)'}, {url: '/', headers: '(A)'}, true);
  yield ne({url: '/', headers: '(a)'}, {url: '/', headers: '(A)'}, false);
  yield eq({url: '/', headers: 'a*' }, {url: '/', headers: 'A*' }, true);
  yield ne({url: '/', headers: 'a*' }, {url: '/', headers: 'A*' }, false);
});

test('trim conflicts', function *(t) {
  t.plan(7);

  let show = r => (r.method || 'ALL') + ' ' + r.url + (r.header ? ' ' + JSON.stringify(r.header) : '');
  let eq = (x, y, trim) => {
    let msg = (trim ? '' : 'non ') +'trimming `' + show(x) + '` conflicts with `' + show(y) + '`';
    return t.throws(() => build([x,y], {trim}), /duplicate route/, msg);
  }
  let ne = (x, y, trim) => {
    let msg = (trim ? '' : 'non ') +'trimming `' + show(x) + '` does not conflict with `' + show(y) + '`';
    return t.notThrows(() => build([x,y], {trim}), msg);
  }

  yield eq({url: ''}, {url: '/'}, true);
  yield ne({url: ''}, {url: '/'}, false);
  yield eq({url: '/a'}, {url: '/a/'}, true);
  yield ne({url: '/a'}, {url: '/a/'}, false);
  yield eq({url: '/a/b'}, {url: '/a/b/'}, true);
  yield ne({url: '/a/b'}, {url: '/a/b/'}, false);
  yield ne({url: '/a/b'}, {url: '/a//b/'}, true);
});

test('trace', function *(t) {
  t.plan(6);

  let tree = function (routes) {
    for (let route of routes)
      delete route.handler;

    t.eq(routes[0], {method: ['GET'], segment: ['', '']}, '1: GET  /');
    t.eq(routes[1], {method: ['GET'], segment: ['', 'a']}, '2: GET  /a');
    t.eq(routes[2], {method: ['POST'], segment: ['', 'b']}, '3: POST  /b');
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
