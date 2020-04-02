'use strict'

const tap = require('tap')
const Api = require('../../api')
const TypeString = require('../../types/string')

const parent = require('path').basename(__filename, '.js')
const helper = require('../helper').get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

tap.test('positional > basic dsl', async t => {
  const api = Api.get().positional('<name> [url]')

  let result = await api.parse('one two')
  assertNoErrors(t, result)

  t.equal(result.argv.name, 'one')
  t.equal(result.argv.url, 'two')
  t.same(result.argv._, [])
  t.same(result.details.args, ['one', 'two'])
  t.equal(result.details.types.length, 3)

  assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result, 1, ['name'], 'string', 'one', 'positional', [0], ['one'])
  assertTypeDetails(t, result, 2, ['url'], 'string', 'two', 'positional', [1], ['two'])

  result = await api.parse('one')
  assertNoErrors(t, result)

  t.equal(result.argv.name, 'one')
  t.equal(result.argv.url, undefined)
  t.same(result.argv._, [])

  result = await api.parse('')
  t.equal(result.code, 1)
  t.match(result.output, /Missing required argument: name/)
  t.equal(result.errors.length, 0)
})

tap.test('positional > required and optional in different positions', async t => {
  const api = Api.get().positional('[opt1] <req1> [opt2] <req2>')

  const [result1, result2, result3] = await Promise.all([
    api.parse('one two three four'),
    api.parse('one two three'),
    api.parse('one two')
  ])

  assertNoErrors(t, result1)
  t.equal(result1.argv.opt1, 'one')
  t.equal(result1.argv.req1, 'two')
  t.equal(result1.argv.opt2, 'three')
  t.equal(result1.argv.req2, 'four')

  assertNoErrors(t, result2)
  t.equal(result2.argv.opt1, 'one')
  t.equal(result2.argv.req1, 'two')
  t.equal(result2.argv.opt2, undefined)
  t.equal(result2.argv.req2, 'three')

  assertNoErrors(t, result3)
  t.equal(result3.argv.opt1, undefined)
  t.equal(result3.argv.req1, 'one')
  t.equal(result3.argv.opt2, undefined)
  t.equal(result3.argv.req2, 'two')
})

tap.test('positional > dsl for aliases', async t => {
  const [result1, result2, result3] = await Promise.all([
    Api.get().positional('"< name | email >"').parse('hi'),
    Api.get().positional('"<name | email>"').parse('hi'),
    Api.get().positional('<name|email>').parse('hi')
  ])

  assertNoErrors(t, result1)
  t.equal(result1.argv.name, 'hi')
  t.equal(result1.argv.email, 'hi')
  t.equal(Object.keys(result1.argv).length, 3)

  assertNoErrors(t, result2)
  t.equal(result2.argv.name, 'hi')
  t.equal(result2.argv.email, 'hi')
  t.equal(Object.keys(result2.argv).length, 3)

  assertNoErrors(t, result3)
  t.equal(result3.argv.name, 'hi')
  t.equal(result3.argv.email, 'hi')
  t.equal(Object.keys(result3.argv).length, 3)
})

tap.test('positional > dsl for flags', t => {
  const funcs = []

  funcs.push(async () => {
    const api = Api.get().positional('[--name] <name> [url]')

    let result = await api.parse('nom earl')
    assertNoErrors(t, result)
    t.equal(result.argv.name, 'nom')
    t.equal(result.argv.url, 'earl')
    t.equal(Object.keys(result.argv).length, 3)

    result = await api.parse('earl --name nom')
    assertNoErrors(t, result)
    t.equal(result.argv.name, 'nom')
    t.equal(result.argv.url, 'earl')
    t.equal(Object.keys(result.argv).length, 3)

    result = await api.parse('--name nom earl')
    t.equal(result.argv.name, 'nom')
    t.equal(result.argv.url, 'earl')
    t.equal(Object.keys(result.argv).length, 3)
  })

  funcs.push(async () => {
    const api = Api.get().positional('[-n|-e] <name|email> [-u] [url]')

    let result = await api.parse('nom earl')
    assertNoErrors(t, result)
    t.equal(result.argv.n, 'nom')
    t.equal(result.argv.name, 'nom')
    t.equal(result.argv.e, 'nom')
    t.equal(result.argv.email, 'nom')
    t.equal(result.argv.u, 'earl')
    t.equal(result.argv.url, 'earl')
    t.equal(Object.keys(result.argv).length, 7)

    result = await api.parse('-u earl -n nom')
    assertNoErrors(t, result)
    t.equal(result.argv.n, 'nom')
    t.equal(result.argv.name, 'nom')
    t.equal(result.argv.e, 'nom')
    t.equal(result.argv.email, 'nom')
    t.equal(result.argv.u, 'earl')
    t.equal(result.argv.url, 'earl')
    t.equal(Object.keys(result.argv).length, 7)

    result = await api.parse('-u earl skimail')
    assertNoErrors(t, result)
    t.equal(result.argv.n, 'skimail')
    t.equal(result.argv.name, 'skimail')
    t.equal(result.argv.e, 'skimail')
    t.equal(result.argv.email, 'skimail')
    t.equal(result.argv.u, 'earl')
    t.equal(result.argv.url, 'earl')
    t.equal(Object.keys(result.argv).length, 7)

    result = await api.parse('-u earl')
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: n or e or name or email/)
    t.equal(result.errors.length, 0)
  })

  return Promise.all(funcs.map(p => p()))
})

tap.test('positional > dsl for type', async t => {
  const [result1, result2, result3, result4, result5, result6] = await Promise.all([
    Api.get().positional('<array>').parse('a b'),
    Api.get().positional('<sum:array:number>').parse('1 2 3'),
    Api.get().positional('[port:number]').parse('80'),
    Api.get().positional('<path>').parse('/home'),
    Api.get().positional('<path:file>').parse('package.json'),
    Api.get().positional('<choice:enum>', { params: [{ choices: ['y', 'n'] }] }).parse('y')
  ])

  assertNoErrors(t, result1)
  t.same(result1.argv.array, ['a', 'b'])
  t.equal(Object.keys(result1.argv).length, 2)
  assertTypeDetails(t, result1, 1, ['array'], 'array:string', ['a', 'b'], 'positional', [0, 1], ['a', 'b'])

  assertNoErrors(t, result2)
  t.same(result2.argv.sum, [1, 2, 3])
  t.equal(Object.keys(result2.argv).length, 2)
  assertTypeDetails(t, result2, 1, ['sum'], 'array:number', [1, 2, 3], 'positional', [0, 1, 2], ['1', '2', '3'])

  assertNoErrors(t, result3)
  t.equal(result3.argv.port, 80)
  t.equal(Object.keys(result3.argv).length, 2)
  assertTypeDetails(t, result3, 1, ['port'], 'number', 80, 'positional', [0], ['80'])

  assertNoErrors(t, result4)
  t.equal(result4.argv.path, '/home')
  t.equal(Object.keys(result4.argv).length, 2)
  assertTypeDetails(t, result4, 1, ['path'], 'path', '/home', 'positional', [0], ['/home'])

  assertNoErrors(t, result5)
  t.equal(result5.argv.path, 'package.json')
  t.equal(Object.keys(result5.argv).length, 2)
  assertTypeDetails(t, result5, 1, ['path'], 'file', 'package.json', 'positional', [0], ['package.json'])

  assertNoErrors(t, result6)
  t.equal(result6.argv.choice, 'y')
  t.equal(Object.keys(result6.argv).length, 2)
  assertTypeDetails(t, result6, 1, ['choice'], 'enum', 'y', 'positional', [0], ['y'])
})

tap.test('positional > dsl supports custom type/factory', async t => {
  class Mod extends TypeString { get datatype () { return 'custom' } }
  const result = await Api.get().registerFactory('mod', opts => new Mod(opts)).positional('thing:mod').parse('test')
  assertNoErrors(t, result)
  t.equal(result.argv.thing, 'test')
  t.equal(Object.keys(result.argv).length, 2)
  assertTypeDetails(t, result, 1, ['thing'], 'custom', 'test', 'positional', [0], ['test'])
})

tap.test('positional > dsl for variadics', async t => {
  const [result1, result2, result3] = await Promise.all([
    Api.get().positional('<a> <b> <c..>').parse('one two three four'),
    Api.get().positional('<a> <b..> <c>').parse('one two three four'),
    Api.get().positional('<a..> <b..> <c>').parse('one two three four')
  ])

  assertNoErrors(t, result1)
  t.equal(result1.argv.a, 'one')
  t.equal(result1.argv.b, 'two')
  t.same(result1.argv.c, ['three', 'four'])
  assertTypeDetails(t, result1, 1, ['a'], 'string', 'one', 'positional', [0], ['one'])
  assertTypeDetails(t, result1, 2, ['b'], 'string', 'two', 'positional', [1], ['two'])
  assertTypeDetails(t, result1, 3, ['c'], 'array:string', ['three', 'four'], 'positional', [2, 3], ['three', 'four'])

  assertNoErrors(t, result2)
  t.equal(result2.argv.a, 'one')
  t.same(result2.argv.b, ['two', 'three'])
  t.equal(result2.argv.c, 'four')
  assertTypeDetails(t, result2, 1, ['a'], 'string', 'one', 'positional', [0], ['one'])
  assertTypeDetails(t, result2, 2, ['b'], 'array:string', ['two', 'three'], 'positional', [1, 2], ['two', 'three'])
  assertTypeDetails(t, result2, 3, ['c'], 'string', 'four', 'positional', [3], ['four'])

  assertNoErrors(t, result3)
  t.same(result3.argv.a, ['one', 'two'])
  t.same(result3.argv.b, ['three'])
  t.equal(result3.argv.c, 'four')
  assertTypeDetails(t, result3, 1, ['a'], 'array:string', ['one', 'two'], 'positional', [0, 1], ['one', 'two'])
  assertTypeDetails(t, result3, 2, ['b'], 'array:string', ['three'], 'positional', [2], ['three'])
  assertTypeDetails(t, result3, 3, ['c'], 'string', 'four', 'positional', [3], ['four'])
})

tap.test('positional > dsl for default value', async t => {
  const api = Api.get().positional('[file=package.json] [port:number=8080] [svcs..=one,two]')

  let result = await api.parse('')
  assertNoErrors(t, result)
  t.equal(result.argv.file, 'package.json')
  t.equal(result.argv.port, 8080)
  t.same(result.argv.svcs, ['one', 'two'])
  assertTypeDetails(t, result, 1, ['file'], 'file', 'package.json', 'default', [], [])
  assertTypeDetails(t, result, 2, ['port'], 'number', 8080, 'default', [], [])
  assertTypeDetails(t, result, 3, ['svcs'], 'array:string', ['one', 'two'], 'default', [], [])

  result = await api.parse('config.json 4000 all')
  assertNoErrors(t, result)
  t.equal(result.argv.file, 'config.json')
  t.equal(result.argv.port, 4000)
  t.same(result.argv.svcs, ['all'])
  assertTypeDetails(t, result, 1, ['file'], 'file', 'config.json', 'positional', [0], ['config.json'])
  assertTypeDetails(t, result, 2, ['port'], 'number', 4000, 'positional', [1], ['4000'])
  assertTypeDetails(t, result, 3, ['svcs'], 'array:string', ['all'], 'positional', [2], ['all'])
})

tap.test('positional > params as array 1/2', t => {
  const params = [
    { desc: 'The description for the required first arg', group: 'First argument:', hints: '[first]' },
    { desc: 'The description for the optional second arg', group: 'Second argument:', hints: '[second]' }
  ]
  const typeObjects = Api.get().positional('<one> [two]', {
    params: params
  }).initContext(true).types
  t.equal(typeObjects[parent][0].helpDesc, 'The description for the required first arg')
  t.equal(typeObjects[parent][0].helpGroup, 'First argument:')
  t.equal(typeObjects[parent][0].helpHints, '[first]')
  t.equal(typeObjects[parent][0].helpFlags, '<one>')
  t.equal(typeObjects[parent][1].helpDesc, 'The description for the optional second arg')
  t.equal(typeObjects[parent][1].helpGroup, 'Second argument:')
  t.equal(typeObjects[parent][1].helpHints, '[second]')
  t.equal(typeObjects[parent][1].helpFlags, '[two]')
  // assert that the call to positional() didn't modify the objects given
  t.equal(params.length, 2)
  t.equal(Object.keys(params[0]).length, 3)
  t.equal(params[0].desc, 'The description for the required first arg')
  t.equal(params[0].group, 'First argument:')
  t.equal(params[0].hints, '[first]')
  t.equal(Object.keys(params[1]).length, 3)
  t.equal(params[1].desc, 'The description for the optional second arg')
  t.equal(params[1].group, 'Second argument:')
  t.equal(params[1].hints, '[second]')
  t.end()
})

tap.test('positional > params as array 2/2', t => {
  const params = [
    { flags: '<one>', desc: 'The description for the required first arg', group: 'First argument:', hints: '[first]' },
    { flags: '[two]', desc: 'The description for the optional second arg', group: 'Second argument:', hints: '[second]' }
  ]
  const typeObjects = Api.get().positional(params).initContext(true).types
  t.equal(typeObjects[parent][0].helpDesc, 'The description for the required first arg')
  t.equal(typeObjects[parent][0].helpGroup, 'First argument:')
  t.equal(typeObjects[parent][0].helpHints, '[first]')
  t.equal(typeObjects[parent][0].helpFlags, '<one>')
  t.equal(typeObjects[parent][1].helpDesc, 'The description for the optional second arg')
  t.equal(typeObjects[parent][1].helpGroup, 'Second argument:')
  t.equal(typeObjects[parent][1].helpHints, '[second]')
  t.equal(typeObjects[parent][1].helpFlags, '[two]')
  // assert that the call to positional() didn't modify the objects given
  t.equal(params.length, 2)
  t.equal(Object.keys(params[0]).length, 4)
  t.equal(params[0].desc, 'The description for the required first arg')
  t.equal(params[0].group, 'First argument:')
  t.equal(params[0].hints, '[first]')
  t.equal(params[0].flags, '<one>')
  t.equal(Object.keys(params[1]).length, 4)
  t.equal(params[1].desc, 'The description for the optional second arg')
  t.equal(params[1].group, 'Second argument:')
  t.equal(params[1].hints, '[second]')
  t.equal(params[1].flags, '[two]')
  t.end()
})

tap.test('positional > params as object 1/3', t => {
  const params = {
    one: { desc: 'The description for the required first arg', group: 'First argument:', hints: '[first]' },
    two: { desc: 'The description for the optional second arg', group: 'Second argument:', hints: '[second]' }
  }
  const typeObjects = Api.get().positional('<one> [two]', {
    params: params
  }).initContext(true).types
  t.equal(typeObjects[parent][0].helpDesc, 'The description for the required first arg')
  t.equal(typeObjects[parent][0].helpGroup, 'First argument:')
  t.equal(typeObjects[parent][0].helpHints, '[first]')
  t.equal(typeObjects[parent][0].helpFlags, '<one>')
  t.equal(typeObjects[parent][1].helpDesc, 'The description for the optional second arg')
  t.equal(typeObjects[parent][1].helpGroup, 'Second argument:')
  t.equal(typeObjects[parent][1].helpHints, '[second]')
  t.equal(typeObjects[parent][1].helpFlags, '[two]')
  // assert that the call to positional() didn't modify the objects given
  t.equal(Object.keys(params).length, 2)
  t.equal(Object.keys(params.one).length, 3)
  t.equal(params.one.desc, 'The description for the required first arg')
  t.equal(params.one.group, 'First argument:')
  t.equal(params.one.hints, '[first]')
  t.equal(Object.keys(params.two).length, 3)
  t.equal(params.two.desc, 'The description for the optional second arg')
  t.equal(params.two.group, 'Second argument:')
  t.equal(params.two.hints, '[second]')
  t.end()
})

tap.test('positional > params as object 2/3', t => {
  const params = {
    one: { flags: '<one>', desc: 'The description for the required first arg', group: 'First argument:', hints: '[first]' },
    two: { flags: '[two]', desc: 'The description for the optional second arg', group: 'Second argument:', hints: '[second]' }
  }
  const typeObjects = Api.get().positional({
    params: params
  }).initContext(true).types
  t.equal(typeObjects[parent][0].helpDesc, 'The description for the required first arg')
  t.equal(typeObjects[parent][0].helpGroup, 'First argument:')
  t.equal(typeObjects[parent][0].helpHints, '[first]')
  t.equal(typeObjects[parent][0].helpFlags, '<one>')
  t.equal(typeObjects[parent][1].helpDesc, 'The description for the optional second arg')
  t.equal(typeObjects[parent][1].helpGroup, 'Second argument:')
  t.equal(typeObjects[parent][1].helpHints, '[second]')
  t.equal(typeObjects[parent][1].helpFlags, '[two]')
  // assert that the call to positional() didn't modify the objects given
  t.equal(Object.keys(params).length, 2)
  t.equal(Object.keys(params.one).length, 4)
  t.equal(params.one.desc, 'The description for the required first arg')
  t.equal(params.one.group, 'First argument:')
  t.equal(params.one.hints, '[first]')
  t.equal(params.one.flags, '<one>')
  t.equal(Object.keys(params.two).length, 4)
  t.equal(params.two.desc, 'The description for the optional second arg')
  t.equal(params.two.group, 'Second argument:')
  t.equal(params.two.hints, '[second]')
  t.equal(params.two.flags, '[two]')
  t.end()
})

tap.test('positional > params as object 3/3', t => {
  const params = {
    one: { flags: '<one>', desc: 'The description for the required first arg', group: 'First argument:', hints: '[first]' },
    two: { flags: '[two]', desc: 'The description for the optional second arg', group: 'Second argument:', hints: '[second]' }
  }
  const typeObjects = Api.get().positional(params).initContext(true).types
  t.equal(typeObjects[parent][0].helpDesc, 'The description for the required first arg')
  t.equal(typeObjects[parent][0].helpGroup, 'First argument:')
  t.equal(typeObjects[parent][0].helpHints, '[first]')
  t.equal(typeObjects[parent][0].helpFlags, '<one>')
  t.equal(typeObjects[parent][1].helpDesc, 'The description for the optional second arg')
  t.equal(typeObjects[parent][1].helpGroup, 'Second argument:')
  t.equal(typeObjects[parent][1].helpHints, '[second]')
  t.equal(typeObjects[parent][1].helpFlags, '[two]')
  // assert that the call to positional() didn't modify the objects given
  t.equal(Object.keys(params).length, 2)
  t.equal(Object.keys(params.one).length, 4)
  t.equal(params.one.desc, 'The description for the required first arg')
  t.equal(params.one.group, 'First argument:')
  t.equal(params.one.hints, '[first]')
  t.equal(params.one.flags, '<one>')
  t.equal(Object.keys(params.two).length, 4)
  t.equal(params.two.desc, 'The description for the optional second arg')
  t.equal(params.two.group, 'Second argument:')
  t.equal(params.two.hints, '[second]')
  t.equal(params.two.flags, '[two]')
  t.end()
})

tap.test('positional > paramsDescription || paramsDesc', t => {
  let opts = { paramsDescription: 'The description for the first arg' } // single string for one positional
  let typeObjects = Api.get().positional('<one> [two]', opts).initContext(true).types
  t.equal(typeObjects[parent][0].helpDesc, 'The description for the first arg')
  t.equal(typeObjects[parent][1].helpDesc, '')
  // assert that the call to positional() didn't modify the objects given
  t.equal(Object.keys(opts).length, 1)
  t.equal(opts.paramsDescription, 'The description for the first arg')

  opts = {
    paramsDesc: [ // array for multiple positionals
      'The description for the required first arg',
      'The description for the optional second arg'
    ]
  }
  typeObjects = Api.get().positional('<one> [two]', opts).initContext(true).types
  t.equal(typeObjects[parent][0].helpDesc, 'The description for the required first arg')
  t.equal(typeObjects[parent][1].helpDesc, 'The description for the optional second arg')
  // assert that the call to positional() didn't modify the objects given
  t.equal(Object.keys(opts).length, 1)
  t.same(opts.paramsDesc, ['The description for the required first arg', 'The description for the optional second arg'])
  t.end()
})

tap.test('positional > paramsGroup', t => {
  const opts = { paramsGroup: 'Parameters:' }
  const typeObjects = Api.get().positional('<one> [two]', opts).initContext(true).types
  t.equal(typeObjects[parent][0].helpGroup, 'Parameters:')
  t.equal(typeObjects[parent][1].helpGroup, 'Parameters:')
  // assert that the call to positional() didn't modify the objects given
  t.equal(Object.keys(opts).length, 1)
  t.equal(opts.paramsGroup, 'Parameters:')
  t.end()
})

tap.test('positional > ignore', async t => {
  const opts = { ignore: '[options]' }
  const result = await Api.get()
    .positional('<one> [options]', opts)
    .parse('uno dos')
  assertNoErrors(t, result)
  t.equal(result.argv.one, 'uno')
  t.same(result.argv._, ['dos'])
  t.equal(Object.keys(result.argv).length, 2)
  assertTypeDetails(t, result, 0, ['_'], 'array:string', ['dos'], 'positional', [1], ['dos'])
  assertTypeDetails(t, result, 1, ['one'], 'string', 'uno', 'positional', [0], ['uno'])
  // assert that the call to positional() didn't modify the objects given
  t.equal(Object.keys(opts).length, 1)
  t.equal(opts.ignore, '[options]')
})

tap.test('positional > coerce', async t => {
  const result = await Api.get().positional('<one>', {
    params: [{ coerce: val => val && val.split('..') }]
  }).parse('x..y')
  assertNoErrors(t, result)
  t.same(result.argv.one, ['x', 'y'])
})
