'use strict';

const test = require('awfltst');
const Router = require('../lib/router');
const State = Router.State;

test('of', async function (t) {
  t.plan(2);

  const state = new State(['a'], [['b', '1']], 'c', 'd', [['e', '2']], ['d']);
  const router = Router.of('x');

  router.unRouter(state, (x, s) => {
    t.eq(s, state, 'state unchanged');
    t.eq(x, 'x', 'yields');
  }, () => {
    t.fail('of fail');
  });
});
test('concat', async function (t) {
  t.plan(2);

  const state = new State(['a'], [['b', '1']], 'c', 'd', [['e', '2']], ['d']);
  const router = Router.empty().concat(Router.of('x'));

  router.unRouter(state, (x, s) => {
    t.eq(s, state, 'state unchanged');
    t.eq(x, 'x', 'yields');
  }, () => {
    t.fail('concat fail');
  });
});
test('map', async function (t) {
  t.plan(2);

  const state = new State(['a'], [['b', '1']], 'c', 'd', [['e', '2']], ['d']);
  const router = Router.of('123').map(x => parseInt(x, 10));

  router.unRouter(state, (x, s) => {
    t.eq(s, state, 'state unchanged');
    t.type(x, 'number', 'map applied');
  }, () => {
    t.fail('map fail');
  });
});
test('ap', async function (t) {
  t.plan(2);

  const state = new State(['a'], [['b', '1']], 'c', 'd', [['e', '2']], ['d']);
  const router = Router.of(x => x + 1).ap(Router.of(1));

  router.unRouter(state, (x, s) => {
    t.eq(s, state, 'state unchanged');
    t.eq(x, 2, 'transformation applied');
  }, () => {
    t.fail('ap fail');
  });
});
test('choice', async function (t) {
  t.plan(2);

  const state = new State(['a'], [['b', '1']], 'c', 'd', [['e', '2']], ['d']);
  const router = Router.choice(Router.empty(), Router.of('x'), Router.of('y'));

  router.unRouter(state, (x, s) => {
    t.eq(s, state, 'state unchanged');
    t.eq(x, 'x', 'yields first successful');
  }, () => {
    t.fail('choice fail');
  });
});

test('save', async function (t) {
  t.plan(2);

  const state = new State([], [], null, null, [], []);
  const router = Router.of('x').save();

  router.unRouter(state, (x, s) => {
    t.eq(s.saved, ['x'], 'value stored in state');
    t.eq(x, 'x', 'yields stored value');
  }, () => {
    t.fail('save fail');
  });
});

test('satisfy', async function (t) {
  t.plan(3);

  const state = new State(['a'], [['b', '1']], 'c', 'd', [['e', '2']], ['f']);

  Router.satisfy(x => x === 'x')('x').unRouter(state, (x, s) => {
    t.eq(s, state, 'state unchanged');
    t.eq(x, 'x', 'yields satisfied');
  }, () => {
    t.fail('satisfy fail');
  });

  Router.satisfy(x => x === 'y')('x').unRouter(state, () => {
    t.fail('satisfy fail');
  }, () => {
    t.ok(true, 'satisfy fails when not matched');
  });
});
test('match', async function (t) {
  t.plan(3);

  const state = new State(['a'], [['b', '1']], 'c', 'd', [['e', '2']], ['f']);

  Router.match(/(x)/)('x').unRouter(state, (x, s) => {
    t.eq(s, state, 'state unchanged');
    t.eq(x, ['x'], 'yields captures');
  }, () => {
    t.fail('match fail');
  });

  Router.match(/(y)/)('x').unRouter(state, () => {
    t.fail('match fail');
  }, () => {
    t.ok(true, 'match fails when not matched');
  });
});

test('segment satisfy', async function (t) {
  t.plan(2);

  const router = Router.segment(Router.satisfy(x => x === 'x'));

  router.unRouter(new State(['x'], [], null, null, [], []), (x, s) => {
    t.eq(s.path, [], 'segment was consumed');
    t.eq(x, 'x', 'consumed segment returned');
  }, () => {
    t.fail('segment fail');
  });
});
test('segment match', async function (t) {
  t.plan(2);

  const router = Router.segment(Router.match(/(x)/));

  router.unRouter(new State(['x'], [], null, null, [], []), (x, s) => {
    t.eq(s.path, [], 'segment was consumed');
    t.eq(x, ['x'], 'yields captures');
  }, () => {
    t.fail('segment fail');
  });
});


test('segments satisfy', async function (t) {
  t.plan(2);

  const router =
    Router.segments(Router.satisfy(x => x === 'x/y'), Router.of('lol'));

  router
    .unRouter(new State(['x', 'y', 'z'], [], null, null, [], []), (x, s) => {
      t.eq(s.path, ['z'], 'segments was consumed');
      t.eq(x, 'lol', 'yields value of continuation router');
    }, () => {
      t.fail('segments fail');
    });
});
test('segments match', async function (t) {
  t.plan(2);

  const router = Router.segments(Router.match(/(x\/y)/), Router.of('lol'));

  router
    .unRouter(new State(['x', 'y', 'z'], [], null, null, [], []), (x, s) => {
      t.eq(s.path, ['z'], 'segments was consumed');
      t.eq(x, 'lol', 'yields value of continuation router');
    }, () => {
      t.fail('segments fail');
    });
});
test('segments error', async function (t) {
  t.plan(2);

  const router =
    Router.segments(Router.satisfy(x => x === 'x/y'), Router.of('lol'));

  router.unRouter(new State([], [], null, null, [], []), () => {
    t.fail('should not pass for empty path');
  }, () => {
    t.ok(true, 'should not pass for empty path');
  });

  router.unRouter(new State(['x'], [], null, null, [], []), () => {
    t.fail('should not pass for empty path');
  }, () => {
    t.ok(true, 'should not pass for empty path');
  });
});

test('query satisfy', async function (t) {
  t.plan(2);

  const router = Router
    .query(Router.satisfy(x => x === 'x'), Router.satisfy(x => x === '1'));

  router.unRouter(new State([], [['x', '1']], null, null, [], []), (x, s) => {
    t.eq(s.queries, [], 'query was consumed');
    t.eq(x, ['x', '1'], 'consumed query returned');
  }, () => {
    t.fail('query fail');
  });
});
test('query match', async function (t) {
  t.plan(2);

  const router = Router.query(Router.match(/(x)/), Router.match(/(1)/));

  router.unRouter(new State([], [['x', '1']], null, null, [], []), (x, s) => {
    t.eq(s.queries, [], 'query was consumed');
    t.eq(x, [['x'], ['1']], 'yields captures');
  }, () => {
    t.fail('query fail');
  });
});

test('fragment satisfy', async function (t) {
  t.plan(2);

  const router = Router.fragment(Router.satisfy(x => x === 'x'));

  router.unRouter(new State([], [], 'x', null, [], []), (x, s) => {
    t.eq(s.fragment, null, 'fragment was consumed');
    t.eq(x, 'x', 'consumed fragment returned');
  }, () => {
    t.fail('fragment fail');
  });
});
test('fragment match', async function (t) {
  t.plan(2);

  const router = Router.fragment(Router.match(/(x)/));

  router.unRouter(new State([], [], 'x', null, [], []), (x, s) => {
    t.eq(s.fragment, null, 'fragment was consumed');
    t.eq(x, ['x'], 'yields captures');
  }, () => {
    t.fail('fragment fail');
  });
});

test('method satisfy', async function (t) {
  t.plan(2);

  const router = Router.method(Router.satisfy(x => x === 'x'));

  router.unRouter(new State([], [], null, 'x', [], []), (x, s) => {
    t.eq(s.method, null, 'method was consumed');
    t.eq(x, 'x', 'consumed method returned');
  }, () => {
    t.fail('method fail');
  });
});
test('method match', async function (t) {
  t.plan(2);

  const router = Router.method(Router.match(/(x)/));

  router.unRouter(new State([], [], null, 'x', [], []), (x, s) => {
    t.eq(s.method, null, 'method was consumed');
    t.eq(x, ['x'], 'yields captures');
  }, () => {
    t.fail('method fail');
  });
});
test('method error', async function (t) {
  t.plan(1);

  const router = Router.method(Router.satisfy(x => x === 'x'));

  router.unRouter(new State([], [], null, null, [], []), () => {
    t.fail('should not pass for no method');
  }, () => {
    t.ok(true, 'should not pass for no method');
  });
});

test('header satisfy', async function (t) {
  t.plan(2);

  const router = Router
    .header(Router.satisfy(x => x === 'x'), Router.satisfy(x => x === '1'));

  router.unRouter(new State([], [], null, null, [['x', '1']], []), (x, s) => {
    t.eq(s.headers, [], 'header was consumed');
    t.eq(x, ['x', '1'], 'consumed header returned');
  }, () => {
    t.fail('header fail');
  });
});
test('header match', async function (t) {
  t.plan(2);

  const router = Router.header(Router.match(/(x)/), Router.match(/(1)/));

  router.unRouter(new State([], [], null, null, [['x', '1']], []), (x, s) => {
    t.eq(s.headers, [], 'header was consumed');
    t.eq(x, [['x'], ['1']], 'yields captures');
  }, () => {
    t.fail('header fail');
  });
});
