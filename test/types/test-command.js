'use strict'

const tap = require('tap')
const Api = require('../../api')
const Helper = require('../helper')

const parent = require('path').basename(__filename, '.js')
const helper = Helper.get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

tap.test('command > custom check handling at different levels')

tap.test('command > dsl string and run handler', async t => {
  let runCalled = 0
  let innerArgv
  const api = Api.get().command('do <it>', argv => {
    runCalled++
    innerArgv = argv
  })

  let result = await api.parse('do')
  t.equal(runCalled, 0) // does not execute handler on validation failure
  t.equal(innerArgv, undefined)
  t.equal(result.code, 1)
  t.match(result.output, /Missing required argument: it/)
  t.equal(result.errors.length, 0)

  result = await api.parse('do something')
  assertNoErrors(t, result)
  t.equal(runCalled, 1)
  t.equal(innerArgv.it, 'something')
  t.same(innerArgv._, [])
  t.equal(result.argv.it, 'something')
  t.same(result.argv._, [])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result, 1, ['do'], 'command', true, 'positional', [0], ['do'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'something', 'positional', [1], ['something'])
})

tap.test('command > dsl string and opts object', async t => {
  let setupCalled = 0
  let runCalled = 0
  let innerArgv
  const opts = {
    setup: api => ++setupCalled,
    run: argv => {
      runCalled++
      innerArgv = argv
    }
  }
  const api = Api.get().command('do <it>', opts)
  // assert that the call to command() didn't modify the objects given
  t.equal(Object.keys(opts).length, 2)
  t.equal(typeof opts.setup, 'function')
  t.equal(typeof opts.run, 'function')

  let result = await api.parse('do')
  t.equal(setupCalled, 1)
  t.equal(runCalled, 0)
  t.equal(innerArgv, undefined)
  t.equal(result.code, 1)
  t.match(result.output, /Missing required argument: it/)
  t.equal(result.errors.length, 0)

  result = await api.parse('do something')
  assertNoErrors(t, result)
  // each command setup should only be called once for a single api instance
  // since it is meant to add types, thus modifying the api's state
  // CONFIGURE ONCE, RUN INFINITY!
  t.equal(setupCalled, 1)
  t.equal(runCalled, 1)
  t.equal(innerArgv.it, 'something')
  t.same(innerArgv._, [])
  t.equal(result.argv.it, 'something')
  t.same(result.argv._, [])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result, 1, ['do'], 'command', true, 'positional', [0], ['do'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'something', 'positional', [1], ['something'])
})

tap.test('command > opts object (aka command module) with flags', async t => {
  let setupCalled = 0
  let runCalled = 0
  let innerArgv
  const module = {
    flags: 'do <it>',
    setup: api => ++setupCalled,
    run: argv => {
      runCalled++
      innerArgv = argv
    }
  }
  const api = Api.get().command(module)
  // assert that the call to command() didn't modify the objects given
  t.equal(Object.keys(module).length, 3)
  t.equal(module.flags, 'do <it>')
  t.equal(typeof module.setup, 'function')
  t.equal(typeof module.run, 'function')

  let result = await api.parse('do')
  t.equal(setupCalled, 1)
  t.equal(runCalled, 0)
  t.equal(innerArgv, undefined)
  t.equal(result.code, 1)
  t.match(result.output, /Missing required argument: it/)
  t.equal(result.errors.length, 0)

  result = await api.parse('do something')
  assertNoErrors(t, result)
  t.equal(setupCalled, 1)
  t.equal(runCalled, 1)
  t.equal(innerArgv.it, 'something')
  t.same(innerArgv._, [])
  t.equal(result.argv.it, 'something')
  t.same(result.argv._, [])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result, 1, ['do'], 'command', true, 'positional', [0], ['do'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'something', 'positional', [1], ['something'])
})

tap.test('command > opts object (aka command module) with flags as 2nd argument', async t => {
  let setupCalled = 0
  let runCalled = 0
  let innerArgv
  const module = {
    flags: 'do <it>',
    setup: api => ++setupCalled,
    run: argv => {
      runCalled++
      innerArgv = argv
    }
  }
  const api = Api.get().command(() => {}, module)
  // assert that the call to command() didn't modify the objects given
  t.equal(Object.keys(module).length, 3)
  t.equal(module.flags, 'do <it>')
  t.equal(typeof module.setup, 'function')
  t.equal(typeof module.run, 'function')

  let result = await api.parse('do')
  t.equal(setupCalled, 1)
  t.equal(runCalled, 0)
  t.equal(innerArgv, undefined)
  t.equal(result.code, 1)
  t.match(result.output, /Missing required argument: it/)
  t.equal(result.errors.length, 0)

  result = await api.parse('do something')
  assertNoErrors(t, result)
  t.equal(setupCalled, 1)
  t.equal(runCalled, 1)
  t.equal(innerArgv.it, 'something')
  t.same(innerArgv._, [])
  t.equal(result.argv.it, 'something')
  t.same(result.argv._, [])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result, 1, ['do'], 'command', true, 'positional', [0], ['do'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'something', 'positional', [1], ['something'])
})

tap.test('command > opts object (aka command module) with aliases', async t => {
  let setupCalled = 0
  let runCalled = 0
  let innerArgv
  const module = {
    aliases: 'do',
    params: [{ flags: '<it>' }],
    setup: api => ++setupCalled,
    run: argv => {
      runCalled++
      innerArgv = argv
    }
  }
  const api = Api.get().command(module)
  // assert that the call to command() didn't modify the objects given
  t.equal(Object.keys(module).length, 4)
  t.equal(module.aliases, 'do')
  t.equal(module.params.length, 1)
  t.equal(Object.keys(module.params[0]).length, 1)
  t.equal(module.params[0].flags, '<it>')
  t.equal(typeof module.setup, 'function')
  t.equal(typeof module.run, 'function')

  let result = await api.parse('do')
  t.equal(setupCalled, 1)
  t.equal(runCalled, 0)
  t.equal(innerArgv, undefined)
  t.equal(result.code, 1)
  t.match(result.output, /Missing required argument: it/)
  t.equal(result.errors.length, 0)

  result = await api.parse('do something')
  assertNoErrors(t, result)
  t.equal(setupCalled, 1)
  t.equal(runCalled, 1)
  t.equal(innerArgv.it, 'something')
  t.same(innerArgv._, [])
  t.equal(result.argv.it, 'something')
  t.same(result.argv._, [])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result, 1, ['do'], 'command', true, 'positional', [0], ['do'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'something', 'positional', [1], ['something'])
})

tap.test('command > opts object (aka command module) with paramsDsl', async t => {
  let setupCalled = 0
  let runCalled = 0
  let innerArgv
  const module = {
    aliases: ['do'],
    paramsDsl: '<it>',
    setup: api => ++setupCalled,
    run: argv => {
      runCalled++
      innerArgv = argv
    }
  }
  const api = Api.get().command(module)
  // assert that the call to command() didn't modify the objects given
  t.equal(Object.keys(module).length, 4)
  t.same(module.aliases, ['do'])
  t.equal(module.paramsDsl, '<it>')
  t.equal(typeof module.setup, 'function')
  t.equal(typeof module.run, 'function')

  let result = await api.parse('do')
  t.equal(setupCalled, 1)
  t.equal(runCalled, 0)
  t.equal(innerArgv, undefined)
  t.equal(result.code, 1)
  t.match(result.output, /Missing required argument: it/)
  t.equal(result.errors.length, 0)

  result = await api.parse('do something')
  assertNoErrors(t, result)
  t.equal(setupCalled, 1)
  t.equal(runCalled, 1)
  t.equal(innerArgv.it, 'something')
  t.same(innerArgv._, [])
  t.equal(result.argv.it, 'something')
  t.same(result.argv._, [])
  assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result, 1, ['do'], 'command', true, 'positional', [0], ['do'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'something', 'positional', [1], ['something'])
})

tap.test('command > subcommands with dynamic usage', async t => {
  const api = Api.get()
    .configure({ name: 'nug' })
    .showHelpByDefault()
    .command('remote <subcommand>', {
      ignore: '<subcommand>',
      desc: 'Work with remotes',
      setup: sywac => sywac
        .command('add <name> <url>', {
          desc: 'Add a remote',
          paramsDesc: ['The name of the new remote', 'The url of the new remote'],
          run: argv => t.fail('Should not run "remote add" command')
        })
        .command('prune <name>', {
          desc: 'Delete stale branches from the remote',
          paramsDesc: 'The name of the remote',
          run: argv => t.fail('Should not run "remote prune" command')
        })
        .command('list', {
          aliases: '*',
          desc: 'Show existing remotes',
          setup: sywac => sywac.boolean('-v, --verbose', { desc: 'Include urls' }),
          run: argv => t.fail('Should not run "remote list" command')
        })
    })
    .command('stash', {
      desc: 'Stash away changes in dirty working directory',
      setup: sywac => sywac
        .command('list', {
          desc: 'List saved stashes',
          run: argv => t.fail('Should not run "stash list" command')
        })
        .command('show [stash]', {
          description: 'Show stored changes',
          paramsDescription: 'The id of the stash to show',
          run: argv => t.fail('Should not run "stash show" command')
        })
        .command('save [msg]', {
          desc: 'Store changes as a new stash',
          paramsDesc: 'An optional message to describe the stash',
          setup: sywac => sywac.boolean('-u, --untracked', { desc: 'Include untracked changes' }),
          run: argv => t.fail('Should not run "stash save" command')
        })
    })
    .help()
    .outputSettings({ maxWidth: 70 })

  const [result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11] = await Promise.all([
    api.parse(''),
    api.parse('help remote'),
    api.parse('help remote add'),
    api.parse('remote --help add'),
    api.parse('remote prune --help'),
    api.parse('--help remote list'),
    api.parse('stash'),
    api.parse('help stash list'),
    api.parse('stash --help show'),
    api.parse('stash save --help'),
    api.parse('help stash')
  ])

  t.equal(result1.code, 0)
  t.equal(result1.errors.length, 0)
  t.equal(result1.output, [
    'Usage: nug <command> <args> [options]',
    '',
    'Commands:',
    '  remote <subcommand>  Work with remotes',
    '  stash                Stash away changes in dirty working directory',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result2.code, 0)
  t.equal(result2.errors.length, 0)
  t.equal(result2.output, [
    'Usage: nug remote <subcommand> [options]',
    '',
    'Commands:',
    '  add <name> <url>  Add a remote',
    '  prune <name>      Delete stale branches from the remote',
    '  list              Show existing remotes                    [default]',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result3.code, 0)
  t.equal(result3.errors.length, 0)
  t.equal(result3.output, [
    'Usage: nug remote add <name> <url> [options]',
    '',
    'Arguments:',
    '  <name>  The name of the new remote               [required] [string]',
    '  <url>   The url of the new remote                [required] [string]',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result4.code, 0)
  t.equal(result4.errors.length, 0)
  t.equal(result4.output, [
    'Usage: nug remote add <name> <url> [options]',
    '',
    'Arguments:',
    '  <name>  The name of the new remote               [required] [string]',
    '  <url>   The url of the new remote                [required] [string]',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result5.code, 0)
  t.equal(result5.errors.length, 0)
  t.equal(result5.output, [
    'Usage: nug remote prune <name> [options]',
    '',
    'Arguments:',
    '  <name>  The name of the remote                   [required] [string]',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result6.code, 0)
  t.equal(result6.errors.length, 0)
  t.equal(result6.output, [
    'Usage: nug remote list [options]',
    '',
    'Options:',
    '  -v, --verbose  Include urls                                [boolean]',
    '  --help         Show help                  [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result7.code, 0)
  t.equal(result7.errors.length, 0)
  t.equal(result7.output, [
    'Usage: nug stash <command> <args> [options]',
    '',
    'Commands:',
    '  list          List saved stashes',
    '  show [stash]  Show stored changes',
    '  save [msg]    Store changes as a new stash',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result8.code, 0)
  t.equal(result8.errors.length, 0)
  t.equal(result8.output, [
    'Usage: nug stash list [options]',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result9.code, 0)
  t.equal(result9.errors.length, 0)
  t.equal(result9.output, [
    'Usage: nug stash show [stash] [options]',
    '',
    'Arguments:',
    '  [stash]  The id of the stash to show                        [string]',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result10.code, 0)
  t.equal(result10.errors.length, 0)
  t.equal(result10.output, [
    'Usage: nug stash save [msg] [options]',
    '',
    'Arguments:',
    '  [msg]  An optional message to describe the stash            [string]',
    '',
    'Options:',
    '  -u, --untracked  Include untracked changes                 [boolean]',
    '  --help           Show help                [commands: help] [boolean]'
  ].join('\n'))

  t.equal(result11.code, 0)
  t.equal(result11.errors.length, 0)
  t.equal(result11.output, [
    'Usage: nug stash <command> <args> [options]',
    '',
    'Commands:',
    '  list          List saved stashes',
    '  show [stash]  Show stored changes',
    '  save [msg]    Store changes as a new stash',
    '',
    'Options:',
    '  --help  Show help                         [commands: help] [boolean]'
  ].join('\n'))
})

tap.test('command > supports aliases', async t => {
  let setupCalled = 0
  let runCalled = 0
  const opts = {
    aliases: ['gopher', 'punch', 'hit'],
    setup: api => ++setupCalled,
    run: argv => ++runCalled
  }
  const api = Api.get().command('do <it>', opts)
  t.equal(Object.keys(opts).length, 3)
  t.same(opts.aliases, ['gopher', 'punch', 'hit'])
  t.equal(typeof opts.setup, 'function')
  t.equal(typeof opts.run, 'function')

  const [result1, result2, result3, result4] = await Promise.all([
    api.parse('do something'),
    api.parse('gopher it'),
    api.parse('punch dat'),
    api.parse('hit up')
  ])

  assertNoErrors(t, result1)
  t.equal(result1.argv.it, 'something')
  t.same(result1.argv._, [])
  assertTypeDetails(t, result1, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result1, 1, ['do', 'gopher', 'punch', 'hit'], 'command', true, 'positional', [0], ['do'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result1, 2, ['it'], 'string', 'something', 'positional', [1], ['something'])

  assertNoErrors(t, result2)
  t.equal(result2.argv.it, 'it')
  t.same(result2.argv._, [])
  assertTypeDetails(t, result2, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result2, 1, ['do', 'gopher', 'punch', 'hit'], 'command', true, 'positional', [0], ['gopher'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result2, 2, ['it'], 'string', 'it', 'positional', [1], ['it'])

  assertNoErrors(t, result3)
  t.equal(result3.argv.it, 'dat')
  t.same(result3.argv._, [])
  assertTypeDetails(t, result3, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result3, 1, ['do', 'gopher', 'punch', 'hit'], 'command', true, 'positional', [0], ['punch'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result3, 2, ['it'], 'string', 'dat', 'positional', [1], ['dat'])

  assertNoErrors(t, result4)
  t.equal(result4.argv.it, 'up')
  t.same(result4.argv._, [])
  assertTypeDetails(t, result4, 0, ['_'], 'array:string', [], 'default', [], [])
  assertTypeDetails(t, result4, 1, ['do', 'gopher', 'punch', 'hit'], 'command', true, 'positional', [0], ['hit'])
  Helper.get(`${parent} do`).assertTypeDetails(t, result4, 2, ['it'], 'string', 'up', 'positional', [1], ['up'])

  t.equal(setupCalled, 1)
  t.equal(runCalled, 4)
})

tap.test('command > default command with other alias', async t => {
  let runCalled = 0
  let innerArgv
  const api = Api.get()
    .command('notrun', argv => t.fail('This should not run'))
    .command('one', {
      aliases: '*',
      run: argv => {
        innerArgv = argv
        runCalled++
      }
    })

  let result = await api.parse('')
  assertNoErrors(t, result)
  t.equal(runCalled, 1)
  t.same(innerArgv && innerArgv._, [])

  result = await api.parse('one -x y -b')
  assertNoErrors(t, result)
  t.equal(runCalled, 2)
  t.same(innerArgv && innerArgv._, [])
  t.equal(innerArgv && innerArgv.x, 'y')
  t.equal(innerArgv && innerArgv.b, true)
})

tap.test('command > default command with no alias', async t => {
  let runCalled = 0
  let innerArgv
  const api = Api.get()
    .command('notrun', argv => t.fail('This should not run'))
    .command('*', argv => {
      innerArgv = argv
      runCalled++
    })

  let result = await api.parse('')
  assertNoErrors(t, result)
  t.equal(runCalled, 1)
  t.same(innerArgv && innerArgv._, [])

  result = await api.parse('one -x y -b')
  assertNoErrors(t, result)
  t.equal(runCalled, 2)
  t.same(innerArgv && innerArgv._, ['one'])
  t.equal(innerArgv && innerArgv.x, 'y')
  t.equal(innerArgv && innerArgv.b, true)
})

tap.test('command > run handler > adding cli message affects result', async t => {
  const result = await Api.get()
    .command('fail', (argv, context) => {
      context.cliMessage('You broke it')
    })
    .parse('fail')
  t.equal(result.code, 1)
  t.equal(result.output, [
    'Usage: test-command fail',
    '',
    'You broke it'
  ].join('\n'))
  t.equal(result.errors.length, 0)
})

tap.test('command > run handler > throwing error affects result', async t => {
  const result = await Api.get()
    .command('throw', argv => {
      throw new Error('Thrown')
    })
    .parse('throw')
  t.equal(result.code, 1)
  t.match(result.output, /Thrown/)
  t.equal(result.errors.length, 1)
})

tap.test('command > run handler > rejecting promise affects result', async t => {
  const result = await Api.get()
    .command('reject', argv => Promise.reject(new Error('Rejected')))
    .parse('reject')
  t.equal(result.code, 1)
  t.match(result.output, /Rejected/)
  t.equal(result.errors.length, 1)
})

tap.test('command > run handler > result not returned until handler resolves', async t => {
  let done = false
  await Api.get().command('wait [ms:number=1000]', argv => {
    t.equal(argv.ms, 1000)
    return new Promise(resolve => {
      setTimeout(() => {
        done = true
        resolve()
      }, argv.ms)
    })
  }).parse('wait')
  t.equal(done, true)
})
