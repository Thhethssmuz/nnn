'use strict';

const test = require('bandage');
const sort = require('../lib/sort');
const trace = require('../lib/build').trace;

const compare = function (t, routeX, routeY, expected) {
  const actual = sort.route(routeX, routeY);
  const sign = expected === 0 ? '=' : expected === 1 ? '>' : '<';
  const msg =
    `[${routeX[0].order}]: ${routeX.map(x => trace(x)).join(' ')} ${sign} ` +
    `[${routeY[0].order}]: ${routeY.map(x => trace(x)).join(' ')}`;
  t.eq(actual, expected, msg);
};


test('sort asc', function *(t) {

  let xs = [ { type: 'segment', pattern: 'conditional', org: '[a]', order: NaN } ];
  let ys = [ { type: 'segment', pattern: 'conditional', org: '[b]', order: 0   } ];

  t.eq(sort.type(xs, ys), 0, 'bad order');
  t.eq(sort.type(ys, xs), 0, 'bad order');

  xs[0].order = 1;

  t.eq(sort.type(xs, ys),  1, 'retain definition order');
  t.eq(sort.type(ys, xs), -1, 'retain definition order');
});

test('sort recursive', function *(t) {
  let xs = [ { type: 'segment', pattern: 'absolute', org: 'a' },
             { type: 'segment', pattern: 'null' } ];
  let ys = [ { type: 'segment', pattern: 'absolute', org: 'a' } ]

  t.eq(sort([]), [], 'sort empty');
  t.eq(sort([xs]), [xs], 'sort one');
  t.eq(sort([xs,ys]), [xs,ys], 'sort order');
  t.eq(sort([ys,xs]), [xs,ys], 'sort reverse order');
});


test('sort segments', function *(t) {
  let xs, ys;

  xs = [ { type: 'segment', pattern: 'absolute', org: 'x', match: 'x', order: 0 } ];
  ys = [ { type: 'segment', pattern: 'absolute', org: 'x', match: 'x', order: 1 } ];

  compare(t, xs, ys, 0);
  xs[0].order = 2;
  compare(t, xs, ys, 0);

  ys = [ { type: 'segment', pattern: 'absolute', org: 'y', match: 'y', order: 1 } ];

  compare(t, xs, ys, -1);
  xs[0].order = 0;
  compare(t, xs, ys, -1);

  ys = [ { type: 'segment', pattern: 'variable', org: '*', match: {}, order: 1 } ];

  compare(t, xs, ys, -1);
  xs[0].order = 2;
  compare(t, xs, ys, -1);
});

test('sort queries', function *(t) {
  t.plan(12);

  let xs, ys;

  xs = [
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'x', match: 'x' },
      value  : { type: 'value', pattern: 'absolute', org: '1', match: '1' },
      type   : 'query',
      order  : 0 },
  ];

  ys = [
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'x', match: 'x' },
      value  : { type: 'value', pattern: 'absolute', org: '1', match: '1' },
      type   : 'query',
      order  : 1 },
  ];

  compare(t, xs, ys, 0);
  xs[0].order = 2;
  compare(t, xs, ys, 0);

  ys = [
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'x', match: 'x' },
      value  : { type: 'value', pattern: 'absolute', org: '2', match: '2' },
      type   : 'query',
      order  : 1 },
  ];

  compare(t, xs, ys, -1);
  xs[0].order = 0;
  compare(t, xs, ys, -1);

  ys = [
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'x', match: 'x' },
      value  : { type: 'value', pattern: 'variable', match: {} },
      type   : 'query',
      order  : 1 },
  ];

  compare(t, xs, ys, -1);
  xs[0].order = 2;
  compare(t, xs, ys, -1);

  xs = [
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'x', match: 'x' },
      value  : { type: 'value', pattern: 'variable', match: {} },
      type   : 'query',
      order  : 2 },
  ];

  compare(t, xs, ys, 0);
  xs[0].order = 2;
  compare(t, xs, ys, 0);

  xs = [
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'z', match: 'z' },
      value  : { type: 'value', pattern: 'variable', match: {} },
      type   : 'query',
      order  : 0 },
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'x', match: 'x' },
      value  : { type: 'value', pattern: 'variable', match: {} },
      type   : 'query',
      order  : 0 },
  ];

  ys = [
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'y', match: 'y' },
      value  : { type: 'value', pattern: 'variable', match: {} },
      type   : 'query',
      order  : 1 },
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'x', match: 'x' },
      value  : { type: 'value', pattern: 'variable', match: {} },
      type   : 'query',
      order  : 1 },
  ];

  compare(t, xs, ys, -1);
  xs.forEach(x => { x.order = 2; });
  compare(t, xs, ys, 1);

  ys = [
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'z', match: 'z' },
      value  : { type: 'value', pattern: 'variable', match: {} },
      type   : 'query',
      order  : 1 },
    { pattern: 'pair',
      key    : { type: 'key', pattern: 'absolute', org: 'y', match: 'y' },
      value  : { type: 'value', pattern: 'variable', match: {} },
      type   : 'query',
      order  : 1 },
  ];

  compare(t, xs, ys, 1);
  xs.forEach(x => { x.order = 0; });
  compare(t, xs, ys, -1);
});

test('sort methods', function *(t) {
  let xs, ys;

  xs = [ { type: 'method', pattern: 'absolute', org: 'GET', match: 'GET', order: 0 } ];
  ys = [ { type: 'method', pattern: 'absolute', org: 'GET', match: 'GET', order: 1 } ];

  compare(t, xs, ys, 0);
  xs[0].order = 2;
  compare(t, xs, ys, 0);

  ys = [ { type: 'method', pattern: 'absolute', org: 'POST', match: 'POST', order: 1 } ];

  compare(t, xs, ys, -1);
  xs[0].order = 0;
  compare(t, xs, ys, -1);

  ys = [ { type: 'method', pattern: 'variable', org: '*', match: {}, order: 1 } ];

  compare(t, xs, ys, -1);
  xs[0].order = 2;
  compare(t, xs, ys, -1);
});

