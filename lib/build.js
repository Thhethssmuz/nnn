'use strict';

const parser = require('../parser');
const sort   = require('./sort');
const Router = require('./router');


let show = function (trace) {
  let r = '';

  if (trace.segment)
    r += trace.segment.join('/');

  if (trace.query)
    r += '?' + trace.query.map(xs => xs[0] + (xs[1] ? '=' + xs[1] : '')).join('&');

  if (trace.fragment)
    r += '#' + trace.fragment[0];

  if (trace.method)
    r = (trace.method[0] === '[.*]' ? 'ALL' : trace.method[0]) + ' ' + r;

  if (trace.header)
    r += ' {' + trace.header.map(xs => xs[0] + (xs[1] ? ': ' + xs[1] : '')).join(', ') + '}';

  return r;
};
let trace = function (node, _state, opts) {
  _state = _state || {};
  _state[node.type] = _state[node.type] || [];

  if (node.pattern === 'pair')
    _state[node.type].unshift([node.key.org, node.value && node.value.org]);
  else if (node.pattern !== 'null')
    _state[node.type].unshift(node.org);

  if (node.parent)
    return trace(node.parent, _state, opts);
  if (opts && opts.debug)
    return _state;
  return show(_state);
};
let walk = function (tree, f) {
  return tree
    .map(x => x.type === 'handler' ? [f(x)] : [])
    .concat(tree.map(x => walk(x.children || [], f)))
    .reduce((x,y) => x.concat(y), []);
};


let parse = function (pattern, startRule) {
  try {

    return parser.parse(pattern, {startRule});

  } catch (err) {

    let msg = 'in URL pattern `' + pattern + '`';
    if (err.location)
      msg += ' at column ' + err.location.start.column;
    msg += ', ' + err.message;

    throw new SyntaxError(msg);
  }
};
let merge = (routes, opts) => sort(routes).reduce((merged, route) => {
  let node = merged.find(x => !sort.type(route, [x]));

  if (!node && opts.case) {
    let lower = x => {
      let r = {
        type   : x.type,
        pattern: x.pattern,
        org    : x.org && x.org.toLowerCase(),
        order  : x.order
      };
      if (x.key) r.key = {
        type   : x.key.type,
        pattern: x.key.pattern,
        org    : x.key.org && x.key.org.toLowerCase()
      };
      if (x.value) r.value = {
        type   : x.value.type,
        pattern: x.value.pattern,
        org    : x.value.org && x.value.org.toLowerCase()
      };
      return r;
    };

    let fail = merged.find(x => {
      let eq = !sort.type([lower(route[0])], [lower(x)]);

      let ox = x.org;
      let kx = x.key && x.key.org;
      let vx = x.value && x.value.org;
      let oy = route[0].org;
      let ky = route[0].key && route[0].key.org;
      let vy = route[0].value && route[0].value.org;

      return eq && (ox !== oy || kx !== ky || vx !== vy);
    });

    if (fail)
      throw new Error('case conflict `' + trace(route[0]) + '` vs `' + trace(fail) + '`');
  }

  if (route.length === 1 && node)
    throw new Error('duplicate route `' + trace(node) + '`');

  if (node) {
    node.children = (node.children || []).concat([route.slice(1)]);
  } else {
    merged.push(route[0]);
    if (route.length > 1)
      route[0].children = [route.slice(1)];
  }

  return merged;
}, []).map(node => {
  if (node.children) {
    node.children.forEach(x => x[0].parent = node);
    node.children = merge(node.children, opts);
  }
  return node;
});
let toTree = (routes, opts) => merge(routes.map((route, i) => {
  let xs = parse(route.url, 'route');

  xs.push(parse(route.method || '[.*]', 'method'));

  let headers = route.header || route.headers || [];
  if (!(headers instanceof Array))
    headers = [headers];

  headers.forEach(x => {
    if (typeof x === 'string') {
      xs.push({
        type   : 'header',
        pattern: 'pair',
        key    : parse(x, 'key'),
        value  : { type: 'value', pattern: 'variable', match: /^(.*)$/ }
      });
    } else if (typeof x === 'object') {
      Object.keys(x).forEach(i => xs.push({
        type   : 'header',
        pattern: 'pair',
        key    : parse(i, 'key'),
        value  : parse(x[i], 'value')
      }));
    } else {
      throw new TypeError('header must be either a String, Object or Array');
    }
  });

  xs.push({type: 'handler', handler: route.handler, middleware: route.middleware});

  xs.forEach(x => x.order = i);

  if (opts.trim) {
    let i = xs.findIndex(x => x.type === 'segment' && x.pattern === 'null');
    let b = i > 1 &&
            xs[i-1].type === 'segment' &&
            xs[i-1].pattern === 'absolute' &&
            xs[i-1].org === '';
    if (b)
      xs.splice(i-1, 1);
  }

  return xs;
}), opts);


let stringEquals = function (str, caseInsensitive) {
  if (!caseInsensitive)
    return x => x === str;

  str = str.toLowerCase();
  return x => (x || '').toLowerCase() === str;
};
let regexpMatch = function (regexp, caseInsensitive) {
  if (!caseInsensitive)
    return regexp;
  return new RegExp(regexp.source, 'i');
};
let toPredicate = function (node, caseInsensitive) {
  switch (node.pattern) {
    case 'null'       : return Router.satisfy(x => x === undefined);
    case 'absolute'   : return Router.satisfy(stringEquals(node.match, caseInsensitive));
    case 'conditional': return x => Router.match(regexpMatch(node.match, caseInsensitive))(x).save();
    case 'variable'   : return x => Router.match(regexpMatch(node.match, caseInsensitive))(x).save();
    case 'glob'       : return x => Router.match(regexpMatch(node.match, caseInsensitive))(x).save();
  }
};
let toRouter = function (node, opts) {
  let router;
  let children;

  if (node.children && node.children.length === 1)
    children = node.children.map(x => toRouter(x, opts))[0];
  else if (node.children && node.children.length > 1)
    children = Router.choice(node.children.map(x => toRouter(x, opts)));

  if (node.type === 'handler')
    return Router.of(node);

  let makeRouter = Router[node.type];

  switch (node.pattern) {
    case 'null':
      router = makeRouter(toPredicate(node, opts.case));
      if (opts.trim)
        router = makeRouter(Router.satisfy(x => !x)).then(router);
      break;

    case 'absolute':
      router = makeRouter(toPredicate(node, opts.case));
      break;

    case 'conditional':
      router = makeRouter(toPredicate(node, opts.case));
      break;

    case 'variable':
      router = makeRouter(toPredicate(node, opts.case));
      break;

    case 'glob':
      router = Router.segments(toPredicate(node, opts.case), children);
      return router;

    case 'pair':
      router = makeRouter(toPredicate(node.key, opts.case), toPredicate(node.value, opts.case));
      break;
  }

  if (children)
    router = router.then(children);

  return router;
};


let build = function (routes, opts) {
  let tree = toTree(routes, opts);

  if (opts.debug)
    walk(tree, trace).forEach(x => console.log(x));

  if (typeof opts.tree === 'function') {
    opts.tree(walk(tree, (node, _state = {}) => {
      if (node.type === 'handler' && node.middleware)
        _state.middleware = node.middleware;
      return trace(node, _state, {debug: true});
    }));
  }

  let router = Router.choice(tree.map(x => toRouter(x, opts)));

  walk(tree, x => {
    delete x.parent;
    delete x.order;
  });

  return router;
};


build.trace = trace;
module.exports = build;
