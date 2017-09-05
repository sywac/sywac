'use strict'

module.exports = {
  flags: 'command',
  desc: 'Attempts to (re)apply its own dir',
  setup: sywac => sywac.commandDirectory('../cyclic'),
  run: argv => {}
}
