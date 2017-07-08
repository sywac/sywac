'use strict'

module.exports = {
  flags: 'env',
  desc: 'Test ssh with remote env command',
  run: argv => {
    argv.envCalled = true
  }
}
