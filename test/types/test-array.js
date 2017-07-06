'use strict'

const tap = require('tap')
const Api = require('../../api')
const TypeArray = require('../../types/array')

const helper = require('../helper').get('test-array')
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

tap.test('array > via specific api methods', t => {
  return Api.get()
    .array('-a, --array <vals..>')
    .stringArray('-s, --strings <one or more strings>')
    .numberArray('-n, --numbers <n1 [n2 n3..]>')
    .parse('before -a one two -s one,two -s three four -n=1 2 3,4 -- after')
    .then(result => {
      assertNoErrors(t, result)

      t.same(result.argv.a, ['one', 'two'])
      t.same(result.argv.array, ['one', 'two'])
      t.same(result.argv.s, ['one', 'two', 'three', 'four'])
      t.same(result.argv.strings, ['one', 'two', 'three', 'four'])
      t.same(result.argv.n, [1, 2, 3, 4])
      t.same(result.argv.numbers, [1, 2, 3, 4])
      t.same(result.argv._, ['before', '--', 'after'])

      t.same(result.details.args, [
        'before', '-a', 'one', 'two', '-s', 'one,two', '-s', 'three', 'four',
        '-n=1', '2', '3,4', '--', 'after'
      ])

      t.equal(result.details.types.length, 4)

      assertTypeDetails(t, result, 0, ['_'], 'array:string', ['before', '--', 'after'], 'positional', [0, 12, 13], ['before', '--', 'after'])
      assertTypeDetails(t, result, 1, ['a', 'array'], 'array:string', ['one', 'two'], 'flag', [1, 2, 3], ['-a', 'one', 'two'])
      assertTypeDetails(t, result, 2, ['s', 'strings'], 'array:string', ['one', 'two', 'three', 'four'], 'flag', [4, 5, 6, 7, 8], ['-s', 'one,two', '-s', 'three', 'four'])
      assertTypeDetails(t, result, 3, ['n', 'numbers'], 'array:number', [1, 2, 3, 4], 'flag', [9, 10, 11], ['-n=1', '2', '3,4'])
    })
})

tap.test('array > via generic api method', t => {
  return Api.get()
    .option('--array', { type: 'array' })
    .option('--strings', { type: 'array:string' })
    .option('--numbers', { type: 'array:number' })
    .option('--enums', { type: 'array:enum', choices: ['good', 'bad', 'ugly'] })
    .option('--paths', { type: 'array:path' })
    .option('--files', { type: 'array:file' })
    .option('--dirs', { type: 'array:dir' })
    .parse('--array a,b --strings c d --dirs i --numbers one 2 --enums good bad --paths e f --files=g,h --dirs j')
    .then(result => {
      assertNoErrors(t, result)

      t.same(result.argv._, [])
      t.same(result.argv.array, ['a', 'b'])
      t.same(result.argv.strings, ['c', 'd'])
      t.same(result.argv.numbers, [NaN, 2])
      t.same(result.argv.enums, ['good', 'bad'])
      t.same(result.argv.paths, ['e', 'f'])
      t.same(result.argv.files, ['g', 'h'])
      t.same(result.argv.dirs, ['i', 'j'])

      t.same(result.details.args, [
        '--array', 'a,b', '--strings', 'c', 'd', '--dirs', 'i', '--numbers', 'one',
        '2', '--enums', 'good', 'bad', '--paths', 'e', 'f', '--files=g,h', '--dirs', 'j'
      ])

      t.equal(result.details.types.length, 8)

      assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
      assertTypeDetails(t, result, 1, ['array'], 'array:string', ['a', 'b'], 'flag', [0, 1], ['--array', 'a,b'])
      assertTypeDetails(t, result, 2, ['strings'], 'array:string', ['c', 'd'], 'flag', [2, 3, 4], ['--strings', 'c', 'd'])
      assertTypeDetails(t, result, 3, ['numbers'], 'array:number', [NaN, 2], 'flag', [7, 8, 9], ['--numbers', 'one', '2'])
      assertTypeDetails(t, result, 4, ['enums'], 'array:enum', ['good', 'bad'], 'flag', [10, 11, 12], ['--enums', 'good', 'bad'])
      assertTypeDetails(t, result, 5, ['paths'], 'array:path', ['e', 'f'], 'flag', [13, 14, 15], ['--paths', 'e', 'f'])
      assertTypeDetails(t, result, 6, ['files'], 'array:file', ['g', 'h'], 'flag', [16], ['--files=g,h'])
      assertTypeDetails(t, result, 7, ['dirs'], 'array:dir', ['i', 'j'], 'flag', [5, 6, 17, 18], ['--dirs', 'i', '--dirs', 'j'])
    })
})

tap.test('array > default value', t => {
  const api = Api.get()
    .array('--defaultDefault')
    .array('--customDefaultArray', { defaultValue: ['hi', 'there'] })
    .array('--customDefaultValue', { defaultValue: 'string' })
  return api.parse('').then(result => {
    assertNoErrors(t, result)
    t.same(result.argv.defaultDefault, [])
    t.same(result.argv.customDefaultArray, ['hi', 'there'])
    t.same(result.argv.customDefaultValue, ['string'])
    return api.parse('--customDefaultArray joe bob --customDefaultValue yo')
  }).then(result => {
    assertNoErrors(t, result)
    t.same(result.argv.defaultDefault, [])
    t.same(result.argv.customDefaultArray, ['joe', 'bob'])
    t.same(result.argv.customDefaultValue, ['yo'])
  })
})

tap.test('array > custom delimiter', t => {
  return Api.get()
    .array('--dash <one-two-n..>', { delimiter: '-' })
    .parse('--dash a-b-c d,e f')
    .then(result => {
      assertNoErrors(t, result)
      t.same(result.argv.dash, ['a', 'b', 'c', 'd,e', 'f'])
    })
})

tap.test('array > not cumulative', t => {
  return Api.get()
    .array('--lastFlagWins', { cumulative: false })
    .parse('--lastFlagWins a b --lastFlagWins c d --lastFlagWins e f')
    .then(result => {
      assertNoErrors(t, result)
      t.same(result.argv.lastFlagWins, ['e', 'f'])
    })
})

tap.test('array > nested', t => {
  const api = Api.get().custom(
    TypeArray.get()
      .of(TypeArray.get().cumulative(false))
      .flags('-N, --nested <values>')
      .desc('Interesting CLI choice here')
      .delimiter(false)
  )
  return api.parse('-N a b -N c,d -N=e f').then(result => {
    assertNoErrors(t, result)

    const nested = result.argv.nested
    t.equal(nested.length, 3)
    t.same(nested[0], ['a', 'b'])
    t.same(nested[1], ['c', 'd'])
    t.same(nested[2], ['e', 'f'])

    t.equal(result.details.types.length, 2)

    assertTypeDetails(t, result, 1, ['N', 'nested'], 'array:array:string', '_SKIP_', 'flag', [0, 1, 2, 3, 4, 5, 6], ['-N', 'a', 'b', '-N', 'c,d', '-N=e', 'f'])
  })
})

tap.test('array > required', t => {
  const api = Api.get().array('-a|--array', { required: true })
  return api.parse('').then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: a or array/)
    t.equal(result.errors.length, 0)
    return api.parse('-a')
  }).then(result => {
    assertNoErrors(t, result)
    t.same(result.argv.a, [''])
    t.same(result.argv.array, [''])
    return api.parse('-a hi')
  }).then(result => {
    assertNoErrors(t, result)
    t.same(result.argv.a, ['hi'])
    t.same(result.argv.array, ['hi'])
  })
})

tap.test('array > strict', t => {
  // types with a strict mode: enum, number, path
  const api = Api.get()
    .numberArray('n', {
      strict: true // numbers fail in strict mode if anything parses as NaN
    })
    .option('e', {
      type: 'array:enum', // enums are strict by default
      choices: ['node', 'java', 'rust']
    })
    .option('p', {
      type: 'array:path',
      mustExist: true // paths are only strict if mustExist is a boolean
    })
  return api.parse('-n no -e ruby -p blerg_dne').then(result => {
    t.equal(result.code, 3)
    t.match(result.output, /Value "NaN" is invalid for argument n\. Please specify a number\./)
    t.match(result.output, /Value "ruby" is invalid for argument e\. Choices are: node, java, rust/)
    t.match(result.output, /The path does not exist: blerg_dne/)
    t.equal(result.errors.length, 0)
    return api.parse(`-p ${__filename} -e node -n 0`)
  }).then(result => {
    assertNoErrors(t, result)
    t.same(result.argv.n, [0])
    t.same(result.argv.e, ['node'])
    t.same(result.argv.p, [__filename])
  })
})
