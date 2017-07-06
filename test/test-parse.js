'use strict'

const tap = require('tap')
const Api = require('../api')

const parent = require('path').basename(__filename, '.js')
const helper = require('./helper').get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

tap.test('parse > no explicit types', t => {
  return Api.get().parse('-xyz hello  there --xyz friend ------a=nice to see -u').then(result => {
    assertNoErrors(t, result)

    t.same(result.argv._, ['there', 'to', 'see'])
    t.equal(result.argv.x, true)
    t.equal(result.argv.y, true)
    t.equal(result.argv.z, 'hello')
    t.equal(result.argv.xyz, 'friend')
    t.equal(result.argv.a, 'nice')
    t.equal(result.argv.u, true)

    t.same(result.details.args, ['-xyz', 'hello', 'there', '--xyz', 'friend', '------a=nice', 'to', 'see', '-u'])

    t.equal(result.details.types.length, 1)

    assertTypeDetails(t, result, 0, ['_'], 'array:string', ['there', 'to', 'see'], 'positional', [2, 6, 7], ['there', 'to', 'see'])
  })
})

tap.test('parse > basic types', t => {
  return Api.get()
    .boolean('-b, --bool')
    .enumeration('-e, --enum <choice>', {
      choices: ['one', 'two', 'three']
    })
    .number('-n, --number <num>')
    .path('-p, --path <path>')
    .file('-f, --file <file>')
    .dir('-d, --dir <dir>')
    .string('-s, --string <str>')
    .parse('-b a --enum two b -n 0 c --path=local d e -f package.json f g --dir node_modules h -s "hello there" i')
    .then(result => {
      assertNoErrors(t, result)

      t.same(result.argv._, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'])
      t.equal(result.argv.b, true)
      t.equal(result.argv.bool, true)
      t.notOk(result.argv.choice)
      t.equal(result.argv.e, 'two')
      t.equal(result.argv.enum, 'two')
      t.equal(result.argv.n, 0)
      t.equal(result.argv.number, 0)
      t.notOk(result.argv.num)
      t.equal(result.argv.p, 'local')
      t.equal(result.argv.path, 'local')
      t.equal(result.argv.f, 'package.json')
      t.equal(result.argv.file, 'package.json')
      t.equal(result.argv.d, 'node_modules')
      t.equal(result.argv.dir, 'node_modules')
      t.equal(result.argv.s, 'hello there')
      t.equal(result.argv.string, 'hello there')
      t.notOk(result.argv.str)

      t.same(result.details.args, [
        '-b', 'a', '--enum', 'two', 'b', '-n', '0', 'c', '--path=local', 'd',
        'e', '-f', 'package.json', 'f', 'g', '--dir', 'node_modules', 'h',
        '-s', 'hello there', 'i'
      ])

      t.equal(result.details.types.length, 8)

      assertTypeDetails(t, result,
        0, ['_'], 'array:string',
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
        'positional',
        [1, 4, 7, 9, 10, 13, 14, 17, 20],
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
      )
      assertTypeDetails(t, result, 1, ['b', 'bool'], 'boolean', true, 'flag', [0], ['-b'])
      assertTypeDetails(t, result, 2, ['e', 'enum'], 'enum', 'two', 'flag', [2, 3], ['--enum', 'two'])
      assertTypeDetails(t, result, 3, ['n', 'number'], 'number', 0, 'flag', [5, 6], ['-n', '0'])
      assertTypeDetails(t, result, 4, ['p', 'path'], 'path', 'local', 'flag', [8], ['--path=local'])
      assertTypeDetails(t, result, 5, ['f', 'file'], 'file', 'package.json', 'flag', [11, 12], ['-f', 'package.json'])
      assertTypeDetails(t, result, 6, ['d', 'dir'], 'dir', 'node_modules', 'flag', [15, 16], ['--dir', 'node_modules'])
      assertTypeDetails(t, result, 7, ['s', 'string'], 'string', 'hello there', 'flag', [18, 19], ['-s', 'hello there'])
    })
})

tap.test('parse > multiple sequential passes', t => {
  const api = Api.get()
    .option('-b | --bool', { type: 'boolean' })
    .option('-s | --str', { type: 'string' })
  return api.parse('').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.b, false)
    t.equal(result.argv.bool, false)
    t.equal(result.argv.s, undefined)
    t.equal(result.argv.str, undefined)
    t.same(result.argv._, [])
    return api.parse('--bool false -s')
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.b, false)
    t.equal(result.argv.bool, false)
    t.equal(result.argv.s, '')
    t.equal(result.argv.str, '')
    t.same(result.argv._, [])
    return api.parse(['hi', '--str', 'there', '-b=true'])
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.b, true)
    t.equal(result.argv.bool, true)
    t.equal(result.argv.s, 'there')
    t.equal(result.argv.str, 'there')
    t.same(result.argv._, ['hi'])
  })
})

tap.test('parse > multiple concurrent passes', t => {
  const api = Api.get()
    .boolean('--bool | -b')
    .string('--str  | -s <value>')
  const promises = []
  promises.push(api.parse('-b -s one').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.b, true)
    t.equal(result.argv.bool, true)
    t.equal(result.argv.s, 'one')
    t.equal(result.argv.str, 'one')
    t.same(result.argv._, [])
  }))
  promises.push(api.parse('--str two second').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.b, false)
    t.equal(result.argv.bool, false)
    t.equal(result.argv.s, 'two')
    t.equal(result.argv.str, 'two')
    t.same(result.argv._, ['second'])
  }))
  promises.push(api.parse('third --bool').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.b, true)
    t.equal(result.argv.bool, true)
    t.equal(result.argv.s, undefined)
    t.equal(result.argv.str, undefined)
    t.same(result.argv._, ['third'])
  }))
  return Promise.all(promises)
})

tap.test('parse > required types')
tap.test('parse > strict types')
tap.test('parse > coerced types')
// every type can test:
// - aliases without flags
// - flags without aliases
// - no flags or aliases ??
// - defaultValue
// - required
// - strict
// - coerce
// - description || desc
// - hints
// - group
// - hidden
