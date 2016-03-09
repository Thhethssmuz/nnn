'use strict';

class State {
  constructor(path, queries, fragment, method, headers, saved) {
    this.path     = path;
    this.queries  = queries;
    this.fragment = fragment;
    this.method   = method;
    this.headers  = headers;
    this.saved    = saved;
  }
  clone() {
    return new State(
      this.path.slice(),
      this.queries.slice(),
      this.fragment,
      this.method,
      this.headers.slice(),
      this.saved.slice()
    );
  }
}

class Router {

  /**
   * `Router` is a monadic routing combinator using continuation passing style
   * (cps). The inner function `unRouter` is a function that takes 3 arguments;
   * a `State`, a success continuation and a failure continuation.
   */
  constructor(unRouter) {
    this.unRouter = unRouter;
  }

  /**
   * `l.concat(r)` tries to run the router `l`, if that fails it tries to run
   * the router `r`. Yields the result of the first successful router.
   */
  concat(r) {
    return new Router((s, ok, err) => {
      let nerr = () => r.unRouter(s, ok, err);
      return this.unRouter(s, ok, nerr);
    });
  }

  /**
   * `Router.empty()` is a router that always fails.
   */
  static empty() {
    return new Router((s, ok, err) => err());
  }

  /**
   * `router.map(f)` is a router that if succeeds applies the function `f` to
   * the result returned by the router. Yields the result of applying `f` to the
   * result.
   */
  map(f) {
    return new Router((s, ok, err) => {
      let nok = (x, s) => ok(f(x), s);
      return this.unRouter(s, nok, err);
    });
  }

  /**
   * `router.ap(r)` is a router that applies the function returned by the inner
   * `router` to the value returned by the router `r`. Yields the result.
   */
  ap(r) {
    return this.chain(f => r.map(f));
  }

  /**
   * `Router.of(x)` is a router that always succeeds with the given value.
   */
  static of(x) {
    return new Router((s, ok) => {
      return ok(x, s);
    });
  }

  /**
   * `l.chain(f)` applies the result of the router `l` to the function `f` on
   * success. The function `f` must return another `Router`.
   */
  chain(f) {
    return new Router((s, ok, err) => {
      let nok  = (x, s) => f(x).unRouter(s, ok, err);
      return this.unRouter(s, nok, err);
    });
  }

  /**
   * `l.then(r)` first runs the router `l` then runs the router `r`, but throws
   * away the result of the router `l`. Yields the result of the router `r`.
   */
  then(r) {
    return this.chain(() => r);
  }

  /**
   * `Router.choice(...)` tries each given router in order. Yields the value of
   * the first successful router.
   */
  static choice(rs) {
    if (!(rs instanceof Array))
      rs = Array.from(arguments);
    return rs.reduce((x,y) => x.concat(y), Router.empty());
  }

  /**
   * `router.save()` stores the result of the `router` in the state. Yields the
   * stored value.
   */
  save() {
    return new Router((s, ok, err) => {

      let nok = (x, s) => {
        let newstate = s.clone();
        newstate.saved = newstate.saved.concat(x);
        return ok(x, newstate);
      };

      return this.unRouter(s, nok, err);
    });
  }

  /**
   * `Router.satisfy(f)` is a "predicate router", meaning a function that
   * returns a router that succeeds only if the predicate function `f` returns
   * `true`. Yields the value passed to the predicate router.
   */
  static satisfy(f) {
    return x => new Router((s, ok, err) => {
      if (!f(x))
        return err();
      return ok(x, s);
    });
  }

  /**
   * `Router.match(r)` is a "predicate router", meaning a function that returns
   * a router that succeeds only if the given regular expression `r` matches the
   * given value. Yields any captures in the regular expression.
   */
  static match(r) {
    return x => new Router((s, ok, err) => {
      let matches = x.match(r);
      if (matches === null)
        return err();
      return ok(matches.slice(1), s);
    });
  }

  /**
   * `Router.segment(k)` is a router that consumes a single segment if the
   * predicate router `k` succeeds for the given segment. Yields the value
   * returned by `k`.
   */
  static segment(k) {
    return new Router((s, ok, err) => {
      let newstate = s.clone();
      let x = newstate.path.shift();
      return k(x).unRouter(newstate, ok, err);
    });
  }

  /**
   * `Router.segments(k,end)` is a router that consumes zero or more segments
   * until both the predicate router `k` and the next continuation router `end`
   * succeeds. Yields the value returned by `end`.
   *
   * ... a somewhat hacky router used to implement glob patterns.
   */
  static segments(k,end) {
    return new Router((s, ok, err) => {
      if (s.path[0] === undefined)
        return err();

      let newstate = s.clone();
      let consumed = [];

      let next = () => {
        if (newstate.path[0] === undefined)
          return err();
        consumed.push(newstate.path.shift());
        return k(consumed.join('/')).then(end).unRouter(newstate, ok, next);
      };

      return k('').then(end).unRouter(s, ok, next);
    });
  }

  /**
   * `Router.query(k,v)` is a router that consumes a single query if both the
   * predicate routers `k` and `v` succeeds when applied to the query key and
   * value respectively. Yields a pair of the values returned by `k` and `v`.
   */
  static query(k,v) {
    return new Router((s, ok, err) => {
      return s.queries.reduceRight((r, q, i) => {
        return k(q[0]).chain(x => v(q[1]).chain(y => new Router((s, ok) => {
          let newstate = s.clone();
          newstate.queries.splice(i,1);
          return ok([x,y], newstate);
        }))).concat(r);
      }, Router.empty()).unRouter(s, ok, err);
    });
  }

  /**
   * `Router.fragment(k)` is a router that consumes a fragment, if one exists
   * and, if the predicate router `k` succeeds when applied to the fragment.
   * Yields the value returned by `k`.
   */
  static fragment(k) {
    return new Router((s, ok, err) => {
      if (s.fragment === null)
        return err();
      let newstate = s.clone();
      newstate.fragment = null;
      return k(s.fragment).unRouter(newstate, ok, err);
    });
  }

  /**
   * `Router.method(k)` is a router that consumes a method, if one exists and,
   * if the predicate router `k` succeeds when applied to the method. Yields the
   * value returned by `k`.
   */
  static method(k) {
    return new Router((s, ok, err) => {
      if (s.method === null)
        return err();
      let newstate = s.clone();
      newstate.method = null;
      return k(s.method).unRouter(newstate, ok, err);
    });
  }

  /**
   * `Router.header(k,v)` is a router that consumes a single header if both the
   * predicate routers `k` and `v` succeeds when applied to the header key and
   * value respectively. Yields a pair of the values returned by `k` and `v`.
   */
  static header(k,v) {
    return new Router((s, ok, err) => {
      return s.headers.reduceRight((r, q, i) => {
        return k(q[0]).chain(x => v(q[1]).chain(y => new Router((s, ok) => {
          let newstate = s.clone();
          newstate.headers.splice(i,1);
          return ok([x,y], newstate);
        }))).concat(r);
      }, Router.empty()).unRouter(s, ok, err);
    });
  }
}

module.exports = Router;
module.exports.State = State;
