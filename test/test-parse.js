'use strict'

const tap = require('tap')
const Api = require('../api')
const Context = require('../context')
const TypeEnum = require('../types/enum')
const TypeNumber = require('../types/number')

const parent = require('path').basename(__filename, '.js')
const helper = require('./helper').get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

tap.test('parse > no explicit types', async t => {
  const result = await Api.get().parse('-xyz hello  there --xyz friend ------a=nice to see -u')
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

tap.test('parse > dashes allowed as unknown args', async t => {
  class Counter extends Context {
    constructor (opts) {
      super(opts)
      this.numParseableArgs = 0
    }

    parseSingleArg (arg) {
      this.numParseableArgs++
      return super.parseSingleArg(arg)
    }
  }
  let counter
  const result = await Api.get()
    .registerFactory('_context', opts => new Counter(opts))
    .check((argv, context) => {
      counter = context
    })
    .parse('- --- ---- -- -')

  assertNoErrors(t, result)

  t.equal(counter.numParseableArgs, 3)

  t.same(result.argv._, ['-', '---', '----', '--', '-'])
  t.equal(Object.keys(result.argv).length, 1)

  t.same(result.details.args, ['-', '---', '----', '--', '-'])

  t.equal(result.details.types.length, 1)

  assertTypeDetails(t, result, 0, ['_'], 'array:string', ['-', '---', '----', '--', '-'], 'positional', [0, 1, 2, 3, 4], ['-', '---', '----', '--', '-'])
})

tap.test('parse > basic types', async t => {
  const result = await Api.get()
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

tap.test('parse > multiple sequential passes', async t => {
  const api = Api.get()
    .option('-b | --bool', { type: 'boolean' })
    .option('-s | --str', { type: 'string' })

  let result = await api.parse('')
  assertNoErrors(t, result)
  t.equal(result.argv.b, false)
  t.equal(result.argv.bool, false)
  t.equal(result.argv.s, undefined)
  t.equal(result.argv.str, undefined)
  t.same(result.argv._, [])

  result = await api.parse('--bool false -s')
  assertNoErrors(t, result)
  t.equal(result.argv.b, false)
  t.equal(result.argv.bool, false)
  t.equal(result.argv.s, '')
  t.equal(result.argv.str, '')
  t.same(result.argv._, [])

  result = await api.parse(['hi', '--str', 'there', '-b=true'])
  assertNoErrors(t, result)
  t.equal(result.argv.b, true)
  t.equal(result.argv.bool, true)
  t.equal(result.argv.s, 'there')
  t.equal(result.argv.str, 'there')
  t.same(result.argv._, ['hi'])
})

tap.test('parse > multiple concurrent passes', async t => {
  const api = Api.get()
    .boolean('--bool | -b')
    .string('--str  | -s <value>')

  const [result1, result2, result3] = await Promise.all([
    api.parse('-b -s one'),
    api.parse('--str two second'),
    api.parse('third --bool')
  ])

  assertNoErrors(t, result1)
  t.equal(result1.argv.b, true)
  t.equal(result1.argv.bool, true)
  t.equal(result1.argv.s, 'one')
  t.equal(result1.argv.str, 'one')
  t.same(result1.argv._, [])

  assertNoErrors(t, result2)
  t.equal(result2.argv.b, false)
  t.equal(result2.argv.bool, false)
  t.equal(result2.argv.s, 'two')
  t.equal(result2.argv.str, 'two')
  t.same(result2.argv._, ['second'])

  assertNoErrors(t, result3)
  t.equal(result3.argv.b, true)
  t.equal(result3.argv.bool, true)
  t.equal(result3.argv.s, undefined)
  t.equal(result3.argv.str, undefined)
  t.same(result3.argv._, ['third'])
})

tap.test('parse > strict types', async t => {
  const result = await Api.get()
    // enums are strict by default, their default value is assumed valid
    .custom(
      TypeEnum.get().flags('-e').choice(['one', 'two']).choice('three').defaultValue('none')
    )
    // strict numbers don't allow NaN
    .custom(TypeNumber.get().alias(['n', 'num']).strict(true).required(true))
    // strings don't have a strict mode
    .string('-s', { strict: true })
    .parse('-n x -s')

  t.equal(result.code, 1)
  t.match(result.output, /Value "NaN" is invalid for argument n or num\. Please specify a number\./)
  t.equal(result.errors.length, 0)
  t.equal(result.argv.e, 'none')
  t.equal(result.argv.s, '')
})

tap.test('parse > a required string should not allow empty value', async t => {
  const api = Api.get().string('-s <string>', { required: true })
  let result = await api.parse('-s')
  t.equal(result.code, 1)
  t.match(result.output, /Missing required argument: s/)
  t.equal(result.errors.length, 0)

  result = await api.parse('-s val')
  assertNoErrors(t, result)
  t.equal(result.argv.s, 'val')
})

tap.test('parse > strict mode prevents unknown options and arguments', async t => {
  const api = Api.get()
    .positional('[foo] [bar]')
    .string('-n, --name <string>')
    .number('-a, --age <number>')
    .strict()

  let result = await api.parse('--name Fred --aeg 24')
  // Unknown flags are detected
  t.equal(result.code, 1)
  t.match(result.output, /Unknown options: --aeg/)
  t.equal(result.errors.length, 0)

  result = await api.parse('send 111 222 333')
  t.equal(result.code, 1)
  t.match(result.output, /Unknown arguments: 222 333/)
  t.equal(result.errors.length, 0)
})

tap.test('parse > strict mode prevents unknown options and arguments in command blocks', async t => {
  const api = Api.get()
    .string('-n, --name <string>')
    .number('-a, --age <number>')
    .command('send <studentid>')
    .strict()

  let result = await api.parse('send 111 --name Fred --aeg 24 --hello')
  // Unknown flags are detected
  t.equal(result.code, 1)
  t.match(result.output, /Unknown options: --aeg, --hello/)
  t.equal(result.errors.length, 0)

  result = await api.parse('send 111 222 333 --hello')
  t.equal(result.code, 2)
  t.match(result.output, /Unknown arguments: 222 333/)
  t.match(result.output, /Unknown options: --hello/)
  t.equal(result.errors.length, 0)

  result = await api.parse('random')
  t.equal(result.code, 1)
  t.match(result.output, /Unknown arguments: random/)
  t.equal(result.errors.length, 0)
})

tap.test('parse > strict mode still allows showHelpByDefault to work', async t => {
  let ranCommand = false
  const api = Api.get({ name: 'program' })
    .string('-n, --name <string>')
    .number('-a, --age <number>')
    .command('send <studentid>', argv => {
      ranCommand = true
    })
    .strict()
    .showHelpByDefault()
    .outputSettings({ maxWidth: 41 })

  let result = await api.parse('')
  t.equal(result.code, 0)
  t.equal(result.errors.length, 0)
  t.equal(result.output, [
    'Usage: program <command> <args> [options]',
    '',
    'Commands:',
    '  send <studentid>',
    '',
    'Options:',
    '  -n, --name <string>            [string]',
    '  -a, --age <number>             [number]'
  ].join('\n'))
  t.equal(ranCommand, false)

  result = await api.parse('send 111 222 --nmae Fred --age 24')
  t.equal(result.code, 2)
  t.equal(result.errors.length, 0)
  t.equal(result.output, [
    'Usage: program send <studentid> [options]',
    '',
    'Arguments:',
    '  <studentid>         [required] [string]',
    '',
    'Options:',
    '  -n, --name <string>            [string]',
    '  -a, --age <number>             [number]',
    '',
    'Unknown options: --nmae',
    'Unknown arguments: 222'
  ].join('\n'))
  t.equal(ranCommand, false)

  result = await api.parse('send 111 --name Fred --age 24')
  t.equal(result.code, 0)
  t.equal(ranCommand, true)
})

tap.test('parse > strict mode ignores options/arguments after --', async t => {
  let commandArguments
  const api = Api.get()
    .string('-n, --name <string>')
    .number('-a, --age <number>')
    .command('send <studentid>', argv => {
      commandArguments = argv._
    })
    .strict()

  let result = await api.parse('send 111 -n Fred --aeg 24 222 -- 333 --force')
  t.equal(result.code, 2)
  t.match(result.output, /Unknown options: --aeg/)
  t.match(result.output, /Unknown arguments: 222/)
  t.equal(result.errors.length, 0)
  t.equal(commandArguments, undefined)

  result = await api.parse('send 111 -n Fred --age 24 -- 222 333 --force')
  t.equal(result.code, 0)
  t.equal(result.errors.length, 0)
  t.equal(result.output, '')
  t.strictSame(commandArguments, ['--', '222', '333', '--force'])
})

tap.test('parse > coerced types', async t => {
  const api = Api.get()
    .boolean('-b', { coerce: val => val ? 'yay' : 'boo' })
    .string('-s', { coerce: val => val && val.split('..') })
    .custom(TypeNumber.get().flags('-n').coerce(val => val * 1000))
    .boolean('-x', {
      coerce: val => {
        if (val) throw new Error('Blow up')
        return val
      }
    })

  const [result1, result2] = await Promise.all([
    api.parse('-b -s 1..2 -n 5'),
    api.parse('-x')
  ])

  assertNoErrors(t, result1)
  t.equal(result1.argv.b, 'yay')
  t.same(result1.argv.s, ['1', '2'])
  t.equal(result1.argv.n, 5000)

  t.equal(result2.code, 1)
  t.match(result2.output, /Blow up/)
  t.equal(result2.errors.length, 1)
})

tap.test('parse > custom async check', async t => {
  // cliMessage, reject, throw, success, not called on help
  let called = 0

  const api = Api.get().help().check((argv, context) => {
    called++
    argv.looksGood = false
    if (argv.msg) {
      return context.cliMessage(argv.msg)
    } else if (argv.throw) {
      throw new Error('Thrown by custom check')
    } else if (argv.reject) {
      return Promise.reject(new Error('Custom check rejected'))
    }
    argv.looksGood = true
  })

  let result = await api.parse('--help')
  t.equal(result.code, 0)
  t.equal(result.errors.length, 0)
  t.equal(called, 0)
  t.equal(result.argv.looksGood, undefined)

  result = await api.parse('--msg "Not allowed"')
  t.equal(result.code, 1)
  t.match(result.output, /Not allowed/)
  t.equal(result.errors.length, 0)
  t.equal(called, 1)
  t.equal(result.argv.looksGood, false)

  result = await api.parse('--throw')
  t.equal(result.code, 1)
  t.match(result.output, /Thrown by custom check/)
  t.equal(result.errors.length, 1)
  t.equal(called, 2)
  t.equal(result.argv.looksGood, false)

  result = await api.parse('--reject')
  t.equal(result.code, 1)
  t.match(result.output, /Custom check rejected/)
  t.equal(result.errors.length, 1)
  t.equal(called, 3)
  t.equal(result.argv.looksGood, false)

  result = await api.parse('')
  assertNoErrors(t, result)
  t.equal(called, 4)
  t.equal(result.argv.looksGood, true)
})

tap.test('parse > state', async t => {
  const state = { name: 'jan.jansen', home: '/Users/jan' }
  let _context
  const api = Api.get().check((argv, context) => { _context = context })

  let result = await api.parse('-x Hello', state)
  t.equal(result.code, 0)
  t.equal(result.argv.x, 'Hello')
  t.equal(_context.state, state)

  result = await api.parse('-x Hello')
  t.equal(result.code, 0)
  t.equal(result.argv.x, 'Hello')
  t.equal(_context.state, undefined)
})
