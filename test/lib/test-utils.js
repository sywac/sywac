'use strict'

const tap = require('tap')
const Utils = require('../../lib/utils')

const utils = Utils.get()
const flags = '\u001b[32m-k, --key\u001b[39m \u001b[31m<\u001b[39m\u001b[90mvalue\u001b[39m\u001b[31m>\u001b[39m'

tap.test('utils > configurable ansiRegex', t => {
  const regex = /x/g
  t.equal(new Utils({ ansiRegex: regex }).ansiRegex, regex)
  t.end()
})

tap.test('utils > stripAnsi', t => {
  t.equal(utils.stripAnsi(flags), '-k, --key <value>')
  t.end()
})

tap.test('utils > normalizeAlias', t => {
  t.equal(utils.normalizeAlias(flags), 'k')
  t.end()
})

tap.test('utils > normalizeAliases', t => {
  t.same(utils.normalizeAliases(['\u001b[32m-k\u001b[39m', '\u001b[32m--key\u001b[39m']), ['k', 'key'])
  t.end()
})

tap.test('utils > aliasesToFlags', t => {
  t.equal(utils.aliasesToFlags(['\u001b[32mk\u001b[39m', '\u001b[32mkey\u001b[39m']), '-\u001b[32mk\u001b[39m, --\u001b[32mkey\u001b[39m')
  t.end()
})

tap.test('utils > flagsToAliases', t => {
  t.same(utils.flagsToAliases(flags), ['k', 'key'])
  t.same(utils.flagsToAliases('-k --key <value>'), ['k', 'key'])
  t.same(utils.flagsToAliases('k|key <value>'), ['k', 'key'])
  t.end()
})

tap.test('utils > inferPositionalProperties', t => {
  const validTypes = ['string', 'number', 'array', 'file', 'dir', 'path']
  t.same(utils.inferPositionalProperties('[-c|--charlie] <charlie:string=some val>', validTypes), {
    flags: '-c|--charlie',
    aliases: ['c', 'charlie'],
    acceptFlags: true,
    required: true,
    type: 'string',
    variadic: false,
    defaultValue: 'some val'
  })
  t.same(utils.inferPositionalProperties('[number..]', validTypes), {
    flags: '--number',
    aliases: ['number'],
    required: false,
    type: 'array:number',
    variadic: true
  })
  t.same(utils.inferPositionalProperties('array:string', validTypes), {
    flags: '--array',
    aliases: ['array'],
    required: true,
    type: 'array:string',
    variadic: true
  })
  t.same(utils.inferPositionalProperties('<user | org>', validTypes), {
    flags: '--user, --org',
    aliases: ['user', 'org'],
    required: true,
    type: 'string',
    variadic: false
  })
  t.same(utils.inferPositionalProperties('[file|dir:path]', validTypes), {
    flags: '--file, --dir',
    aliases: ['file', 'dir'],
    required: false,
    type: 'path',
    variadic: false
  })
  t.end()
})

tap.test('utils > stringToMultiPositional', t => {
  t.same(utils.stringToMultiPositional('<one> [--weird] [-t] [two]'), ['<one>', '[--weird]', '[-t] [two]'])
  t.end()
})

tap.test('utils > stringToArgs', t => {
  t.same(utils.stringToArgs(`-k -v 'won\\'t keep' one "two three" "x`), ['-k', '-v', 'won\'t keep', 'one', 'two three', 'x'])
  t.end()
})

tap.test('utils > isSpace', t => {
  t.equal(utils.isSpace(' '), true)
  t.equal(utils.isSpace('\t'), true)
  t.equal(utils.isSpace('\n'), true)
  t.equal(utils.isSpace('\r'), true)
  t.equal(utils.isSpace('\v'), true)
  t.equal(utils.isSpace('-'), false)
  t.equal(utils.isSpace('x'), false)
  t.end()
})

tap.test('utils > sameArrays', t => {
  t.equal(utils.sameArrays(['k', 'key'], ['k', 'key']), true)
  t.equal(utils.sameArrays(['v'], ['h']), false)
  t.equal(utils.sameArrays(['one', 'two'], ['one']), false)
  t.end()
})
