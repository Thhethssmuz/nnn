module.exports = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.9.0.
   *
   * http://pegjs.org/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleFunctions = { route: peg$parseroute, pair: peg$parsepair, key: peg$parsekey, value: peg$parsevalue, method: peg$parsemethod },
        peg$startRuleFunction  = peg$parseroute,

        peg$c0 = function(ps, qs, f) { return ps.concat(null_segment).concat(qs).concat(f).filter(x => x); },
        peg$c1 = "/",
        peg$c2 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c3 = function(x) { return x; },
        peg$c4 = function(x, xs) { return [x].concat(xs); },
        peg$c5 = function(xs) { return make_pattern(xs, 'segment'); },
        peg$c6 = "?",
        peg$c7 = { type: "literal", value: "?", description: "\"?\"" },
        peg$c8 = "&",
        peg$c9 = { type: "literal", value: "&", description: "\"&\"" },
        peg$c10 = function(q) {return q; },
        peg$c11 = function(q, qs) { return [q].concat(qs).map(x => { x.type = 'query'; return x; }); },
        peg$c12 = "=",
        peg$c13 = { type: "literal", value: "=", description: "\"=\"" },
        peg$c14 = function(k, v) { return v; },
        peg$c15 = function(k, mv) { return { pattern: 'pair', key: k, value: mv || variable_query }; },
        peg$c16 = function(xs) { return make_pattern(xs, 'key'); },
        peg$c17 = function(xs) { return make_pattern(xs, 'value'); },
        peg$c18 = "#",
        peg$c19 = { type: "literal", value: "#", description: "\"#\"" },
        peg$c20 = function(xs) { return make_pattern(xs, 'fragment'); },
        peg$c21 = function(xs) { return make_pattern(xs, 'method'); },
        peg$c22 = function(xs) { return { type: 'absolute', match: xs.join('') }; },
        peg$c23 = "*",
        peg$c24 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c25 = function(x) { return { type: 'variable', match: '*' }; },
        peg$c26 = "**",
        peg$c27 = { type: "literal", value: "**", description: "\"**\"" },
        peg$c28 = function(x) { return { type: 'glob', match: '**' }; },
        peg$c29 = function() { throw new SyntaxError('glob patterns are only allowed in segments'); },
        peg$c30 = "***",
        peg$c31 = { type: "literal", value: "***", description: "\"***\"" },
        peg$c32 = function() { throw new SyntaxError('"***" is not a valid pattern'); },
        peg$c33 = "(",
        peg$c34 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c35 = ")",
        peg$c36 = { type: "literal", value: ")", description: "\")\"" },
        peg$c37 = function(xs) { return { type: 'conditional', org: '(' + xs + ')', match: '(' + xs + ')' }; },
        peg$c38 = "[",
        peg$c39 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c40 = "]",
        peg$c41 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c42 = function(xs) { return { type: 'conditional', org: '[' + xs + ']', match: xs }; },
        peg$c43 = /^[^[\]()\\]/,
        peg$c44 = { type: "class", value: "[^\\[\\]\\(\\)\\\\]", description: "[^\\[\\]\\(\\)\\\\]" },
        peg$c45 = function(xs) { return xs.join(''); },
        peg$c46 = "\\",
        peg$c47 = { type: "literal", value: "\\", description: "\"\\\\\"" },
        peg$c48 = { type: "any", description: "any character" },

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parseroute() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsepath();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsequery();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefragment();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c0(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsepath() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsesegment();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 47) {
          s4 = peg$c1;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c2); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsesegment();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s3;
            s4 = peg$c3(s5);
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 47) {
            s4 = peg$c1;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c2); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsesegment();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s3;
              s4 = peg$c3(s5);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesegment() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsefail_glob();
      if (s2 === peg$FAILED) {
        s2 = peg$parseglob();
        if (s2 === peg$FAILED) {
          s2 = peg$parsevariable();
          if (s2 === peg$FAILED) {
            s2 = peg$parseregexp();
            if (s2 === peg$FAILED) {
              s2 = peg$parseabsolute();
            }
          }
        }
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsefail_glob();
        if (s2 === peg$FAILED) {
          s2 = peg$parseglob();
          if (s2 === peg$FAILED) {
            s2 = peg$parsevariable();
            if (s2 === peg$FAILED) {
              s2 = peg$parseregexp();
              if (s2 === peg$FAILED) {
                s2 = peg$parseabsolute();
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c5(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsequery() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 63) {
        s1 = peg$c6;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c7); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsepair();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 38) {
            s5 = peg$c8;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c9); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsepair();
            if (s6 !== peg$FAILED) {
              peg$savedPos = s4;
              s5 = peg$c10(s6);
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 38) {
              s5 = peg$c8;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c9); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsepair();
              if (s6 !== peg$FAILED) {
                peg$savedPos = s4;
                s5 = peg$c10(s6);
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c11(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsepair() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsekey();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c12;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c13); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parsevalue();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$c14(s1, s4);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c15(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsekey() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsefail_variable();
      if (s2 === peg$FAILED) {
        s2 = peg$parsevariable();
        if (s2 === peg$FAILED) {
          s2 = peg$parseregexp();
          if (s2 === peg$FAILED) {
            s2 = peg$parseabsolute();
          }
        }
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsefail_variable();
        if (s2 === peg$FAILED) {
          s2 = peg$parsevariable();
          if (s2 === peg$FAILED) {
            s2 = peg$parseregexp();
            if (s2 === peg$FAILED) {
              s2 = peg$parseabsolute();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c16(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsevalue() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsefail_variable();
      if (s2 === peg$FAILED) {
        s2 = peg$parsevariable();
        if (s2 === peg$FAILED) {
          s2 = peg$parseregexp();
          if (s2 === peg$FAILED) {
            s2 = peg$parseabsolute();
          }
        }
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsefail_variable();
        if (s2 === peg$FAILED) {
          s2 = peg$parsevariable();
          if (s2 === peg$FAILED) {
            s2 = peg$parseregexp();
            if (s2 === peg$FAILED) {
              s2 = peg$parseabsolute();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c17(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsefragment() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 35) {
        s1 = peg$c18;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c19); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsefail_variable();
        if (s3 === peg$FAILED) {
          s3 = peg$parsevariable();
          if (s3 === peg$FAILED) {
            s3 = peg$parseregexp();
            if (s3 === peg$FAILED) {
              s3 = peg$parseabsolute();
            }
          }
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsefail_variable();
          if (s3 === peg$FAILED) {
            s3 = peg$parsevariable();
            if (s3 === peg$FAILED) {
              s3 = peg$parseregexp();
              if (s3 === peg$FAILED) {
                s3 = peg$parseabsolute();
              }
            }
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c20(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsemethod() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsefail_variable();
      if (s2 === peg$FAILED) {
        s2 = peg$parsevariable();
        if (s2 === peg$FAILED) {
          s2 = peg$parseregexp();
          if (s2 === peg$FAILED) {
            s2 = peg$parseabsolute();
          }
        }
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsefail_variable();
        if (s2 === peg$FAILED) {
          s2 = peg$parsevariable();
          if (s2 === peg$FAILED) {
            s2 = peg$parseregexp();
            if (s2 === peg$FAILED) {
              s2 = peg$parseabsolute();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c21(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseabsolute() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseunreserved();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseunreserved();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c22(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsevariable() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 42) {
        s1 = peg$c23;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c24); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c25(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseglob() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c26) {
        s1 = peg$c26;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c27); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c28(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsefail_variable() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c26) {
        s1 = peg$c26;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c27); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c29();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsefail_glob() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c30) {
        s1 = peg$c30;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c31); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c32();
      }
      s0 = s1;

      return s0;
    }

    function peg$parseregexp() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c33;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c34); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseregexp_chars();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 41) {
            s3 = peg$c35;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c36); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c37(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
          s1 = peg$c38;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c39); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseregexp_chars();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s3 = peg$c40;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c41); }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c42(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseregexp_chars() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c43.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c44); }
      }
      if (s2 === peg$FAILED) {
        s2 = peg$parseescaped_char();
        if (s2 === peg$FAILED) {
          s2 = peg$parsenested_regexp();
        }
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$c43.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s2 === peg$FAILED) {
          s2 = peg$parseescaped_char();
          if (s2 === peg$FAILED) {
            s2 = peg$parsenested_regexp();
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c45(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsenested_regexp() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s2 = peg$c38;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c39); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseregexp_chars();
        if (s3 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 93) {
            s4 = peg$c40;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s2 = peg$c33;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c34); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseregexp_chars();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s4 = peg$c35;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c36); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c45(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseescaped_char() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s2 = peg$c46;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }
      if (s2 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c48); }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c45(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsereserved() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 47) {
        s0 = peg$c1;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c2); }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 91) {
          s0 = peg$c38;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c39); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 93) {
            s0 = peg$c40;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 40) {
              s0 = peg$c33;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c34); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s0 = peg$c35;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c36); }
              }
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 42) {
                  s0 = peg$c23;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c24); }
                }
                if (s0 === peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 63) {
                    s0 = peg$c6;
                    peg$currPos++;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c7); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 61) {
                      s0 = peg$c12;
                      peg$currPos++;
                    } else {
                      s0 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c13); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 38) {
                        s0 = peg$c8;
                        peg$currPos++;
                      } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c9); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 35) {
                          s0 = peg$c18;
                          peg$currPos++;
                        } else {
                          s0 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c19); }
                        }
                        if (s0 === peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 92) {
                            s0 = peg$c46;
                            peg$currPos++;
                          } else {
                            s0 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c47); }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseunreserved() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c46;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }
      if (s1 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c48); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c3(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parsereserved();
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = void 0;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c48); }
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c3(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }


      let esc = function (str) {
        return str.replace(/./g, x => {
          console.log('x:', x);
          if (/^[0-9a-z-]$/i.test(x))
            return x;
          let c = x.codePointAt(0);
          if (c <= 0xff)
            return '\\x' + c.toString(16).padStart(2, '0');
          return '\\u' + c.toString(16).padStart(4, '0');
        });
      };
      let make_regexp = function (x) {
        switch (x.type) {
          case 'absolute'   : return esc(x.match);
          case 'conditional': return x.match;
          case 'variable'   : return '([^/]*)';
          case 'glob'       : return '(.*)';
        }
      };
      let make_pattern = function (xs, type) {
        let ac = xs.reduce((x,y) => y.type === 'absolute' ? x + y.match.length : x, 0);
        let cc = xs.filter(x => x.type === 'conditional').length;
        let vc = xs.filter(x => x.type === 'variable').length;
        let gc = xs.filter(x => x.type === 'glob').length;

        let pattern = gc && 'glob' || vc && 'variable' || cc && 'conditional' || 'absolute';
        let org     = xs.map(x => x.org || x.match).join('');
        let match   = !cc && !vc && !gc ? org : new RegExp('^' + xs.map(make_regexp).join('') + '$');

        return { type, pattern, org, match };
      };
      let null_segment = { type: 'segment', pattern: 'null', match: undefined };
      let variable_query = { type: 'value', pattern: 'variable', match: /^([^/]*)$/ };


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();
