'use strict'

const chalk = require('chalk')

module.exports = {
  usageCommandPlaceholder: s => chalk.magenta(s),
  usagePositionals: s => chalk.yellow(s),
  usageArgsPlaceholder: s => chalk.yellow(s),
  usageOptionsPlaceholder: s => chalk.green(s),
  group: s => chalk.white(s),
  flags: (s, type) => {
    if (type.datatype === 'command') {
      s = s.split(' ')
      return chalk.magenta(s[0]) + (s[1] ? ' ' + chalk.yellow(s.slice(1).join(' ')) : '')
    }
    if (s.startsWith('<') || s.startsWith('[')) return chalk.yellow(s)
    return chalk.green(s)
  },
  desc: s => chalk.cyan(s),
  hints: s => chalk.dim(s),
  groupError: s => chalk.red(s),
  flagsError: s => chalk.red(s),
  descError: s => chalk.red(s),
  hintsError: s => chalk.red(s),
  messages: s => chalk.red(s)
}
