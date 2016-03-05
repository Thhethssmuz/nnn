'use strict';

const types    = Object.freeze({
  segment      : 0,
  query        : 1,
  fragment     : 2,
  method       : 3,
  header       : 4,
  handler      : 5
});
const patterns = Object.freeze({
  null         : 0,
  absolute     : 1,
  conditional  : 2,
  variable     : 3,
  glob         : 4
});

let asc        = (x,y) => x > y ? 1 : x < y ? -1 : x >= y ? 0 : NaN;

let when       = (p,f) => (x,y) => p(x,y) ? f(x,y) : 0;
let compare    = f => (x,y) => asc(f(x), f(y));

let sequence   = fs => (x,y) => fs.reduce((r,f) => r || f(x,y), 0);
let recursive  = f  => (xs,ys) =>
                 !xs.length && !ys.length ? 0 :
                 !xs.length ? 1 :
                 !ys.length ? -1 :
                 f(xs,ys) || recursive(f)(xs.slice(1), ys.slice(1));

let pattern1   = sequence([
                   compare(r => patterns[r[0].pattern]),
                   when(r => r[0].pattern === 'absolute', compare(r => r[0].org)),
                   when(
                     r => patterns[r[0].pattern] > 1,
                     when(compare(r => r[0].org), compare(r => r[0].order))
                   )
                 ]);
let pattern2   = sequence([
                   compare(r => -r.filter(x => x.type === r[0].type).length),
                   compare(r => patterns[r[0].key.pattern]),
                   when(r => r[0].key.pattern === 'absolute', compare(r => r[0].key.org)),
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

let type       = sequence([
                   compare(r => types[r[0].type]),
                   when(r => r[0].type === 'segment',  pattern1),
                   when(r => r[0].type === 'query',    pattern2),
                   when(r => r[0].type === 'fragment', pattern1),
                   when(r => r[0].type === 'method',   pattern1),
                   when(r => r[0].type === 'header',   pattern2)
                 ]);

let route      = recursive(type);
let sort       = rs => rs.sort(route);
sort.type      = type;

module.exports = sort;
