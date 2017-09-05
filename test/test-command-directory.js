'use strict'

const tap = require('tap')
const Api = require('../api')
const path = require('path')

tap.test('commandDirectory > supports multi-level', t => {
  const api = Api.get({ name: 'test' })
    .commandDirectory('fixture2/level1')
    .showHelpByDefault()
    .outputSettings({ maxWidth: 50 })

  const promises = []

  promises.push(api.parse('').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: test <command> <args>',
      '',
      'Commands:',
      '  one <subcommand>  Level one command',
      '  top               Top level command'
    ].join('\n'))
  }))

  promises.push(api.parse('one').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: test one <subcommand>',
      '',
      'Commands:',
      '  two <subcommand>  Level two command'
    ].join('\n'))
  }))

  promises.push(api.parse('one two').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: test one two <subcommand>',
      '',
      'Commands:',
      '  three  Level three command'
    ].join('\n'))
  }))

  promises.push(api.parse('one two three').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, '')
    t.equal(result.argv.threeRun, true)
  }))

  return Promise.all(promises)
})

tap.test('commandDirectory > supports absolute', t => {
  const absolutePath = path.join(__dirname, 'fixture2', 'level1')
  return Api.get({ name: 'test' })
    .commandDirectory(absolutePath)
    .showHelpByDefault()
    .outputSettings({ maxWidth: 50 })
    .parse('')
    .then(result => {
      t.equal(result.code, 0)
      t.equal(result.errors.length, 0)
      t.equal(result.output, [
        'Usage: test <command> <args>',
        '',
        'Commands:',
        '  one <subcommand>  Level one command',
        '  top               Top level command'
      ].join('\n'))
    })
})

tap.test('commandDirectory > detects and ignores cyclic reference', t => {
  const api = Api.get({ name: 'test' })
    .commandDirectory('fixture2/cyclic')
    .help()
    .outputSettings({ maxWidth: 50 })
  return api.parse('--help').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: test <command> [options]',
      '',
      'Commands:',
      '  command  Attempts to (re)apply its own dir',
      '',
      'Options:',
      '  --help  Show help     [commands: help] [boolean]'
    ].join('\n'))
    return api.parse('command --help')
  }).then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: test command [options]',
      '',
      'Options:',
      '  --help  Show help     [commands: help] [boolean]'
    ].join('\n'))
  })
})

tap.test('commandDirectory > throws on missing directory', t => {
  t.throws(() => {
    Api.get().commandDirectory('dne')
  })
  t.end()
})

tap.test('commandDirectory > throws on invalid require', t => {
  t.throws(() => {
    Api.get().commandDirectory('..', { extensions: ['.md'] })
  })
  t.end()
})

tap.test('commandDirectory > does not modify given opts', t => {
  const opts = { key: 'value' }
  Api.get().commandDirectory('./fixture2/level1', opts)
  t.equal(Object.keys(opts).length, 1)
  t.end()
})
