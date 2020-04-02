'use strict'

const tap = require('tap')
const Api = require('../api')
const path = require('path')

tap.test('commandDirectory > supports multi-level', async t => {
  const api = Api.get({ name: 'test' })
    .commandDirectory('fixture2/level1')
    .showHelpByDefault()
    .outputSettings({ maxWidth: 50 })

  const promises = []

  promises.push(api.parse(''))
  promises.push(api.parse('one'))
  promises.push(api.parse('one two'))
  promises.push(api.parse('one two three'))

  const [result1, result2, result3, result4] = await Promise.all(promises)

  t.equal(result1.code, 0)
  t.equal(result1.errors.length, 0)
  t.equal(result1.output, [
    'Usage: test <command> <args>',
    '',
    'Commands:',
    '  one <subcommand>  Level one command',
    '  top             '
  ].join('\n'))

  t.equal(result2.code, 0)
  t.equal(result2.errors.length, 0)
  t.equal(result2.output, [
    'Usage: test one <subcommand>',
    '',
    'Commands:',
    '  two <subcommand>  Level two command'
  ].join('\n'))

  t.equal(result3.code, 0)
  t.equal(result3.errors.length, 0)
  t.equal(result3.output, [
    'Usage: test one two <subcommand>',
    '',
    'Commands:',
    '  three  Level three command'
  ].join('\n'))

  t.equal(result4.code, 0)
  t.equal(result4.errors.length, 0)
  t.equal(result4.output, '')
  t.equal(result4.argv.threeRun, true)
})

tap.test('commandDirectory > supports absolute', async t => {
  const absolutePath = path.join(__dirname, 'fixture2', 'level1')
  const result = await Api.get({ name: 'test' })
    .commandDirectory(absolutePath)
    .showHelpByDefault()
    .outputSettings({ maxWidth: 50 })
    .parse('')
  t.equal(result.code, 0)
  t.equal(result.errors.length, 0)
  t.equal(result.output, [
    'Usage: test <command> <args>',
    '',
    'Commands:',
    '  one <subcommand>  Level one command',
    '  top             '
  ].join('\n'))
})

tap.test('commandDirectory > detects and ignores cyclic reference', async t => {
  const api = Api.get({ name: 'test' })
    .commandDirectory('fixture2/cyclic')
    .help()
    .outputSettings({ maxWidth: 50 })

  let result = await api.parse('--help')
  t.equal(result.code, 0)
  t.equal(result.errors.length, 0)
  t.equal(result.output, [
    'Usage: test <command> [options]',
    '',
    'Commands:',
    '  command  Attempts to (re)apply its own dir',
    '',
    'Options:',
    '  --help  Show help     [commands: help] [boolean]'
  ].join('\n'))

  result = await api.parse('command --help')
  t.equal(result.code, 0)
  t.equal(result.errors.length, 0)
  t.equal(result.output, [
    'Usage: test command [options]',
    '',
    'Options:',
    '  --help  Show help     [commands: help] [boolean]'
  ].join('\n'))
})

tap.test('commandDirectory > throws on missing directory', t => {
  t.throws(() => {
    Api.get().commandDirectory('dne')
  })
  t.end()
})

tap.test('commandDirectory > throws on invalid require', t => {
  t.throws(() => {
    Api.get().commandDirectory('..', { extensions: ['.md'] })
  })
  t.end()
})

tap.test('commandDirectory > does not modify given opts', t => {
  const opts = { key: 'value' }
  Api.get().commandDirectory('./fixture2/level1', opts)
  t.equal(Object.keys(opts).length, 1)
  t.equal(opts.key, 'value')
  t.end()
})
