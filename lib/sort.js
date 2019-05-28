'use strict';

const types = Object.freeze({
  segment : 0,
  query   : 1,
  fragment: 2,
  method  : 3,
  header  : 4,
  handler : 5
});
const patterns = Object.freeze({
  null       : 0,
  absolute   : 1,
  conditional: 2,
  variable   : 3,
  glob       : 4
});

const asc = (x, y) => {
  if (x > y)
    return 1;
  if (x < y)
    return -1;
  if (x >= y)
    return 0;
  return NaN;
};

const when    = (p, f) => (x, y) => p(x, y) ? f(x, y) : 0;
const compare = f => (x, y) => asc(f(x), f(y));

const sequence  = fs => (x, y) => fs.reduce((r, f) => r || f(x, y), 0);
const recursive = f  => (xs, ys) => {
  if (!xs.length && !ys.length)
    return 0;
  if (!xs.length)
    return 1;
  if (!ys.length)
    return -1;
  return f(xs, ys) || recursive(f)(xs.slice(1), ys.slice(1));
};

const pattern1 = sequence([
  compare(r => patterns[r[0].pattern]),
  when(r => r[0].pattern === 'absolute', compare(r => r[0].org)),
  when(
    r => patterns[r[0].pattern] > 1,
    when(compare(r => r[0].org), compare(r => r[0].order))
  )
]);
const pattern2 = sequence([
  compare(r => -r.filter(x => x.type === r[0].type).length),
  compare(r => patterns[r[0].key.pattern]),
  when(
    r => r[0].key.pattern === 'absolute',
    when(compare(r => r[0].key.org), compare(r => r[0].order))
  ),
  compare(r => patterns[r[0].value.pattern]),
  when(r => r[0].value.pattern === 'absolute', compare(r => r[0].value.org)),
  when(
    r => patterns[r[0].value.pattern] > 1,
    when(
      sequence([
        compare(r => r[0].key.org),
        compare(r => r[0].value.org || '*')
      ]),
      compare(r => r[0].order)
    )
  )
]);

const type = sequence([
  compare(r => types[r[0].type]),
  when(r => r[0].type === 'segment',  pattern1),
  when(r => r[0].type === 'query',    pattern2),
  when(r => r[0].type === 'fragment', pattern1),
  when(r => r[0].type === 'method',   pattern1),
  when(r => r[0].type === 'header',   pattern2)
]);

const route = recursive(type);
const sort  = rs => rs.sort(route);
sort.type   = type;
sort.route  = route;

module.exports = sort;
