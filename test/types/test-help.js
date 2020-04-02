'use strict'

const tap = require('tap')
const Api = require('../../api')
const TypeHelp = require('../../types/help')

const parent = require('path').basename(__filename, '.js')
const helper = require('../helper').get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

tap.test('help > defaults', async t => {
  const api = Api.get().help()
  const typeObjects = api.initContext(true).types
  t.same(typeObjects[parent][0].aliases, ['help'])
  t.equal(typeObjects[parent][0].datatype, 'boolean')
  t.equal(typeObjects[parent][0].helpFlags, '--help')
  t.equal(typeObjects[parent][0].helpDesc, 'Show help')
  t.equal(typeObjects[parent][0].helpHints, '[commands: help] [boolean]')
  t.equal(typeObjects[parent][0].helpGroup, 'Options:')
  t.equal(typeObjects[parent][0].isHidden, false)
  const result = await api.parse('--help')
  t.equal(result.code, 0)
  t.equal(result.output, [
    `Usage: ${parent} [options]`,
    '',
    'Options:',
    '  --help  Show help                                                       [commands: help] [boolean]'
  ].join('\n'))
  t.equal(result.errors.length, 0)
  t.equal(result.argv.help, true)
  assertTypeDetails(t, result, 1, ['help'], 'boolean', true, 'flag', [0], ['--help'])
})

tap.test('help > custom flags, desc, group, hints', t => {
  let typeObjects = Api.get().help('-H, --get-help', {
    desc: 'Display the help text and exit',
    group: 'Global Options:',
    hints: ''
  }).initContext(true).types
  t.same(typeObjects[parent][0].aliases, ['H', 'get-help'])
  t.equal(typeObjects[parent][0].datatype, 'boolean')
  t.equal(typeObjects[parent][0].helpFlags, '-H, --get-help')
  t.equal(typeObjects[parent][0].helpDesc, 'Display the help text and exit')
  t.equal(typeObjects[parent][0].helpHints, '')
  t.equal(typeObjects[parent][0].helpGroup, 'Global Options:')
  t.equal(typeObjects[parent][0].isHidden, false)

  typeObjects = Api.get().custom(
    TypeHelp.get()
      .description('Hi there')
      .alias('H')
      .hints('[try it]')
      .group('Opts:')
      .hidden(true)
  ).initContext(true).types
  t.same(typeObjects[parent][0].aliases, ['H'])
  t.equal(typeObjects[parent][0].datatype, 'boolean')
  t.equal(typeObjects[parent][0].helpFlags, '-H')
  t.equal(typeObjects[parent][0].helpDesc, 'Hi there')
  t.equal(typeObjects[parent][0].helpHints, '[try it]')
  t.equal(typeObjects[parent][0].helpGroup, 'Opts:')
  t.equal(typeObjects[parent][0].isHidden, true)
  t.end()
})

tap.test('help > default implicit command', async t => {
  const api = Api.get().help()

  let result = await api.parse('help')
  t.equal(result.code, 0)
  t.equal(result.output, [
    `Usage: ${parent} [options]`,
    '',
    'Options:',
    '  --help  Show help                                                       [commands: help] [boolean]'
  ].join('\n'))
  t.equal(result.errors.length, 0)
  t.equal(result.argv.help, true)
  assertTypeDetails(t, result, 1, ['help'], 'boolean', true, 'positional', [0], ['help'])

  result = await api.parse('not help')
  assertNoErrors(t, result)
  t.equal(result.argv.help, false)
  t.same(result.argv._, ['not', 'help'])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', ['not', 'help'], 'positional', [0, 1], ['not', 'help'])
  assertTypeDetails(t, result, 1, ['help'], 'boolean', false, 'default', [], [])
})

tap.test('help > custom implicit command via flags', async t => {
  const api = Api.get().help('-H | --get-help')

  let result = await api.parse('get-help')
  t.equal(result.code, 0)
  t.equal(result.output, [
    `Usage: ${parent} [options]`,
    '',
    'Options:',
    '  -H | --get-help  Show help                                          [commands: get-help] [boolean]'
  ].join('\n'))
  t.equal(result.errors.length, 0)
  t.equal(result.argv.H, true)
  t.equal(result.argv['get-help'], true)
  assertTypeDetails(t, result, 1, ['H', 'get-help'], 'boolean', true, 'positional', [0], ['get-help'])

  result = await api.parse('H')
  assertNoErrors(t, result)
  t.equal(result.argv.H, false)
  t.equal(result.argv['get-help'], false)
  t.same(result.argv._, ['H'])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', ['H'], 'positional', [0], ['H'])
  assertTypeDetails(t, result, 1, ['H', 'get-help'], 'boolean', false, 'default', [], [])
})

tap.test('help > disable implicit command', async t => {
  const result = await Api.get().help({ implicitCommand: false }).parse('help')
  assertNoErrors(t, result)
  t.equal(result.argv.help, false)
  t.same(result.argv._, ['help'])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', ['help'], 'positional', [0], ['help'])
  assertTypeDetails(t, result, 1, ['help'], 'boolean', false, 'default', [], [])
})
