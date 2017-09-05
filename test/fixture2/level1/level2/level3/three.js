'use strict'

module.exports = {
  flags: 'three',
  desc: 'Level three command',
  run: argv => {
    argv.threeRun = true
  }
}
