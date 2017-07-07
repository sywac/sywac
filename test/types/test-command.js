'use strict'

const tap = require('tap')
const Api = require('../../api')
const Helper = require('../helper')

const parent = require('path').basename(__filename, '.js')
const helper = Helper.get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

tap.test('command > dsl string and run handler', t => {
  let runCalled = 0
  let innerArgv
  const api = Api.get().command('do <it>', argv => {
    runCalled++
    innerArgv = argv
  })
  return api.parse('do').then(result => {
    t.equal(runCalled, 0) // does not execute handler on validation failure
    t.equal(innerArgv, undefined)
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: it/)
    t.equal(result.errors.length, 0)
    return api.parse('do something')
  }).then(result => {
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
})

tap.test('command > dsl string and opts object', t => {
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
  return api.parse('do').then(result => {
    t.equal(setupCalled, 1)
    t.equal(runCalled, 0)
    t.equal(innerArgv, undefined)
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: it/)
    t.equal(result.errors.length, 0)
    return api.parse('do something')
  }).then(result => {
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
})

tap.test('command > opts object (aka command module) with flags', t => {
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
  return api.parse('do').then(result => {
    t.equal(setupCalled, 1)
    t.equal(runCalled, 0)
    t.equal(innerArgv, undefined)
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: it/)
    t.equal(result.errors.length, 0)
    return api.parse('do something')
  }).then(result => {
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
})

tap.test('command > opts object (aka command module) with aliases', t => {
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
  return api.parse('do').then(result => {
    t.equal(setupCalled, 1)
    t.equal(runCalled, 0)
    t.equal(innerArgv, undefined)
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: it/)
    t.equal(result.errors.length, 0)
    return api.parse('do something')
  }).then(result => {
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
})

tap.test('command > opts object (aka command module) with paramsDsl', t => {
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
  return api.parse('do').then(result => {
    t.equal(setupCalled, 1)
    t.equal(runCalled, 0)
    t.equal(innerArgv, undefined)
    t.equal(result.code, 1)
    t.match(result.output, /Missing required argument: it/)
    t.equal(result.errors.length, 0)
    return api.parse('do something')
  }).then(result => {
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
})

tap.test('command > subcommands with dynamic usage', t => {
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

  const promises = []

  promises.push(api.parse('').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: nug <command> <args> [options]',
      '',
      'Commands:',
      '  remote <subcommand>  Work with remotes',
      '  stash                Stash away changes in dirty working directory',
      '',
      'Options:',
      '  --help  Show help                         [commands: help] [boolean]'
    ].join('\n'))
  }))

  promises.push(api.parse('help remote').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
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
  }))

  promises.push(api.parse('help remote add').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: nug remote add <name> <url> [options]',
      '',
      'Arguments:',
      '  <name>  The name of the new remote               [required] [string]',
      '  <url>   The url of the new remote                [required] [string]',
      '',
      'Options:',
      '  --help  Show help                         [commands: help] [boolean]'
    ].join('\n'))
  }))

  promises.push(api.parse('remote --help add').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: nug remote add <name> <url> [options]',
      '',
      'Arguments:',
      '  <name>  The name of the new remote               [required] [string]',
      '  <url>   The url of the new remote                [required] [string]',
      '',
      'Options:',
      '  --help  Show help                         [commands: help] [boolean]'
    ].join('\n'))
  }))

  promises.push(api.parse('remote prune --help').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: nug remote prune <name> [options]',
      '',
      'Arguments:',
      '  <name>  The name of the remote                   [required] [string]',
      '',
      'Options:',
      '  --help  Show help                         [commands: help] [boolean]'
    ].join('\n'))
  }))

  promises.push(api.parse('--help remote list').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: nug remote list [options]',
      '',
      'Options:',
      '  -v, --verbose  Include urls                                [boolean]',
      '  --help         Show help                  [commands: help] [boolean]'
    ].join('\n'))
  }))

  promises.push(api.parse('stash').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
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
  }))

  promises.push(api.parse('help stash list').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: nug stash list [options]',
      '',
      'Options:',
      '  --help  Show help                         [commands: help] [boolean]'
    ].join('\n'))
  }))

  promises.push(api.parse('stash --help show').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: nug stash show [stash] [options]',
      '',
      'Arguments:',
      '  [stash]  The id of the stash to show                        [string]',
      '',
      'Options:',
      '  --help  Show help                         [commands: help] [boolean]'
    ].join('\n'))
  }))

  promises.push(api.parse('stash save --help').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
      'Usage: nug stash save [msg] [options]',
      '',
      'Arguments:',
      '  [msg]  An optional message to describe the stash            [string]',
      '',
      'Options:',
      '  -u, --untracked  Include untracked changes                 [boolean]',
      '  --help           Show help                [commands: help] [boolean]'
    ].join('\n'))
  }))

  promises.push(api.parse('help stash').then(result => {
    t.equal(result.code, 0)
    t.equal(result.errors.length, 0)
    t.equal(result.output, [
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
  }))

  return Promise.all(promises)
})

tap.test('command > supports aliases', t => {
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
  const promises = []
  promises.push(api.parse('do something').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.it, 'something')
    t.same(result.argv._, [])
    assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
    assertTypeDetails(t, result, 1, ['do', 'gopher', 'punch', 'hit'], 'command', true, 'positional', [0], ['do'])
    Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'something', 'positional', [1], ['something'])
  }))
  promises.push(api.parse('gopher it').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.it, 'it')
    t.same(result.argv._, [])
    assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
    assertTypeDetails(t, result, 1, ['do', 'gopher', 'punch', 'hit'], 'command', true, 'positional', [0], ['gopher'])
    Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'it', 'positional', [1], ['it'])
  }))
  promises.push(api.parse('punch dat').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.it, 'dat')
    t.same(result.argv._, [])
    assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
    assertTypeDetails(t, result, 1, ['do', 'gopher', 'punch', 'hit'], 'command', true, 'positional', [0], ['punch'])
    Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'dat', 'positional', [1], ['dat'])
  }))
  promises.push(api.parse('hit up').then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.it, 'up')
    t.same(result.argv._, [])
    assertTypeDetails(t, result, 0, ['_'], 'array:string', [], 'default', [], [])
    assertTypeDetails(t, result, 1, ['do', 'gopher', 'punch', 'hit'], 'command', true, 'positional', [0], ['hit'])
    Helper.get(`${parent} do`).assertTypeDetails(t, result, 2, ['it'], 'string', 'up', 'positional', [1], ['up'])
  }))
  return Promise.all(promises).then(whenDone => {
    t.equal(setupCalled, 1)
    t.equal(runCalled, 4)
  })
})

tap.test('command > default command with other alias', t => {
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
  return api.parse('').then(result => {
    assertNoErrors(t, result)
    t.equal(runCalled, 1)
    t.same(innerArgv && innerArgv._, [])
    return api.parse('one -x y -b')
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(runCalled, 2)
    t.same(innerArgv && innerArgv._, [])
    t.equal(innerArgv && innerArgv.x, 'y')
    t.equal(innerArgv && innerArgv.b, true)
  })
})

tap.test('command > default command with no alias', t => {
  let runCalled = 0
  let innerArgv
  const api = Api.get()
    .command('notrun', argv => t.fail('This should not run'))
    .command('*', argv => {
      innerArgv = argv
      runCalled++
    })
  return api.parse('').then(result => {
    assertNoErrors(t, result)
    t.equal(runCalled, 1)
    t.same(innerArgv && innerArgv._, [])
    return api.parse('one -x y -b')
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(runCalled, 2)
    t.same(innerArgv && innerArgv._, ['one'])
    t.equal(innerArgv && innerArgv.x, 'y')
    t.equal(innerArgv && innerArgv.b, true)
  })
})

tap.test('command > run handler > adding cli message affects result', t => {
  return Api.get()
    .command('fail', (argv, context) => {
      context.cliMessage('You broke it')
    })
    .parse('fail').then(result => {
      t.equal(result.code, 1)
      t.match(result.output, /You broke it/)
      t.equal(result.errors.length, 0)
    })
})

tap.test('command > run handler > throwing error affects result', t => {
  return Api.get()
    .command('throw', argv => {
      throw new Error('Thrown')
    })
    .parse('throw').then(result => {
      t.equal(result.code, 1)
      t.match(result.output, /Thrown/)
      t.equal(result.errors.length, 1)
    })
})

tap.test('command > run handler > rejecting promise affects result', t => {
  return Api.get()
    .command('reject', argv => Promise.reject(new Error('Rejected')))
    .parse('reject').then(result => {
      t.equal(result.code, 1)
      t.match(result.output, /Rejected/)
      t.equal(result.errors.length, 1)
    })
})

tap.test('command > run handler > result not returned until handler resolves', t => {
  let done = false
  return Api.get().command('wait [ms:number=1000]', argv => {
    t.equal(argv.ms, 1000)
    return new Promise(resolve => {
      setTimeout(() => {
        done = true
        resolve()
      }, argv.ms)
    })
  }).parse('wait').then(result => {
    t.equal(done, true)
  })
})
