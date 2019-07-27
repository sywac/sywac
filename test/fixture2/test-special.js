'use strict'

const tap = require('tap')
const Api = require('../../api')

tap.test('commandDirectory > supports no arg (directory of caller)', t => {
  return Api.get({ name: 'test' })
    .commandDirectory()
    .help()
    .outputSettings({ maxWidth: 50 })
    .parse('--help')
    .then(result => {
      t.equal(result.code, 0)
      t.equal(result.errors.length, 0)
      t.equal(result.output, [
        'Usage: test <command> <args> [options]',
        '',
        'Commands:',
        '  random [max=1] [min=0]  Get pseudo-random number',
        '',
        'Options:',
        '  --help  Show help     [commands: help] [boolean]'
      ].join('\n'))
    })
})

tap.test('commandDirectory > supports opts only', t => {
  return Api.get({ name: 'test' })
    .commandDirectory({ extensions: ['.cjs'] })
    .help()
    .outputSettings({ maxWidth: 50 })
    .parse('--help')
    .then(result => {
      t.equal(result.code, 0)
      t.equal(result.errors.length, 0)
      t.equal(result.output, [
        'Usage: test <command> [options]',
        '',
        'Commands:',
        '  module  A module with cjs file extension',
        '',
        'Options:',
        '  --help  Show help     [commands: help] [boolean]'
      ].join('\n'))
    })
})
