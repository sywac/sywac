'use strict'

const tap = require('tap')
const Api = require('../api')
const HelpBuffer = require('../buffer')
const Type = require('../types/type')

const parent = require('path').basename(__filename, '.js')

tap.test('api > custom type can use needsApi')
tap.test('api > custom type can use implicitCommands')

tap.test('api > help text', t => {
  let includeExamples = false
  const helpText = Api.get()
    .preface('icon', 'slogan')
    .usage('usage')
    .string('-s <string>', {
      desc: 'My string description',
      group: 'Strings:'
    })
    .boolean('-b', {
      desc: 'My boolean description',
      group: 'Booleans:'
    })
    .groupOrder(['Booleans:'])
    .example('example 3', {
      desc: 'A bad example',
      group: 'Bad Examples:'
    })
    .example({
      flags: 'example 1',
      desc: 'A good example',
      group: 'Good Examples:'
    })
    .example('example 2', { group: 'Good Examples:' })
    .exampleOrder(['Good Examples:', 'Bad Examples:'])
    .style({
      group: s => s.toUpperCase(),
      example: s => s + ' <kbd>enter</kbd>',
      all: (s, opts) => {
        includeExamples = opts.includeExamples
        return s.replace(/O/g, '0')
      }
    })
    .outputSettings({ maxWidth: 46 })
    .epilogue('epilogue')
    .getHelp()
  t.equal(helpText, [
    'icon',
    'slogan',
    '',
    'usage',
    '',
    'B00LEANS:',
    '  -b  My boolean description         [boolean]',
    '',
    'STRINGS:',
    '  -s <string>  My string description  [string]',
    '',
    'G00D EXAMPLES:',
    '  A good example',
    '  $ example 1 <kbd>enter</kbd>',
    '  $ example 2 <kbd>enter</kbd>',
    '',
    'BAD EXAMPLES:',
    '  A bad example',
    '  $ example 3 <kbd>enter</kbd>',
    '',
    'epilogue'
  ].join('\n'))
  t.same(includeExamples, true)
  t.end()
})

tap.test('api > custom helpBuffer', t => {
  const helpText = Api.get()
    .preface('icon', 'slogan')
    .usage('usage')
    .string('-s <string>', {
      desc: 'My string description',
      group: 'Strings:'
    })
    .boolean('-b', {
      desc: 'My boolean description',
      group: 'Booleans:'
    })
    .groupOrder(['Booleans:'])
    .example('example 3', {
      desc: 'A bad example',
      group: 'Bad Examples:'
    })
    .example({
      flags: 'example 1',
      desc: 'A good example',
      group: 'Good Examples:'
    })
    .example('example 2', { group: 'Good Examples:' })
    .exampleOrder(['Good Examples:', 'Bad Examples:'])
    .outputSettings({ maxWidth: 46 })
    .epilogue('epilogue')
    .registerFactory('helpBuffer', () => ({ toString: () => 'Complete override' }))
    .getHelp()
  t.same(helpText, 'Complete override')
  t.end()
})

tap.test('api > help configuration functions ignore or massage invalid params', t => {
  const helpText = Api.get()
    .usage()
    .groupOrder({ value: 'ignored' })
    .example()
    .exampleOrder({ value: 'ignored' })
    .outputSettings()
    .style()
    .registerFactory()
    .getHelp()
  t.equal(helpText, [
    'Usage: test-api',
    '',
    'Examples:'
  ].join('\n'))
  t.end()
})

tap.test('api > help text with ANSI desc too wide (best effort)', t => {
  const helpText = Api.get()
    .string('-s, --string <string>', {
      desc: 'This long and lengthy and redundant description needs to be wrapped to another line'
    })
    .outputSettings({ maxWidth: 65 })
    .getHelp({ includeUsage: false })
  t.equal(helpText, [
    'Options:',
    '  -s, --string <string>  This long and lengthy and redundant',
    '                         description needs to be wrapped to',
    '                         another line',
    '                         [string]'
  ].join('\n'))
  t.end()
})

// issue 21
tap.test('api > help text with single word too wide in desc (best effort)', t => {
  const helpText = Api.get()
    .string('-s, --string <string>', {
      desc: 'This used to cause an infinite loop in buffer\'s chunk method. See (https://documentation.mailgun.com/en/latest/user_manual.html#scheduling-delivery)'
    })
    .getHelp({ includeUsage: false })
  t.equal(helpText, [
    'Options:',
    '  -s, --string <string>  This used to cause an infinite loop in buffer\'s chunk method. See',
    '                         (https://documentation.mailgun.com/en/latest/user_manual.html#scheduling-d',
    '                         elivery)',
    '                         [string]'
  ].join('\n'))
  t.end()
})

tap.test('buffer > appendTypeSingleLine for type without helpFlags (not typically possible)', t => {
  const str = HelpBuffer.get().appendTypeSingleLine('', {
    helpDesc: 'desc',
    helpHints: 'hints'
  }, 10, 50)
  t.equal(str, '              desc                           hints')
  t.end()
})

tap.test('buffer > appendTypeMultiLine for type without helpFlags (not typically possible)', t => {
  const str = HelpBuffer.get().appendTypeMultiLine('', {
    helpDesc: 'desc',
    helpHints: 'hints'
  }, 10, 50)
  t.equal(str, [
    '              desc',
    '              hints'
  ].join('\n'))
  t.end()
})

tap.test('api > blows up on type without flags or aliases', t => {
  t.throws(() => {
    Api.get().custom(new Type())
  })
  t.end()
})

tap.test('api > base type has "value" datatype (should not be used)', t => {
  t.equal(new Type().datatype, 'value')
  t.end()
})

tap.test('api > _getArrayType of subtype string:thing', t => {
  const type = Api.get()._getArrayType('--uhh', {}, 'string:thing')
  t.equal(type.datatype, 'array:string')
  t.end()
})

tap.test('api > _getArrayType of subtype array:string', t => {
  const type = Api.get()._getArrayType('--uhh', {}, 'array:string')
  t.equal(type.datatype, 'array:array:string')
  t.end()
})

tap.test('api > _getType of name string:thing', t => {
  const type = Api.get()._getType('--uhh', {}, 'string:thing')
  t.equal(type.datatype, 'string')
  t.end()
})

tap.test('api > type with aliases array instead of flags string', t => {
  const typeObjects = Api.get().string(['s', 'string']).initContext(true).types
  t.same(typeObjects[parent][0].aliases, ['s', 'string'])
  t.equal(typeObjects[parent][0].datatype, 'string')
  t.equal(typeObjects[parent][0].helpFlags, '-s, --string')
  t.end()
})

tap.test('api > attempt to get unmapped type returns null (don\'t do this)', t => {
  const nullType = Api.get().get('kjlkjh', {})
  t.equal(nullType, null)
  t.end()
})

tap.test('api > unexpectedErrorFormatter customizes error output', async t => {
  // Standard formatting
  const error = new Error('An Error')
  const api = Api.get().check(() => { throw error })
  const result1 = await api.parse()
  t.equal(result1.output, error.stack)

  // Customized formatting
  api.unexpectedErrorFormatter(error => `Oops, ${error.message} Happened`)
  const result2 = await api.parse()
  t.equal(result2.output, 'Oops, An Error Happened')

  t.end()
})

tap.test('api > style > unexpectedError styles error output', async t => {
  // Standard styling
  const error = new Error('An Error')
  const api = Api.get()
    .unexpectedErrorFormatter(error => error.message)
    .check(() => { throw error })
  const result1 = await api.parse()
  t.equal(result1.output, 'An Error')

  // Customized styling
  api.style({ unexpectedError: str => `[[${str}]]` })
  const result2 = await api.parse()
  t.equal(result2.output, '[[An Error]]')

  t.end()
})

tap.test('api > custom path and fs libs', async t => {
  class FakePath {
    // used by api
    basename () {
      this.basenameCalled = this.basenameCalled ? this.basenameCalled + 1 : 1
      return 'test'
    }

    // used by api
    isAbsolute () {
      this.isAbsoluteCalled = this.isAbsoluteCalled ? this.isAbsoluteCalled + 1 : 1
      return true
    }

    // used by context
    dirname () {
      this.dirnameCalled = this.dirnameCalled ? this.dirnameCalled + 1 : 1
      return 'not-root'
    }

    // used by context
    parse () {
      this.parseCalled = this.parseCalled ? this.parseCalled + 1 : 1
      return { root: 'root' }
    }

    // used by context
    join () {
      this.joinCalled = this.joinCalled ? this.joinCalled + 1 : 1
      return 'ignored'
    }
  }

  class FakeFs {
    // used by api
    readdirSync () {
      this.readdirSyncCalled = this.readdirSyncCalled ? this.readdirSyncCalled + 1 : 1
      return []
    }

    // used by types/path
    stat (_, cb) {
      this.statCalled = this.statCalled ? this.statCalled + 1 : 1
      process.nextTick(() => {
        cb(null, { isFile: () => true })
      })
    }

    // used by context
    readFileSync () {
      this.readFileSyncCalled = this.readFileSyncCalled ? this.readFileSyncCalled + 1 : 1
      return JSON.stringify({ version: '0.0.0-custom' })
    }
  }

  const pathLib = new FakePath()
  const fsLib = new FakeFs()
  const api = Api.get().configure({ pathLib, fsLib })
    .commandDirectory('x') // api use of libs
    .version() // context use of libs
    .path('-p <path>', { // types/path use of libs
      mustExist: true
    })

  const promises = []

  promises.push(api.parse('-p anything'))

  promises.push(api.parse('--version'))

  const [result1, result2] = await Promise.all(promises)

  t.equal(result1.code, 0)
  t.equal(result1.output, '')
  t.equal(result1.errors.length, 0)
  t.equal(result1.argv.p, 'anything')

  t.equal(result2.code, 0)
  t.equal(result2.output, '0.0.0-custom')
  t.equal(result2.errors.length, 0)

  t.equal(pathLib.basenameCalled, 1)
  t.equal(pathLib.isAbsoluteCalled, 1)
  t.equal(pathLib.dirnameCalled, 1)
  t.equal(pathLib.parseCalled, 1)
  t.equal(pathLib.joinCalled, 1)
  t.equal(fsLib.readdirSyncCalled, 1)
  t.equal(fsLib.statCalled, 1)
  t.equal(fsLib.readFileSyncCalled, 1)
})
