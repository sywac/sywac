'use strict'

const fs = require('fs')
const del = require('del')
const tap = require('tap')
const Api = require('../../api')

const parent = require('path').basename(__filename, '.js')
const helper = require('../helper').get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

const versionFixture = '9.7.999'
let shouldDeleteFile = false
let expectedVersion

tap.beforeEach(() => {
  if (expectedVersion) {
    // console.error('!!!!!!!!! ALREADY READ PACKAGE.JSON, SKIPPING')
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    fs.readFile('package.json', 'utf8', (err, data) => {
      if (!err) {
        try {
          const pkg = JSON.parse(data)
          expectedVersion = pkg && pkg.version
        } catch (e) {}
      }
      if (expectedVersion) {
        // console.error('!!!!!!!!! READ EXISTING FILE:', expectedVersion)
        return resolve()
      }
      // need to write our own file
      fs.writeFile('package.json', JSON.stringify({ name: 'fake', version: versionFixture, private: true }), err => {
        if (err) return reject(err)
        shouldDeleteFile = true
        expectedVersion = versionFixture
        // console.error('########## WROTE CUSTOM PACKAGE.JSON FILE')
        resolve()
      })
    })
  })
})

tap.afterEach(async () => {
  if (!shouldDeleteFile) return Promise.resolve()
  // console.error('########## DELETING CUSTOM PACKAGE.JSON FILE')
  await del('package.json')
  shouldDeleteFile = false
  expectedVersion = undefined
})

tap.test('version > defaults', async t => {
  const api = Api.get().version()
  const typeObjects = api.initContext(true).types
  t.same(typeObjects[parent][0].aliases, ['version'])
  t.equal(typeObjects[parent][0].datatype, 'boolean')
  t.equal(typeObjects[parent][0].helpFlags, '--version')
  t.equal(typeObjects[parent][0].helpDesc, 'Show version number')
  t.equal(typeObjects[parent][0].helpHints, '[commands: version] [boolean]')
  t.equal(typeObjects[parent][0].helpGroup, 'Options:')
  t.equal(typeObjects[parent][0].isHidden, false)
  const result = await api.parse('--version')
  t.equal(result.code, 0)
  t.equal(result.output, expectedVersion || versionFixture)
  t.equal(result.errors.length, 0)
  t.equal(result.argv.version, true)
  assertTypeDetails(t, result, 1, ['version'], 'boolean', true, 'flag', [0], ['--version'])
})

tap.test('version > custom flags, desc, group, hints', t => {
  const typeObjects = Api.get().version('-V, --get-version', {
    desc: 'Get the program version and exit',
    group: 'Global Options:',
    hints: false
  }).initContext(true).types
  t.same(typeObjects[parent][0].aliases, ['V', 'get-version'])
  t.equal(typeObjects[parent][0].datatype, 'boolean')
  t.equal(typeObjects[parent][0].helpFlags, '-V, --get-version')
  t.equal(typeObjects[parent][0].helpDesc, 'Get the program version and exit')
  t.equal(typeObjects[parent][0].helpHints, false)
  t.equal(typeObjects[parent][0].helpGroup, 'Global Options:')
  t.equal(typeObjects[parent][0].isHidden, false)
  t.end()
})

tap.test('version > default implicit command', async t => {
  const api = Api.get().version()

  let result = await api.parse('version')
  t.equal(result.code, 0)
  t.equal(result.output, expectedVersion || versionFixture)
  t.equal(result.errors.length, 0)
  t.equal(result.argv.version, true)
  assertTypeDetails(t, result, 1, ['version'], 'boolean', true, 'positional', [0], ['version'])

  result = await api.parse('not version')
  assertNoErrors(t, result)
  t.equal(result.argv.version, false)
  t.same(result.argv._, ['not', 'version'])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', ['not', 'version'], 'positional', [0, 1], ['not', 'version'])
  assertTypeDetails(t, result, 1, ['version'], 'boolean', false, 'default', [], [])
})

tap.test('version > custom implicit command via flags', async t => {
  const api = Api.get().version('-V | --get-version')

  let result = await api.parse('get-version')
  t.equal(result.code, 0)
  t.equal(result.output, expectedVersion || versionFixture)
  t.equal(result.errors.length, 0)
  t.equal(result.argv.V, true)
  t.equal(result.argv['get-version'], true)
  assertTypeDetails(t, result, 1, ['V', 'get-version'], 'boolean', true, 'positional', [0], ['get-version'])

  result = await api.parse('V')
  assertNoErrors(t, result)
  t.equal(result.argv.V, false)
  t.equal(result.argv['get-version'], false)
  t.same(result.argv._, ['V'])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', ['V'], 'positional', [0], ['V'])
  assertTypeDetails(t, result, 1, ['V', 'get-version'], 'boolean', false, 'default', [], [])
})

tap.test('version > disable implicit command', async t => {
  const result = await Api.get().version({ implicitCommand: false }).parse('version')
  assertNoErrors(t, result)
  t.equal(result.argv.version, false)
  t.same(result.argv._, ['version'])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', ['version'], 'positional', [0], ['version'])
  assertTypeDetails(t, result, 1, ['version'], 'boolean', false, 'default', [], [])
})

tap.test('version > custom version string', async t => {
  const result = await Api.get().version('-v, --version', {
    version: '3.14159265359'
  }).parse('-v')
  t.equal(result.code, 0)
  t.equal(result.output, '3.14159265359')
  t.equal(result.errors.length, 0)
  t.equal(result.argv.v, true)
  t.equal(result.argv.version, true)
  assertTypeDetails(t, result, 1, ['v', 'version'], 'boolean', true, 'flag', [0], ['-v'])
})

tap.test('version > custom version function', async t => {
  const result = await Api.get().version('-v, --version', {
    version: () => '6.2831853071' // currently must be synchronous
  }).parse('-v')
  t.equal(result.code, 0)
  t.equal(result.output, '6.2831853071')
  t.equal(result.errors.length, 0)
  t.equal(result.argv.v, true)
  t.equal(result.argv.version, true)
  assertTypeDetails(t, result, 1, ['v', 'version'], 'boolean', true, 'flag', [0], ['-v'])
})
