'use strict'

const tap = require('tap')
const Api = require('../../api')
const TypeString = require('../../types/string')

const parent = require('path').basename(__filename, '.js')
const helper = require('../helper').get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

tap.test('positional > basic dsl', t => {
  const api = Api.get().positional('<name> [url]')
  return api.parse('one two').then(result => {
    assertNoErrors(t, result)

    t.equal(result.argv.name, 'one')
    t.equal(result.argv.url, 'two')
    t.same(result.argv._, [])
    t.same(result.details.args, ['one', 'two'])
    t.equal(result.details.types.length, 3)

    assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
    assertTypeDetails(t, result, 1, ['name'], 'string', 'one', 'positional', [0], ['one'])
    assertTypeDetails(t, result, 2, ['url'], 'string', 'two', 'positional', [1], ['two'])

    return api.parse('one')
  }).then(result => {
    assertNoErrors(t, result)

    t.equal(result.argv.name, 'one')
    t.equal(result.argv.url, undefined)
    t.same(result.argv._, [])

    return api.parse('')
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: name/)
    t.equal(result.errors.length, 0)
  })
})

tap.test('positional > required and optional in different positions', t => {
  const api = Api.get().positional('[opt1] <req1> [opt2] <req2>')
  const promises = []

  promises.push(api.parse('one two three four').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.opt1, 'one')
    t.equal(result.argv.req1, 'two')
    t.equal(result.argv.opt2, 'three')
    t.equal(result.argv.req2, 'four')
  }))

  promises.push(api.parse('one two three').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.opt1, 'one')
    t.equal(result.argv.req1, 'two')
    t.equal(result.argv.opt2, undefined)
    t.equal(result.argv.req2, 'three')
  }))

  promises.push(api.parse('one two').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.opt1, undefined)
    t.equal(result.argv.req1, 'one')
    t.equal(result.argv.opt2, undefined)
    t.equal(result.argv.req2, 'two')
  }))

  return Promise.all(promises)
})

tap.test('positional > dsl for aliases', t => {
  const promises = []
  promises.push(Api.get().positional('"< name | email >"').parse('hi').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.name, 'hi')
    t.equal(result.argv.email, 'hi')
    t.equal(Object.keys(result.argv).length, 3)
  }))
  promises.push(Api.get().positional('"<name | email>"').parse('hi').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.name, 'hi')
    t.equal(result.argv.email, 'hi')
    t.equal(Object.keys(result.argv).length, 3)
  }))
  promises.push(Api.get().positional('<name|email>').parse('hi').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.name, 'hi')
    t.equal(result.argv.email, 'hi')
    t.equal(Object.keys(result.argv).length, 3)
  }))
  return Promise.all(promises)
})

tap.test('positional > dsl for flags', t => {
  const promises = []

  promises.push(() => {
    const api = Api.get().positional('[--name] <name> [url]')
    return api.parse('nom earl').then(result => {
      assertNoErrors(t, result)
      t.equal(result.argv.name, 'nom')
      t.equal(result.argv.url, 'earl')
      t.equal(Object.keys(result.argv).length, 3)
      return api.parse('earl --name nom')
    }).then(result => {
      assertNoErrors(t, result)
      t.equal(result.argv.name, 'nom')
      t.equal(result.argv.url, 'earl')
      t.equal(Object.keys(result.argv).length, 3)
      return api.parse('--name nom earl')
    }).then(result => {
      t.equal(result.argv.name, 'nom')
      t.equal(result.argv.url, 'earl')
      t.equal(Object.keys(result.argv).length, 3)
    })
  })

  promises.push(() => {
    const api = Api.get().positional('[-n|-e] <name|email> [-u] [url]')
    return api.parse('nom earl').then(result => {
      assertNoErrors(t, result)
      t.equal(result.argv.n, 'nom')
      t.equal(result.argv.name, 'nom')
      t.equal(result.argv.e, 'nom')
      t.equal(result.argv.email, 'nom')
      t.equal(result.argv.u, 'earl')
      t.equal(result.argv.url, 'earl')
      t.equal(Object.keys(result.argv).length, 7)
      return api.parse('-u earl -n nom')
    }).then(result => {
      assertNoErrors(t, result)
      t.equal(result.argv.n, 'nom')
      t.equal(result.argv.name, 'nom')
      t.equal(result.argv.e, 'nom')
      t.equal(result.argv.email, 'nom')
      t.equal(result.argv.u, 'earl')
      t.equal(result.argv.url, 'earl')
      t.equal(Object.keys(result.argv).length, 7)
      return api.parse('-u earl skimail')
    }).then(result => {
      assertNoErrors(t, result)
      t.equal(result.argv.n, 'skimail')
      t.equal(result.argv.name, 'skimail')
      t.equal(result.argv.e, 'skimail')
      t.equal(result.argv.email, 'skimail')
      t.equal(result.argv.u, 'earl')
      t.equal(result.argv.url, 'earl')
      t.equal(Object.keys(result.argv).length, 7)
      return api.parse('-u earl')
    }).then(result => {
      t.equal(result.code, 1)
      t.match(result.output, /Missing required argument: n or e or name or email/)
      t.equal(result.errors.length, 0)
    })
  })

  return Promise.all(promises)
})

tap.test('positional > dsl for type', t => {
  const promises = []
  promises.push(Api.get().positional('<array>').parse('a b').then(result => {
    assertNoErrors(t, result)
    t.same(result.argv.array, ['a', 'b'])
    t.equal(Object.keys(result.argv).length, 2)
    assertTypeDetails(t, result, 1, ['array'], 'array:string', ['a', 'b'], 'positional', [0, 1], ['a', 'b'])
  }))
  promises.push(Api.get().positional('<sum:array:number>').parse('1 2 3').then(result => {
    assertNoErrors(t, result)
    t.same(result.argv.sum, [1, 2, 3])
    t.equal(Object.keys(result.argv).length, 2)
    assertTypeDetails(t, result, 1, ['sum'], 'array:number', [1, 2, 3], 'positional', [0, 1, 2], ['1', '2', '3'])
  }))
  promises.push(Api.get().positional('[port:number]').parse('80').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.port, 80)
    t.equal(Object.keys(result.argv).length, 2)
    assertTypeDetails(t, result, 1, ['port'], 'number', 80, 'positional', [0], ['80'])
  }))
  promises.push(Api.get().positional('<path>').parse('/home').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.path, '/home')
    t.equal(Object.keys(result.argv).length, 2)
    assertTypeDetails(t, result, 1, ['path'], 'path', '/home', 'positional', [0], ['/home'])
  }))
  promises.push(Api.get().positional('<path:file>').parse('package.json').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.path, 'package.json')
    t.equal(Object.keys(result.argv).length, 2)
    assertTypeDetails(t, result, 1, ['path'], 'file', 'package.json', 'positional', [0], ['package.json'])
  }))
  promises.push(Api.get().positional('<choice:enum>', { params: [{ choices: ['y', 'n'] }] }).parse('y').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.choice, 'y')
    t.equal(Object.keys(result.argv).length, 2)
    assertTypeDetails(t, result, 1, ['choice'], 'enum', 'y', 'positional', [0], ['y'])
  }))
  return Promise.all(promises)
})

tap.test('positional > dsl supports custom type/factory', t => {
  class Mod extends TypeString { get datatype () { return 'custom' } }
  return Api.get().registerFactory('mod', opts => new Mod(opts)).positional('thing:mod').parse('test').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.thing, 'test')
    t.equal(Object.keys(result.argv).length, 2)
    assertTypeDetails(t, result, 1, ['thing'], 'custom', 'test', 'positional', [0], ['test'])
  })
})

tap.test('positional > dsl for variadics', t => {
  const promises = []

  promises.push(Api.get().positional('<a> <b> <c..>').parse('one two three four').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.a, 'one')
    t.equal(result.argv.b, 'two')
    t.same(result.argv.c, ['three', 'four'])
    assertTypeDetails(t, result, 1, ['a'], 'string', 'one', 'positional', [0], ['one'])
    assertTypeDetails(t, result, 2, ['b'], 'string', 'two', 'positional', [1], ['two'])
    assertTypeDetails(t, result, 3, ['c'], 'array:string', ['three', 'four'], 'positional', [2, 3], ['three', 'four'])
  }))

  promises.push(Api.get().positional('<a> <b..> <c>').parse('one two three four').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.a, 'one')
    t.same(result.argv.b, ['two', 'three'])
    t.equal(result.argv.c, 'four')
    assertTypeDetails(t, result, 1, ['a'], 'string', 'one', 'positional', [0], ['one'])
    assertTypeDetails(t, result, 2, ['b'], 'array:string', ['two', 'three'], 'positional', [1, 2], ['two', 'three'])
    assertTypeDetails(t, result, 3, ['c'], 'string', 'four', 'positional', [3], ['four'])
  }))

  promises.push(Api.get().positional('<a..> <b..> <c>').parse('one two three four').then(result => {
    assertNoErrors(t, result)
    t.same(result.argv.a, ['one', 'two'])
    t.same(result.argv.b, ['three'])
    t.equal(result.argv.c, 'four')
    assertTypeDetails(t, result, 1, ['a'], 'array:string', ['one', 'two'], 'positional', [0, 1], ['one', 'two'])
    assertTypeDetails(t, result, 2, ['b'], 'array:string', ['three'], 'positional', [2], ['three'])
    assertTypeDetails(t, result, 3, ['c'], 'string', 'four', 'positional', [3], ['four'])
  }))

  return Promise.all(promises)
})

tap.test('positional > dsl for default value', t => {
  const api = Api.get().positional('[file=package.json] [port:number=8080] [svcs..=one,two]')
  return api.parse('').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.file, 'package.json')
    t.equal(result.argv.port, 8080)
    t.same(result.argv.svcs, ['one', 'two'])
    assertTypeDetails(t, result, 1, ['file'], 'file', 'package.json', 'default', [], [])
    assertTypeDetails(t, result, 2, ['port'], 'number', 8080, 'default', [], [])
    assertTypeDetails(t, result, 3, ['svcs'], 'array:string', ['one', 'two'], 'default', [], [])
    return api.parse('config.json 4000 all')
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.file, 'config.json')
    t.equal(result.argv.port, 4000)
    t.same(result.argv.svcs, ['all'])
    assertTypeDetails(t, result, 1, ['file'], 'file', 'config.json', 'positional', [0], ['config.json'])
    assertTypeDetails(t, result, 2, ['port'], 'number', 4000, 'positional', [1], ['4000'])
    assertTypeDetails(t, result, 3, ['svcs'], 'array:string', ['all'], 'positional', [2], ['all'])
  })
})

tap.test('positional > params as array', t => {
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
  t.equal(typeObjects[parent][1].helpDesc, 'The description for the optional second arg')
  t.equal(typeObjects[parent][1].helpGroup, 'Second argument:')
  t.equal(typeObjects[parent][1].helpHints, '[second]')
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

tap.test('positional > params as object', t => {
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
  t.equal(typeObjects[parent][1].helpDesc, 'The description for the optional second arg')
  t.equal(typeObjects[parent][1].helpGroup, 'Second argument:')
  t.equal(typeObjects[parent][1].helpHints, '[second]')
  // assert that the call to positional() didn't modify the objects given
  t.equal(Object.keys(params).length, 2)
  t.equal(Object.keys(params['one']).length, 3)
  t.equal(params['one'].desc, 'The description for the required first arg')
  t.equal(params['one'].group, 'First argument:')
  t.equal(params['one'].hints, '[first]')
  t.equal(Object.keys(params['two']).length, 3)
  t.equal(params['two'].desc, 'The description for the optional second arg')
  t.equal(params['two'].group, 'Second argument:')
  t.equal(params['two'].hints, '[second]')
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

tap.test('positional > ignore', t => {
  const opts = { ignore: '[options]' }
  return Api.get()
    .positional('<one> [options]', opts)
    .parse('uno dos').then(result => {
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
})
