'use strict';

const braceExpansion = require('brace-expansion');

let expand = function (x) {
  let xs = braceExpansion(x);
  return xs.length === 0 ? [''] : xs;
}

let permute = function (xss) {
  return xss.reduce((xs,ys) => {
    return xs.map(x => ys.map(y => x.concat(y))).reduce((x,y) => x.concat(y));
  }, [[]]);
};

let expandObject = function (obj) {
  return permute(Object.keys(obj).map(p => {
    return expand(p).map(k => {
      return expand(obj[p]).map(v => {
        let r = {};
        r[k] = v;
        return r;
      })
    }).reduce((x,y) => x.concat(y))
  }));
};

let expandHeaders = function (headers) {
  return permute(headers.map(header => {
    if (typeof header === 'string')
      return expand(header);
    return expandObject(header);
  }));
};

let expandRoute = function (route) {
  let headers = route.header || route.headers || [];
  if (!(headers instanceof Array))
    headers = [headers];

  return permute([
    expand(route.url),
    expand(route.method),
    expandHeaders(headers)
  ]).map(r => {
    return {
      url: r[0],
      method: r[1],
      headers: r.slice(2)
    }
  });
};

module.exports = expandRoute;
