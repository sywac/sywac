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
