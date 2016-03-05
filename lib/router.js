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

  // ap(r) {
  //   return this.chain(f => r.map(f));
  // }

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
   * `router.save()` stores the result of the `router` in the state.
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

  /**/

  static satisfy(f) {
    if (typeof f !== 'function')
      throw new TypeError('Router.satisfy expects a Function');

    return router => new Router((s, ok, err) => {

      let nok = (x, s) => {
        if (!f(x))
          return err();
        return ok(x, s);
      };

      return router.unRouter(s, nok, err);
    });
  }
  // static satisfy_(f) {
  //   if (typeof f !== 'function')
  //     throw new TypeError('Router.satisfy expects a Function');

  //   return x => new Router((s, ok, err) => {
  //     if (!f(x))
  //       return err();
  //     return ok(x, s);
  //   });
  // }

  static match(regexp) {
    if (!(regexp instanceof RegExp))
      throw new TypeError('Router.match expects a RegExp');

    return router => new Router((s, ok, err) => {

      let nok = (x, s) => {
        let matches = x.match(regexp);
        if (matches === null)
          return err();
        return ok(matches.slice(1), s);
      };

      return router.unRouter(s, nok, err);
    }).save();
  }
  // static match_(regexp) {
  //   if (!(regexp instanceof RegExp))
  //     throw new TypeError('Router.match expects a RegExp');

  //   return x => new Router((s, ok, err) => {
  //     let matches = x.match(regexp);
  //     if (matches === null)
  //       return err();
  //     return ok(matches.slice(1), s);
  //   }).save();
  // }

  static segment(k) {
    return new Router((s, ok, err) => {
      let segment = s.path[0];
      return k(Router.of(segment)).then(new Router((s, ok, err) => {
        let newstate = s.clone();
        newstate.path = newstate.path.slice(1);
        return ok(segment, newstate);
      })).unRouter(s, ok, err);
    });
  }
  // static segment_(k) {
  //   return new Router((s, ok, err) => {
  //     let segment = s.path[0];
  //     return k(segment).then(new Router((s, ok, err) => {
  //       let newstate = s.clone();
  //       newstate.path = newstate.path.slice(1);
  //       return ok(segment, newstate);
  //     })).unRouter(s, ok, err);
  //   });
  // }

  static segments(k, next) {
    return new Router((s, ok, err) => {

      if (s.path[0] === undefined)
        return err();

      return s.path
        .reduce((xs, x, i) => xs.concat([s.path.slice(0, i + 1)]), [[]])
        .map(xs => xs.join('/'))
        .reduceRight((r, x, i) => {
          return k(Router.of(x)).then(new Router((s, ok, err) => {
            let newstate = s.clone();
            newstate.path = newstate.path.slice(i);
            return ok(null, newstate);
          })).then(next).concat(r);
        }, Router.empty())
        .unRouter(s, ok, err);
    });
  }
  // static segments_(k, next) {
  //   return new Router((s, ok, err) => {

  //     if (s.path[0] === undefined)
  //       return err();

  //     return s.path
  //       .reduce((xs, x, i) => xs.concat([s.path.slice(0, i + 1)]), [[]])
  //       .map(xs => xs.join('/'))
  //       .reduceRight((r, x, i) => {
  //         return k(x).then(new Router((s, ok, err) => {
  //           let newstate = s.clone();
  //           newstate.path = newstate.path.slice(i);
  //           return ok(null, newstate);
  //         })).then(next).concat(r);
  //       }, Router.empty())
  //       .unRouter(s, ok, err);
  //   });
  // }

  static query(k,v) {
    return new Router((s, ok, err) => {
      return s.queries.reduceRight((r, x, i) => {
        return k(Router.of(x[0])).then(v(Router.of(x[1]))).then(new Router((s, ok, err) => {

          let newstate = s.clone();
          newstate.queries.splice(i, 1);

          return ok(x, newstate);

        })).concat(r);
      }, Router.empty()).unRouter(s, ok, err);
    });
  }
  // static query_(k,v) {
  //   return new Router((s, ok, err) => {
  //     return s.queries.reduceRight((r, x, i) => {
  //       return k(x[0]).then(v(x[1])).then(new Router((s, ok, err) => {

  //         let newstate = s.clone();
  //         newstate.queries.splice(i, 1);

  //         return ok(x, newstate);

  //       })).concat(r);
  //     }, Router.empty()).unRouter(s, ok, err);
  //   });
  // }

  static fragment(k) {
    return new Router((s, ok, err) => {
      let fragment = s.fragment;

      if (fragment === null)
        return err();

      return k(Router.of(fragment)).then(new Router((s, ok, err) => {
        let newstate = s.clone();
        newstate.fragment = null;
        return ok(fragment, newstate);
      })).unRouter(s, ok, err);
    });
  }
  // static fragment_(k) {
  //   return new Router((s, ok, err) => {
  //     let fragment = s.fragment;

  //     if (fragment === null)
  //       return err();

  //     return k(fragment).then(new Router((s, ok, err) => {
  //       let newstate = s.clone();
  //       newstate.fragment = null;
  //       return ok(fragment, newstate);
  //     })).unRouter(s, ok, err);
  //   });
  // }

  static method(k) {
    return new Router((s, ok, err) => {
      let method = s.method;

      if (method === null)
        return err();

      return k(Router.of(method)).then(new Router((s, ok, err) => {
        let newstate = s.clone();
        newstate.method = null;
        return ok(method, newstate);
      })).unRouter(s, ok, err);
    });
  }
  // static method_(k) {
  //   return new Router((s, ok, err) => {
  //     let method = s.method;

  //     if (method === null)
  //       return err();

  //     return k(method).then(new Router((s, ok, err) => {
  //       let newstate = s.clone();
  //       newstate.method = null;
  //       return ok(method, newstate);
  //     })).unRouter(s, ok, err);
  //   });
  // }

  static header(k,v) {
    return new Router((s, ok, err) => {
      return s.headers.reduceRight((r, x, i) => {
        return k(Router.of(x[0])).then(v(Router.of(x[1]))).then(new Router((s, ok, err) => {

          let newstate = s.clone();
          newstate.headers.splice(i, 1);

          return ok(x, newstate);

        })).concat(r);
      }, Router.empty()).unRouter(s, ok, err);
    });
  }
  // static header_(k,v) {
  //   return new Router((s, ok, err) => {
  //     return s.headers.reduceRight((r, x, i) => {
  //       return k(x[0]).then(v(x[1])).then(new Router((s, ok, err) => {

  //         let newstate = s.clone();
  //         newstate.headers.splice(i, 1);

  //         return ok(x, newstate);

  //       })).concat(r);
  //     }, Router.empty()).unRouter(s, ok, err);
  //   });
  // }
}

module.exports = Router;
module.exports.State = State;
