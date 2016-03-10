'use strict';

const test = require('bandage');
const sort = require('../lib/sort');

test('asc', function *(t) {

  let xs = [ { type: 'segment', pattern: 'conditional', org: '[a]', order: NaN } ];
  let ys = [ { type: 'segment', pattern: 'conditional', org: '[b]', order: 0   } ];

  t.eq(sort.type(xs, ys), 0, 'bad order');
  t.eq(sort.type(ys, xs), 0, 'bad order');

  xs[0].order = 1;

  t.eq(sort.type(xs, ys),  1, 'retain definition order');
  t.eq(sort.type(ys, xs), -1, 'retain definition order');
});

test('recursive', function *(t) {
  let xs = [ { type: 'segment', pattern: 'absolute', org: 'a' },
             { type: 'segment', pattern: 'null' } ];
  let ys = [ { type: 'segment', pattern: 'absolute', org: 'a' } ]

  t.eq(sort([]), [], 'sort empty');
  t.eq(sort([xs]), [xs], 'sort one');
  t.eq(sort([xs,ys]), [xs,ys], 'sort order');
  t.eq(sort([ys,xs]), [xs,ys], 'sort reverse order');
});
