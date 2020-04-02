#!/usr/bin/env node
'use strict'

const chalk = require('chalk')
const sywac = require('../../index')

sywac
  // commands
  .command(require('./cmds/env'))
  .command(require('./cmds/build'))
  .command(require('./cmds/release'))
  .showHelpByDefault()

  // global options
  .string('-r, --remote <host>', {
    group: 'SSH Options:',
    desc: 'Remote host to ssh into',
    defaultValue: 'localhost'
  })
  .string('-u, --user <name>', {
    group: 'SSH Options:',
    desc: 'User on remote host for ssh',
    defaultValue: 'admin'
  })
  .file('-i, --identity <key>', {
    group: 'SSH Options:',
    desc: 'Private key file for ssh',
    defaultValue: '~/.ssh/id_rsa'
  })
  .help('-h, --help', {
    group: 'Global Options:',
    description: 'Display help text and exit'
  })
  .version('-v, --version', {
    group: 'Global Options:',
    description: 'Display app version number and exit'
  })

  // help text stuff
  .style(require('./styles'))
  .usage({ prefix: chalk`{white Usage:} {magenta $0}` })
  .outputSettings({ maxWidth: 90 })

async function main () {
  // only prints argv if a command handler was run
  const argv = await sywac.parseAndExit()
  console.log(JSON.stringify(argv, null, 2))
}

main()
