'use strict'

exports.flags = 'two <subcommand>'
exports.ignore = '<subcommand>'
exports.desc = 'Level two command'
exports.setup = sywac => sywac.commandDirectory('level3')
