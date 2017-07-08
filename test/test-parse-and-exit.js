'use strict'

const tap = require('tap')
const cp = require('child_process')
const path = require('path')
const chalk = require('chalk')

const topLevelHelp = [
  chalk`{white Usage:} {magenta ndb}` + ' ' + chalk.magenta('<command>') + ' ' + chalk.yellow('<args>') + ' ' + chalk.green('[options]'),
  '',
  chalk.white('Commands:'),
  '  ' + chalk.magenta('env') + '                 ' + chalk.cyan('Test ssh with remote env command'),
  '  ' + chalk.magenta('build') + ' ' + chalk.yellow('<services..>') + '  ' + chalk.cyan('Pull branch and build/push images'),
  '  ' + chalk.magenta('release') + '             ' + chalk.cyan('Publish built images for release'),
  '',
  chalk.white('SSH Options:'),
  '  ' + chalk.green('-r, --remote <host>') + '   ' + chalk.cyan('Remote host to ssh into') + '              ' + chalk.dim('[string] [default: localhost]'),
  '  ' + chalk.green('-u, --user <name>') + '     ' + chalk.cyan('User on remote host for ssh') + '              ' + chalk.dim('[string] [default: admin]'),
  '  ' + chalk.green('-i, --identity <key>') + '  ' + chalk.cyan('Private key file for ssh') + '           ' + chalk.dim('[file] [default: ~/.ssh/id_rsa]'),
  '',
  chalk.white('Global Options:'),
  '  ' + chalk.green('-h, --help') + '     ' + chalk.cyan('Display help text and exit') + '                     ' + chalk.dim('[commands: help] [boolean]'),
  '  ' + chalk.green('-v, --version') + '  ' + chalk.cyan('Display app version number and exit') + '         ' + chalk.dim('[commands: version] [boolean]'),
  ''
]

const buildCommandHelp = [
  chalk`{white Usage:} {magenta ndb build}` + ' ' + chalk.yellow('<services..>') + ' ' + chalk.green('[options]'),
  '',
  chalk.white('Build Arguments:'),
  '  ' + chalk.yellow('<services..>') + '        ' + chalk.cyan('One or more services to build'),
  '                      ' + chalk.dim('[required] [array:enum] [web, api, db]'),
  '',
  '  ' + chalk.green('-t, --tag <tags..>') + '  ' + chalk.cyan('One or more tags to determine where images should be pushed'),
  '                      ' + chalk.dim('[array:string]'),
  '',
  chalk.white('Repo Options:'),
  '  ' + chalk.green('-b, -branch <branch>') + '  ' + chalk.cyan('The branch to pull') + '                             ' + chalk.dim('[required] [string]'),
  '  ' + chalk.green('-p, --path <path>') + '     ' + chalk.cyan('Path to repo on remote host') + '            ' + chalk.dim('[path] [default: /opt/repo]'),
  '',
  chalk.white('SSH Options:'),
  '  ' + chalk.green('-r, --remote <host>') + '   ' + chalk.cyan('Remote host to ssh into') + '              ' + chalk.dim('[string] [default: localhost]'),
  '  ' + chalk.green('-u, --user <name>') + '     ' + chalk.cyan('User on remote host for ssh') + '              ' + chalk.dim('[string] [default: admin]'),
  '  ' + chalk.green('-i, --identity <key>') + '  ' + chalk.cyan('Private key file for ssh') + '           ' + chalk.dim('[file] [default: ~/.ssh/id_rsa]'),
  '',
  chalk.white('Global Options:'),
  '  ' + chalk.green('-h, --help') + '     ' + chalk.cyan('Display help text and exit') + '                     ' + chalk.dim('[commands: help] [boolean]'),
  '  ' + chalk.green('-v, --version') + '  ' + chalk.cyan('Display app version number and exit') + '         ' + chalk.dim('[commands: version] [boolean]'),
  ''
]

function exec (args) {
  return new Promise(resolve => {
    cp.execFile(
      path.resolve(__dirname, 'fixture', 'ndb.js'),
      args.split(' '),
      { env: Object.assign({}, process.env, { FORCE_COLOR: '1' }) },
      (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      }
    )
  })
}

tap.test('parseAndExit > help', t => {
  const promises = []

  promises.push(exec('--help').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const lines = io.stdout.split('\n')
    lines.forEach((line, index) => {
      t.equal(line, topLevelHelp[index])
    })
  }))

  promises.push(exec('help').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const lines = io.stdout.split('\n')
    lines.forEach((line, index) => {
      t.equal(line, topLevelHelp[index])
    })
  }))

  promises.push(exec('').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const lines = io.stdout.split('\n')
    lines.forEach((line, index) => {
      t.equal(line, topLevelHelp[index])
    })
  }))

  promises.push(exec('help build').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const lines = io.stdout.split('\n')
    lines.forEach((line, index) => {
      t.equal(line, buildCommandHelp[index])
    })
  }))

  promises.push(exec('build -h').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const lines = io.stdout.split('\n')
    lines.forEach((line, index) => {
      t.equal(line, buildCommandHelp[index])
    })
  }))

  promises.push(exec('--help build').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const lines = io.stdout.split('\n')
    lines.forEach((line, index) => {
      t.equal(line, buildCommandHelp[index])
    })
  }))

  return Promise.all(promises)
})

tap.test('parseAndExit > version', t => {
  const promises = []

  promises.push(exec('version').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    t.same(io.stdout.trim(), '2.3.4')
  }))

  promises.push(exec('-v').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    t.same(io.stdout.trim(), '2.3.4')
  }))

  promises.push(exec('build --version').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    t.same(io.stdout.trim(), '2.3.4')
  }))

  return Promise.all(promises)
})

tap.test('parseAndExit > validation failure', t => {
  const promises = []

  promises.push(exec('build').then(io => {
    t.ok(io.error)
    t.same(io.error.code, 2)
    t.notOk(io.stderr)
    const expected = buildCommandHelp.slice()
    expected[2] = chalk.red('Build Arguments:')
    expected[3] = '  ' + chalk.red('<services..>') + '        ' + chalk.red('One or more services to build')
    expected[4] = '                      ' + chalk.red('[required] [array:enum] [web, api, db]')
    expected[9] = chalk.red('Repo Options:')
    expected[10] = '  ' + chalk.red('-b, -branch <branch>') + '  ' + chalk.red('The branch to pull') + '                             ' + chalk.red('[required] [string]')
    expected.push(chalk.red('Missing required argument: b or branch'))
    expected.push(chalk.red('Missing required argument: services'))
    expected.push('')
    const lines = io.stdout.split('\n')
    lines.forEach((line, index) => {
      t.equal(line, expected[index])
    })
  }))

  promises.push(exec('build web docs -b master').then(io => {
    t.ok(io.error)
    t.same(io.error.code, 1)
    t.notOk(io.stderr)
    const expected = buildCommandHelp.slice()
    expected[2] = chalk.red('Build Arguments:')
    expected[3] = '  ' + chalk.red('<services..>') + '        ' + chalk.red('One or more services to build')
    expected[4] = '                      ' + chalk.red('[required] [array:enum] [web, api, db]')
    expected.push(chalk.red('Value "web,docs" is invalid for argument services. Choices are: web, api, db'))
    expected.push('')
    const lines = io.stdout.split('\n')
    lines.forEach((line, index) => {
      t.equal(line, expected[index])
    })
  }))

  return Promise.all(promises)
})

tap.test('parseAndExit > unexpected error', t => {
  return exec('release').then(io => {
    t.ok(io.error)
    t.same(io.error.code, 1)
    t.notOk(io.stderr)
    t.match(io.stdout, /This is an unexpected error/)
  })
})

tap.test('parseAndExit > success', t => {
  const promises = []

  promises.push(exec('env').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const argv = JSON.parse(io.stdout)
    t.equal(argv.envCalled, true)
  }))

  promises.push(exec('build -b master db api --tag 1.0.0 latest').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const argv = JSON.parse(io.stdout)
    t.equal(argv.buildCalled, true)
    t.same(argv.services, ['db', 'api'])
    t.equal(argv.b, 'master')
    t.equal(argv.branch, 'master')
    t.same(argv._, [])
    t.same(argv.t, ['1.0.0', 'latest'])
    t.same(argv.tag, ['1.0.0', 'latest'])
    t.equal(argv.r, 'localhost')
    t.equal(argv.remote, 'localhost')
    t.equal(argv.p, '/opt/repo')
    t.equal(argv.path, '/opt/repo')
    t.equal(argv.u, 'admin')
    t.equal(argv.user, 'admin')
    t.equal(argv.i, '~/.ssh/id_rsa')
    t.equal(argv.identity, '~/.ssh/id_rsa')
  }))

  promises.push(exec('-b master build db api -t=1.0.0,latest -- x').then(io => {
    t.notOk(io.error)
    t.notOk(io.stderr)
    const argv = JSON.parse(io.stdout)
    t.equal(argv.buildCalled, true)
    t.same(argv.services, ['db', 'api'])
    t.equal(argv.b, 'master')
    t.equal(argv.branch, 'master')
    t.same(argv._, ['--', 'x'])
    t.same(argv.t, ['1.0.0', 'latest'])
    t.same(argv.tag, ['1.0.0', 'latest'])
    t.equal(argv.r, 'localhost')
    t.equal(argv.remote, 'localhost')
    t.equal(argv.p, '/opt/repo')
    t.equal(argv.path, '/opt/repo')
    t.equal(argv.u, 'admin')
    t.equal(argv.user, 'admin')
    t.equal(argv.i, '~/.ssh/id_rsa')
    t.equal(argv.identity, '~/.ssh/id_rsa')
  }))

  return Promise.all(promises)
})
