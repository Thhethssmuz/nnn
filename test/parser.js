'use strict';

const test = require('awfltst');
const parser = require('../parser');

test('paths', async function (t) {

  t.plan(8);

  t.eq(parser.parse(''), [{
    type   : 'segment',
    pattern: 'absolute',
    match  : '',
    org    : ''
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'empty path');

  t.eq(parser.parse('test'), [{
    type   : 'segment',
    pattern: 'absolute',
    match  : 'test',
    org    : 'test'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'absolute segment');

  t.eq(parser.parse('[\\d+]'), [{
    type   : 'segment',
    pattern: 'conditional',
    match  : /^\d+$/,
    org    : '[\\d+]'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'non-capturing conditional segment');

  t.eq(parser.parse('(\\d+)'), [{
    type   : 'segment',
    pattern: 'conditional',
    match  : /^(\d+)$/,
    org    : '(\\d+)'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'capturing conditional segment');

  t.eq(parser.parse('*'), [{
    type   : 'segment',
    pattern: 'variable',
    match  : /^([^/]*)$/,
    org    : '*'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'variable segment');

  t.eq(parser.parse('**'), [{
    type   : 'segment',
    pattern: 'glob',
    match  : /^(.*)$/,
    org    : '**'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'glob segment');

  await t.throws(async function () {
    return parser.parse('***');
  }, SyntaxError, 'illegal *** pattern');

  t.eq(parser.parse('/a/(b)/[c]/*/**'), [{
    type   : 'segment',
    pattern: 'absolute',
    match  : '',
    org    : ''
  }, {
    type   : 'segment',
    pattern: 'absolute',
    match  : 'a',
    org    : 'a'
  }, {
    type   : 'segment',
    pattern: 'conditional',
    match  : /^(b)$/,
    org    : '(b)'
  }, {
    type   : 'segment',
    pattern: 'conditional',
    match  : /^c$/,
    org    : '[c]'
  }, {
    type   : 'segment',
    pattern: 'variable',
    match  : /^([^/]*)$/,
    org    : '*'
  }, {
    type   : 'segment',
    pattern: 'glob',
    match  : /^(.*)$/,
    org    : '**'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'multiple');
});

test('queries', async function (t) {

  t.plan(12);

  const xs = [
    {type: 'segment', pattern: 'absolute', match: '', org: ''},
    {type: 'segment', pattern: 'null', match: undefined}
  ];

  t.eq(parser.parse('?test=1'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'test',
      org    : 'test'
    },
    value: {
      type   : 'value',
      pattern: 'absolute',
      match  : '1',
      org    : '1'
    }
  }), 'absolute query');

  t.eq(parser.parse('?test=[\\d+]'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'test',
      org    : 'test'
    },
    value: {
      type   : 'value',
      pattern: 'conditional',
      match  : /^\d+$/,
      org    : '[\\d+]'
    }
  }), 'non-capturing conditional query');

  t.eq(parser.parse('?test=(\\d+)'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'test',
      org    : 'test'
    },
    value: {
      type   : 'value',
      pattern: 'conditional',
      match  : /^(\d+)$/,
      org    : '(\\d+)'
    }
  }), 'capturing conditional query');

  t.eq(parser.parse('?test=*'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'test',
      org    : 'test'
    },
    value: {
      type   : 'value',
      pattern: 'variable',
      match  : /^([^/]*)$/,
      org    : '*'
    }
  }), 'variable query');

  t.eq(parser.parse('?test'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'test',
      org    : 'test'
    },
    value: {
      type   : 'value',
      pattern: 'variable',
      match  : /^([^/]*)$/
    }
  }), 'variable query shorthand');

  await t.throws(async function () {
    return parser.parse('?test=**');
  }, SyntaxError, 'glob pattern illegal in queries');


  t.eq(parser.parse('?'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : '',
      org    : ''
    },
    value: {
      type   : 'value',
      pattern: 'variable',
      match  : /^([^/]*)$/
    }
  }), 'empty query argument');

  t.eq(parser.parse('?[\\d+]'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'conditional',
      match  : /^\d+$/,
      org    : '[\\d+]'
    },
    value: {
      type   : 'value',
      pattern: 'variable',
      match  : /^([^/]*)$/
    }
  }), 'non-capturing query argument');

  t.eq(parser.parse('?(\\d+)'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'conditional',
      match  : /^(\d+)$/,
      org    : '(\\d+)'
    },
    value: {
      type   : 'value',
      pattern: 'variable',
      match  : /^([^/]*)$/
    }
  }), 'capturing query argument');

  t.eq(parser.parse('?*'), xs.concat({
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'variable',
      match  : /^([^/]*)$/,
      org    : '*'
    },
    value: {
      type   : 'value',
      pattern: 'variable',
      match  : /^([^/]*)$/
    }
  }), 'variable query argument');

  await t.throws(async function () {
    return parser.parse('?**');
  }, SyntaxError, 'glob pattern illegal in query arguments');

  t.eq(parser.parse('?a=1&b=[2]&c=(3)&d=*&e'), xs.concat([{
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'a',
      org    : 'a'
    },
    value: {
      type   : 'value',
      pattern: 'absolute',
      match  : '1',
      org    : '1'
    }
  }, {
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'b',
      org    : 'b'
    },
    value: {
      type   : 'value',
      pattern: 'conditional',
      match  : /^2$/,
      org    : '[2]'
    }
  }, {
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'c',
      org    : 'c'
    },
    value: {
      type   : 'value',
      pattern: 'conditional',
      match  : /^(3)$/,
      org    : '(3)'
    }
  }, {
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'd',
      org    : 'd'
    },
    value: {
      type   : 'value',
      pattern: 'variable',
      match  : /^([^/]*)$/,
      org    : '*'
    }
  }, {
    type   : 'query',
    pattern: 'pair',
    key    : {
      type   : 'key',
      pattern: 'absolute',
      match  : 'e',
      org    : 'e'
    },
    value: {
      type   : 'value',
      pattern: 'variable',
      match  : /^([^/]*)$/
    }
  }]), 'multiple queries');
});

test('fragments', async function (t) {

  t.plan(6);

  const xs = [
    {type: 'segment', pattern: 'absolute', match: '', org: ''},
    {type: 'segment', pattern: 'null', match: undefined}
  ];

  t.eq(parser.parse('#'), xs.concat({
    type   : 'fragment',
    pattern: 'absolute',
    match  : '',
    org    : ''
  }), 'empty fragment');

  t.eq(parser.parse('#test'), xs.concat({
    type   : 'fragment',
    pattern: 'absolute',
    match  : 'test',
    org    : 'test'
  }), 'absolute fragment');

  t.eq(parser.parse('#[\\d+]'), xs.concat({
    type   : 'fragment',
    pattern: 'conditional',
    match  : /^\d+$/,
    org    : '[\\d+]'
  }), 'non-capturing conditional fragment');

  t.eq(parser.parse('#(\\d+)'), xs.concat({
    type   : 'fragment',
    pattern: 'conditional',
    match  : /^(\d+)$/,
    org    : '(\\d+)'
  }), 'capturing conditional fragment');

  t.eq(parser.parse('#*'), xs.concat({
    type   : 'fragment',
    pattern: 'variable',
    match  : /^([^/]*)$/,
    org    : '*'
  }), 'variable fragment');

  await t.throws(async function () {
    return parser.parse('#**');
  }, SyntaxError, 'glob pattern illegal in fragment');
});

test('method', async function (t) {

  t.plan(6);

  t.eq(parser.parse('', {startRule: 'method'}), {
    type   : 'method',
    pattern: 'absolute',
    match  : '',
    org    : ''
  }, 'empty method');

  t.eq(parser.parse('GET', {startRule: 'method'}), {
    type   : 'method',
    pattern: 'absolute',
    match  : 'GET',
    org    : 'GET'
  }, 'absolute method');

  t.eq(parser.parse('[\\w+]', {startRule: 'method'}), {
    type   : 'method',
    pattern: 'conditional',
    match  : /^\w+$/,
    org    : '[\\w+]'
  }, 'non-capturing conditional method');

  t.eq(parser.parse('(\\w+)', {startRule: 'method'}), {
    type   : 'method',
    pattern: 'conditional',
    match  : /^(\w+)$/,
    org    : '(\\w+)'
  }, 'capturing conditional method');

  t.eq(parser.parse('*', {startRule: 'method'}), {
    type   : 'method',
    pattern: 'variable',
    match  : /^([^/]*)$/,
    org    : '*'
  }, 'variable method');

  await t.throws(async function () {
    return parser.parse('**', {startRule: 'method'});
  }, SyntaxError, 'glob pattern illegal in method');
});

test('mixed patterns', async function (t) {

  t.plan(3);

  t.eq(parser.parse('a[b](c)*d**'), [{
    type   : 'segment',
    pattern: 'glob',
    match  : /^ab(c)([^/]*)d(.*)$/,
    org    : 'a[b](c)*d**'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'mixed patterns');

  t.eq(parser.parse('**.js'), [{
    type   : 'segment',
    pattern: 'glob',
    match  : /^(.*)\x2ejs$/,
    org    : '**.js'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'mixed patterns');

  t.eq(parser.parse('**.*'), [{
    type   : 'segment',
    pattern: 'glob',
    match  : /^(.*)\x2e([^/]*)$/,
    org    : '**.*'
  }, {
    type   : 'segment',
    pattern: 'null',
    match  : undefined
  }], 'mixed patterns');
});

test('reserved', async function (t) {

  const legal = (pattern, msg) => {
    try {
      parser.parse(pattern);
      t.ok(true, msg + ' is legal');
    } catch (err) {
      t.fail(msg + ' is legal');
    }
  };
  const illegal = (pattern, column, found, msg) => {
    try {
      parser.parse(pattern);
      t.fail(msg + ' is illegal');
    } catch (err) {
      t.eq(
        {column: err.location.start.column, found: err.found},
        {column, found},
        msg + ' is illegal'
      );
    }
  };

  t.plan(29);

  illegal('(test', 6, null, 'unmatched opening parenthesis');
  illegal('test)', 5, ')', 'unmatched closing parenthesis');
  legal('\\(test', 'escaped opening parenthesis');
  legal('test\\)', 'escaped closing parenthesis');

  illegal('[test', 6, null, 'unmatched opening bracket');
  illegal('test]', 5, ']', 'unmatched closing bracket');
  legal('\\[test', 'escaped opening bracket');
  legal('test\\]', 'escaped closing bracket');

  legal('{test', 'opening brace');
  legal('test}', 'closing brace');

  illegal('/a=b', 3, '=', 'equals sign in segment');
  illegal('/a&b', 3, '&', 'ampersand in segment');
  illegal('?a/b', 3, '/', 'slash in queries');
  illegal('#a/b', 3, '/', 'slash in fragment');
  illegal('#a?b', 3, '?', 'question mark in fragment');
  illegal('#a=b', 3, '=', 'equals sign in fragment');
  illegal('#a&b', 3, '&', 'ampersand in fragment');

  legal('(a(b))', 'nested captures');
  legal('[a(b)]', 'nested captures in non-capturing environment');
  legal('[[a-z]+]', 'character sequence in non-capturing regular expression');

  illegal('(()', 4, null,
          'unescaped opening parenthesis in regular expression');
  illegal('())', 3, ')',
          'unescaped closing parenthesis in regular expression');
  illegal('[(]', 3, ']',
          'unescaped opening parenthesis in non-capturing regular expression');
  illegal('[)]', 2, ')',
          'unescaped closing parenthesis in non-capturing regular expression');

  illegal('(])', 2, ']', 'unescaped opening bracket in regular expression');
  illegal('([)', 3, ')', 'unescaped closing bracket in regular expression');
  illegal('[]]', 3, ']',
          'unescaped opening bracket in non-capturing regular expression');
  illegal('[[]', 4, null,
          'unescaped closing bracket in non-capturing regular expression');

  legal('a[b](c)*d**', 'mixing patterns');
});

test('start rules', async function (t) {

  t.plan(7);

  await t.notThrows(async function () { parser.parse(''); }, 'default');

  for (const startRule of ['route', 'pair', 'key', 'value', 'method']) {
    await t.notThrows(async function () {
      parser.parse('', {startRule});
    }, startRule);
  }

  await t.throws(async function () {
    parser.parse('', {startRule: 'lol'});
  }, 'invalid start rule');
});

test('inputs', async function (t) {

  t.plan(6);

  await t.notThrows(async function () {
    parser.parse('string');
  }, '"string" is a valid input');

  for (const x of [undefined, null, 1, [], {}]) {
    await t.throws(async function () {
      parser.parse(x);
    }, JSON.stringify(x) + ' is not a valid input');
  }
});
