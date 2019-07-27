'use strict'

const tap = require('tap')
const importFresh = require('import-fresh')

const TypeString = require('../types/string')
const Utils = require('../lib/utils')
const Helper = require('./helper')

tap.test('index > default singleton api', t => {
  const h = Helper.get('test-index')
  const sywac = importFresh('../index').string('-b, --branch <name>').boolean('-f, --force')
  return sywac.parse([]).then(result => {
    h.assertNoErrors(t, result)
    t.equal(result.argv.b, undefined)
    t.equal(result.argv.branch, undefined)
    t.equal(result.argv.f, false)
    t.equal(result.argv.force, false)
    t.same(result.argv._, [])
    t.equal(Object.keys(result.argv).length, 5)
    h.assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
    h.assertTypeDetails(t, result, 1, ['b', 'branch'], 'string', undefined, 'default', [], [])
    h.assertTypeDetails(t, result, 2, ['f', 'force'], 'boolean', false, 'default', [], [])
    return sywac.parse(['-fb', 'master'])
  }).then(result => {
    h.assertNoErrors(t, result)
    t.equal(result.argv.b, 'master')
    t.equal(result.argv.branch, 'master')
    t.equal(result.argv.f, true)
    t.equal(result.argv.force, true)
    t.same(result.argv._, [])
    t.equal(Object.keys(result.argv).length, 5)
    h.assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
    h.assertTypeDetails(t, result, 1, ['b', 'branch'], 'string', 'master', 'flag', [0, 1], ['-fb', 'master'])
    h.assertTypeDetails(t, result, 2, ['f', 'force'], 'boolean', true, 'flag', [0], ['-fb'])
  })
})

tap.test('index > configured singleton api', t => {
  const name = 'happy'
  const h = Helper.get(name)

  let customUtilsCalled = false
  class CustomUtils extends Utils {
    stringToArgs (str) {
      customUtilsCalled = true
      return super.stringToArgs(str)
    }
  }

  class CustomString extends TypeString { get datatype () { return 'custom' } }

  return importFresh('../index')
    .configure({
      name: name,
      utils: new CustomUtils(),
      factories: {
        string: opts => new CustomString(opts)
      }
    })
    .string('-s, --string <str>').boolean('-b, --bool')
    .parse('--string=value --bool one').then(result => {
      h.assertNoErrors(t, result)
      t.equal(result.argv.s, 'value')
      t.equal(result.argv.string, 'value')
      t.equal(result.argv.b, true)
      t.equal(result.argv.bool, true)
      t.same(result.argv._, ['one'])
      t.equal(Object.keys(result.argv).length, 5)
      t.equal(customUtilsCalled, true)
      h.assertTypeDetails(t, result, 1, ['s', 'string'], 'custom', 'value', 'flag', [0], ['--string=value'])
      h.assertTypeDetails(t, result, 2, ['b', 'bool'], 'boolean', true, 'flag', [1], ['--bool'])
      Helper.get(require('path').basename(__filename, '.js')).assertTypeDetails(t, result, 0, ['_'], 'array:string', ['one'], 'positional', [2], ['one'])
    })
})
