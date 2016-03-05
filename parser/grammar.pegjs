{
  let make_regexp = function (x) {
    switch (x.type) {
      case 'conditional': return '^' + x.match + '$';
      case 'variable'   : return '^' + '([^\\/]*)' + '$';
      case 'glob'       : return '^' + '(.*)' + '$';
    }
  };
  let make_pattern = function (xs, type) {
    let ac = xs.reduce((x,y) => y.type === 'absolute' ? x + y.match.length : x, 0);
    let cc = xs.filter(x => x.type === 'conditional').length;
    let vc = xs.filter(x => x.type === 'variable').length;
    let gc = xs.filter(x => x.type === 'glob').length;

    let pattern = gc && 'glob' || vc && 'variable' || cc && 'conditional' || 'absolute';
    let org     = xs.map(x => x.org || x.match).join('');
    let match   = !cc && !vc && !gc ? org : new RegExp(xs.map(make_regexp).join(''));

    return { type, pattern, org, match };
  };
  let null_segment = { type: 'segment', pattern: 'null', match: undefined };
  let variable_query = { type: 'value', pattern: 'variable', match: /^([^\/]*)$/ };
}

// Base constructs
route         = ps:path qs:query? f:fragment?
              { return ps.concat(null_segment).concat(qs).concat(f).filter(x => x); }

path          = x:segment xs:( "/" x:segment { return x; } )*
              { return [x].concat(xs); }
segment       = xs:( fail_glob / glob / variable / regexp / absolute )*
              { return make_pattern(xs, 'segment'); }

query         = "?" q:pair qs:( "&" q:pair {return q; } )*
              { return [q].concat(qs).map(x => { x.type = 'query'; return x; }); }
pair          = k:key mv:( "=" v:value { return v; } )?
              { return { pattern: 'pair', key: k, value: mv || variable_query }; }
key           = xs:( fail_variable / variable / regexp / absolute )*
              { return make_pattern(xs, 'key'); }
value         = xs:( fail_variable / variable / regexp / absolute )*
              { return make_pattern(xs, 'value'); }

fragment      = "#" xs:( fail_variable / variable / regexp / absolute )*
              { return make_pattern(xs, 'fragment'); }

method        = xs:( fail_variable / variable / regexp / absolute )*
              { return make_pattern(xs, 'method'); }

// Patterns
absolute      = xs:unreserved+
              { return { type: 'absolute', match: xs.join('') }; }

variable      = x:("*")
              { return { type: 'variable', match: '*' }; }

glob          = x:("**")
              { return { type: 'glob', match: '**' }; }

fail_variable = "**"  { throw new SyntaxError('glob patterns are only allowed in segments'); }
fail_glob     = "***" { throw new SyntaxError('"***" is not a valid pattern'); }

regexp        = "(" xs:regexp_chars ")"
              { return { type: 'conditional', org: '(' + xs + ')', match: '(' + xs + ')' }; }
              / "[" xs:regexp_chars "]"
              { return { type: 'conditional', org: '[' + xs + ']', match: xs }; }

regexp_chars  = xs:( [^\[\]\(\)\\] / escaped_char / nested_regexp )*
              { return xs.join(''); }

nested_regexp = xs:( "[" regexp_chars "]" / "(" regexp_chars ")" )
              { return xs.join(''); }

// Char
escaped_char  = xs:( "\\" . ) { return xs.join(''); }
reserved      = "/" / "[" / "]" / "(" / ")" / "*" / "?" / "=" / "&" / "#" / "\\"
unreserved    = "\\" x:. { return x; }
              / !reserved x:. { return x; }
