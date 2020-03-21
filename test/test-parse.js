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

tap.test('parse > dashes allowed as unknown args', t => {
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
  return Api.get()
    .registerFactory('_context', opts => new Counter(opts))
    .check((argv, context) => {
      counter = context
    })
    .parse('- --- ---- -- -').then(result => {
      assertNoErrors(t, result)

      t.equal(counter.numParseableArgs, 3)

      t.same(result.argv._, ['-', '---', '----', '--', '-'])
      t.equal(Object.keys(result.argv).length, 1)

      t.same(result.details.args, ['-', '---', '----', '--', '-'])

      t.equal(result.details.types.length, 1)

      assertTypeDetails(t, result, 0, ['_'], 'array:string', ['-', '---', '----', '--', '-'], 'positional', [0, 1, 2, 3, 4], ['-', '---', '----', '--', '-'])
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

tap.test('parse > strict types', t => {
  return Api.get()
    // enums are strict by default, their default value is assumed valid
    .custom(
      TypeEnum.get().flags('-e').choice(['one', 'two']).choice('three').defaultValue('none')
    )
    // strict numbers don't allow NaN
    .custom(TypeNumber.get().alias(['n', 'num']).strict(true).required(true))
    // strings don't have a strict mode
    .string('-s', { strict: true })
    .parse('-n x -s').then(result => {
      t.equal(result.code, 1)
      t.match(result.output, /Value "NaN" is invalid for argument n or num\. Please specify a number\./)
      t.equal(result.errors.length, 0)
      t.equal(result.argv.e, 'none')
      t.equal(result.argv.s, '')
    })
})

tap.test('parse > a required string should not allow empty value', t => {
  const api = Api.get().string('-s <string>', { required: true })
  return api.parse('-s').then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: s/)
    t.equal(result.errors.length, 0)
    return api.parse('-s val')
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.s, 'val')
  })
})

tap.test('parse > strict mode prevents unknown options and arguments', t => {
  const api = Api.get()
    .positional('[foo] [bar]')
    .string('-n, --name <string>')
    .number('-a, --age <number>')
    .strict()
  return api.parse('--name Fred --aeg 24').then(result => {
    // Unknown flags are detected
    t.equal(result.code, 1)
    t.match(result.output, /Unknown options: --aeg/)
    t.equal(result.errors.length, 0)
    return api.parse('send 111 222 333')
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Unknown arguments: 222 333/)
    t.equal(result.errors.length, 0)
  })
})

tap.test('parse > strict mode prevents unknown options and arguments in command blocks', t => {
  const api = Api.get()
    .string('-n, --name <string>')
    .number('-a, --age <number>')
    .command('send <studentid>')
    .strict()
  return api.parse('send 111 --name Fred --aeg 24 --hello').then(result => {
    // Unknown flags are detected
    t.equal(result.code, 1)
    t.match(result.output, /Unknown options: --aeg, --hello/)
    t.equal(result.errors.length, 0)
    return api.parse('send 111 222 333 --hello')
  }).then(result => {
    t.equal(result.code, 2)
    t.match(result.output, /Unknown arguments: 222 333/)
    t.match(result.output, /Unknown options: --hello/)
    t.equal(result.errors.length, 0)
    return api.parse('random')
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Unknown arguments: random/)
    t.equal(result.errors.length, 0)
  })
})

tap.test('parse > coerced types', t => {
  const promises = []

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

  promises.push(api.parse('-b -s 1..2 -n 5').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.b, 'yay')
    t.same(result.argv.s, ['1', '2'])
    t.equal(result.argv.n, 5000)
  }))

  promises.push(api.parse('-x').then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Blow up/)
    t.equal(result.errors.length, 1)
  }))

  return Promise.all(promises)
})

tap.test('parse > custom async check', t => {
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
    return Promise.resolve().then(() => {
      argv.looksGood = true
    })
  })

  return api.parse('--help').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(called, 0)
    t.equal(result.argv.looksGood, undefined)
    return api.parse('--msg "Not allowed"')
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Not allowed/)
    t.equal(result.errors.length, 0)
    t.equal(called, 1)
    t.equal(result.argv.looksGood, false)
    return api.parse('--throw')
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Thrown by custom check/)
    t.equal(result.errors.length, 1)
    t.equal(called, 2)
    t.equal(result.argv.looksGood, false)
    return api.parse('--reject')
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Custom check rejected/)
    t.equal(result.errors.length, 1)
    t.equal(called, 3)
    t.equal(result.argv.looksGood, false)
    return api.parse('')
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(called, 4)
    t.equal(result.argv.looksGood, true)
  })
})
