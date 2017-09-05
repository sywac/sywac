'use strict'

module.exports = {
  flags: 'one <subcommand>',
  ignore: '<subcommand>',
  desc: 'Level one command',
  setup: sywac => sywac.commandDirectory('level2')
}
