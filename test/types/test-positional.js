'use strict'

const tap = require('tap')
const Api = require('../../api')

const helper = require('../helper').get('test-positional')
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

tap.test('positional > dsl for type')
tap.test('positional > dsl supports custom type/factory')
tap.test('positional > dsl for variadics')
tap.test('positional > variadics driven by type')
tap.test('positional > dsl for default value')
tap.test('positional > params as array')
tap.test('positional > params as object')
tap.test('positional > paramsDescription || paramsDesc')
tap.test('positional > paramsGroup')
tap.test('positional > ignore')
