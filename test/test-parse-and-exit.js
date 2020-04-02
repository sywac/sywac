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

tap.test('parseAndExit > help', async t => {
  const promises = []

  promises.push(exec('--help'))
  promises.push(exec('help'))
  promises.push(exec(''))
  promises.push(exec('help build'))
  promises.push(exec('build -h'))
  promises.push(exec('--help build'))

  const [io1, io2, io3, io4, io5, io6] = await Promise.all(promises)

  t.notOk(io1.error)
  t.notOk(io1.stderr)
  let lines = io1.stdout.split('\n')
  lines.forEach((line, index) => {
    t.equal(line, topLevelHelp[index])
  })

  t.notOk(io2.error)
  t.notOk(io2.stderr)
  lines = io2.stdout.split('\n')
  lines.forEach((line, index) => {
    t.equal(line, topLevelHelp[index])
  })

  t.notOk(io3.error)
  t.notOk(io3.stderr)
  lines = io3.stdout.split('\n')
  lines.forEach((line, index) => {
    t.equal(line, topLevelHelp[index])
  })

  t.notOk(io4.error)
  t.notOk(io4.stderr)
  lines = io4.stdout.split('\n')
  lines.forEach((line, index) => {
    t.equal(line, buildCommandHelp[index])
  })

  t.notOk(io5.error)
  t.notOk(io5.stderr)
  lines = io5.stdout.split('\n')
  lines.forEach((line, index) => {
    t.equal(line, buildCommandHelp[index])
  })

  t.notOk(io6.error)
  t.notOk(io6.stderr)
  lines = io6.stdout.split('\n')
  lines.forEach((line, index) => {
    t.equal(line, buildCommandHelp[index])
  })
})

tap.test('parseAndExit > version', async t => {
  const promises = []

  promises.push(exec('version'))
  promises.push(exec('-v'))
  promises.push(exec('build --version'))

  const [io1, io2, io3] = await Promise.all(promises)

  t.notOk(io1.error)
  t.notOk(io1.stderr)
  t.same(io1.stdout.trim(), '2.3.4')

  t.notOk(io2.error)
  t.notOk(io2.stderr)
  t.same(io2.stdout.trim(), '2.3.4')

  t.notOk(io3.error)
  t.notOk(io3.stderr)
  t.same(io3.stdout.trim(), '2.3.4')
})

tap.test('parseAndExit > validation failure', async t => {
  const promises = []

  promises.push(exec('build'))
  promises.push(exec('build web docs -b master'))

  const [io1, io2] = await Promise.all(promises)

  t.ok(io1.error)
  t.same(io1.error.code, 2)
  t.notOk(io1.stdout)
  let expected = buildCommandHelp.slice()
  expected[2] = chalk.red('Build Arguments:')
  expected[3] = '  ' + chalk.red('<services..>') + '        ' + chalk.red('One or more services to build')
  expected[4] = '                      ' + chalk.red('[required] [array:enum] [web, api, db]')
  expected[9] = chalk.red('Repo Options:')
  expected[10] = '  ' + chalk.red('-b, -branch <branch>') + '  ' + chalk.red('The branch to pull') + '                             ' + chalk.red('[required] [string]')
  expected.push(chalk.red('Missing required argument: b or branch'))
  expected.push(chalk.red('Missing required argument: services'))
  expected.push('')
  let lines = io1.stderr.split('\n')
  lines.forEach((line, index) => {
    t.equal(line, expected[index])
  })

  t.ok(io2.error)
  t.same(io2.error.code, 1)
  t.notOk(io2.stdout)
  expected = buildCommandHelp.slice()
  expected[2] = chalk.red('Build Arguments:')
  expected[3] = '  ' + chalk.red('<services..>') + '        ' + chalk.red('One or more services to build')
  expected[4] = '                      ' + chalk.red('[required] [array:enum] [web, api, db]')
  expected.push(chalk.red('Value "web,docs" is invalid for argument services. Choices are: web, api, db'))
  expected.push('')
  lines = io2.stderr.split('\n')
  lines.forEach((line, index) => {
    t.equal(line, expected[index])
  })
})

tap.test('parseAndExit > unexpected error', async t => {
  const io = await exec('release')
  t.ok(io.error)
  t.same(io.error.code, 1)
  t.notOk(io.stdout)
  t.match(io.stderr, /This is an unexpected error/)
})

tap.test('parseAndExit > success', async t => {
  const promises = []

  promises.push(exec('env'))
  promises.push(exec('build -b master db api --tag 1.0.0 latest'))
  promises.push(exec('-b master build db api -t=1.0.0,latest -- x'))

  const [io1, io2, io3] = await Promise.all(promises)

  t.notOk(io1.error)
  t.notOk(io1.stderr)
  let argv = JSON.parse(io1.stdout)
  t.equal(argv.envCalled, true)

  t.notOk(io2.error)
  t.notOk(io2.stderr)
  argv = JSON.parse(io2.stdout)
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

  t.notOk(io3.error)
  t.notOk(io3.stderr)
  argv = JSON.parse(io3.stdout)
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
})
