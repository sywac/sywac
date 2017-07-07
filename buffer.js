'use strict'

class Buffer {
  static get (opts) {
    return new Buffer(opts)
  }

  constructor (opts) {
    opts = opts || {}
    // output settings
    this._lineSep = opts.lineSep || '\n'
    this._sectionSep = opts.sectionSep || this._lineSep + this._lineSep
    this._pad = opts.pad || ' '
    this._indent = opts.indent || this._pad + this._pad
    this._split = opts.split || /\s/g // note that global is needed for the chunk method and doesn't affect split() usage
    this._maxWidth = opts.maxWidth || Math.min(process.stdout.columns || 100, 100)
    this._examplePrefix = 'examplePrefix' in opts ? opts.examplePrefix : '$ '
    // preface
    this._icon = opts.icon || ''
    this._slogan = opts.slogan || ''
    // usage
    this._usage = opts.usage || ''
    this._usageName = opts.usageName || ''
    this._usagePrefix = 'usagePrefix' in opts ? opts.usagePrefix : 'Usage: $0'
    this._usageHasCommand = 'usageHasCommand' in opts ? opts.usageHasCommand : false
    this._usageCommandPlaceholder = 'usageCommandPlaceholder' in opts ? opts.usageCommandPlaceholder : '<command>'
    this._usageHasArgs = 'usageHasArgs' in opts ? opts.usageHasArgs : false
    this._usageArgsPlaceholder = 'usageArgsPlaceholder' in opts ? opts.usageArgsPlaceholder : '<args>'
    this._usageHasOptions = 'usageHasOptions' in opts ? opts.usageHasOptions : false
    this._usageOptionsPlaceholder = 'usageOptionsPlaceholder' in opts ? opts.usageOptionsPlaceholder : '[options]'
    this._usagePositionals = Array.isArray(opts.usagePositionals) ? opts.usagePositionals : []
    // types
    this._groups = opts.groups || {} // maps heading to array of types, see Type.toObject and Context.addDeferredHelp
    this._groupOrder = opts.groupOrder || []
    // examples
    this._examples = opts.examples || {} // see Api.example
    this._exampleOrder = opts.exampleOrder || []
    // epilogue
    this._epilogue = opts.epilogue || ''
    // cli/validation/error messages
    this._showHelpOnError = 'showHelpOnError' in opts ? opts.showHelpOnError : true
    this._messages = opts.messages || []
    // dependencies
    this._utils = opts.utils
  }

  get utils () {
    if (!this._utils) this._utils = require('./lib/utils').get()
    return this._utils
  }

  get lineSep () {
    return this._lineSep
  }

  get sectionSep () {
    return this._sectionSep
    // return this.lineSep + new Array(this.maxWidth + 1).join('-') + this.lineSep // just checking
  }

  get pad () {
    return this._pad
  }

  get indent () {
    return this._indent
  }

  get split () {
    return this._split
  }

  get maxWidth () {
    return this._maxWidth
  }

  get icon () {
    return this._icon
  }

  get slogan () {
    return this._slogan
  }

  get usage () {
    let usage = this._usage || this.buildUsage()
    return this._usageName ? usage.replace('$0', this._usageName) : usage
  }

  buildUsage () {
    // _usagePrefix + (_usagePositionals.join(' ') || _usageHasCommand + _usageHasArgs) + _usageHasOptions
    let usage = this._usagePrefix
    if (this._usagePositionals.length) {
      usage += ' ' + this._usagePositionals.join(' ')
    } else {
      if (this._usageHasCommand && this._usageCommandPlaceholder) usage += ' ' + this._usageCommandPlaceholder
      if (this._usageHasArgs && this._usageArgsPlaceholder) usage += ' ' + this._usageArgsPlaceholder
    }
    if (this._usageHasOptions && this._usageOptionsPlaceholder) usage += ' ' + this._usageOptionsPlaceholder
    return usage
  }

  get groups () {
    return this._groups
  }

  set groups (g) {
    this._groups = g
  }

  get groupOrder () {
    return this._groupOrder
  }

  get examples () {
    return this._examples
  }

  get exampleOrder () {
    return this._exampleOrder
  }

  get messages () {
    return this._messages || []
  }

  set messages (m) {
    this._messages = m
  }

  get epilogue () {
    return this._epilogue
  }

  toString (opts) {
    opts = opts || {}
    let str = (this._showHelpOnError || !this.messages.length) ? this.helpContent(opts) : ''
    str = this.appendSection(str, this.errorContent(opts), this.sectionSep)
    return str
  }

  helpContent (opts) {
    opts = Object.assign({
      includePreface: true,
      includeUsage: true,
      includeGroups: true,
      includeExamples: true,
      includeEpilogue: true
    }, opts)
    let str = this.appendSection('', !!opts.includePreface && this.icon, this.sectionSep)
    if (opts.includePreface) str = this.appendSection(str, this.slogan, this.lineSep)
    if (opts.includeUsage) str = this.appendSection(str, this.usage, this.sectionSep)
    if (opts.includeGroups) str = this.appendSection(str, this.groupsContent(), this.sectionSep)
    if (opts.includeExamples) str = this.appendSection(str, this.examplesContent(), this.sectionSep)
    if (opts.includeEpilogue) str = this.appendSection(str, this.epilogue, this.sectionSep)
    return str
  }

  groupsContent () {
    return this.buildGroupedContent(this.groups, this.groupOrder, this.appendGroup)
  }

  examplesContent () {
    return this.buildGroupedContent(this.examples, this.exampleOrder, this.appendExampleGroup)
  }

  buildGroupedContent (groups, order, appendMethod) {
    let str = ''
    let groupsLeft = JSON.parse(JSON.stringify(groups))
    if (!order || !order.length) {
      // default order: Commands, Arguments, <custom>, Options
      order = Array.from(new Set(['Commands:', 'Arguments:'].concat(Object.keys(groupsLeft)).concat('Options:')))
    }
    let types
    const handleGroup = heading => {
      types = (groupsLeft[heading] || []).filter(type => !type.isHidden)
      if (!types.length) {
        delete groupsLeft[heading]
        return
      }
      str = appendMethod.call(this, str, heading, types)
      delete groupsLeft[heading]
    }
    // add groups mentioned in the order first
    order.forEach(handleGroup)
    // then add any groups not mentioned in the order
    Object.keys(groupsLeft).forEach(handleGroup)
    return str
  }

  appendGroup (str, heading, types) {
    // first determine width needed for all flags
    let flagsWidth = 0
    types.forEach(type => {
      if (type.helpFlags) flagsWidth = Math.max(flagsWidth, this.utils.stripAnsi(type.helpFlags).length)
    })
    let maxWidth = Math.max(this.maxWidth, this.indent.length + flagsWidth)

    if (heading) str = this.appendSection(str, heading, this.sectionSep)

    // if any types in this group require multi line, then just do all of them multi line
    let multiline = types.some(type => this.determineLines(type, flagsWidth, maxWidth) > 1)

    // then add each line:
    // indent + flags + padding + indent + ((desc + padding + hints) || (descMultiline + hintsMultiline))
    let first = true
    types.forEach(type => {
      if (multiline && str && !first) str += this.lineSep
      first = false
      str = multiline ? this.appendTypeMultiLine(str, type, flagsWidth, maxWidth) : this.appendTypeSingleLine(str, type, flagsWidth, maxWidth)
    })
    return str
  }

  appendExampleGroup (str, heading, examples) {
    if (heading) str = this.appendSection(str, heading, this.sectionSep)

    let flags
    let desc
    let first = true
    examples.forEach(example => {
      desc = example.description || example.desc
      if (str && !first && desc) str += this.lineSep
      first = false

      flags = !example.flags ? '' : (this._examplePrefix || '') + example.flags
      if (flags && this._usageName) flags = flags.replace('$0', this._usageName)

      str = this.appendTypeMultiLine(str, {
        helpDesc: desc,
        helpHints: flags
      }, 0, this.maxWidth)
    })
    return str
  }

  errorContent () {
    return this.messages.join(this.lineSep)
  }

  determineLines (type, flagsWidth, maxWidth) {
    if (!type.helpFlags && !type.helpDesc && !type.helpHints) return 0

    let singleLineWidth = 0
    if (type.helpFlags) singleLineWidth += this.indent.length + flagsWidth
    if (type.helpDesc) singleLineWidth += this.indent.length + this.utils.stripAnsi(type.helpDesc).length
    if (type.helpHints) singleLineWidth += this.indent.length + this.utils.stripAnsi(type.helpHints).length

    return singleLineWidth <= maxWidth ? 1 : 2
  }

  appendTypeSingleLine (str, type, flagsWidth, maxWidth) {
    let flag = type.helpFlags
    let desc = type.helpDesc
    let hint = type.helpHints
    let line = ''

    if (flag) {
      line += this.indent + flag + new Array(this.pos(flagsWidth, flag)).join(this.pad)
    } else if (flagsWidth > 0) {
      line += this.indent + new Array(flagsWidth + 1).join(this.pad)
    }
    if (desc) {
      line += this.indent + desc
    }
    if (hint) {
      line += new Array(this.pos(maxWidth, line + hint)).join(this.pad)
      line += hint
    }

    return this.appendSection(str, line, this.lineSep)
  }

  appendTypeMultiLine (str, type, flagsWidth, maxWidth) {
    let flag = type.helpFlags
    let desc = type.helpDesc
    let hint = type.helpHints
    let line = ''

    let leftOverWidth = maxWidth
    if (flag) {
      line += this.indent + flag + new Array(this.pos(flagsWidth, flag)).join(this.pad)
    } else if (flagsWidth > 0) {
      line += this.indent + new Array(flagsWidth + 1).join(this.pad)
    }
    if (line) leftOverWidth -= this.utils.stripAnsi(line).length
    if (desc || hint) leftOverWidth -= this.indent.length
    if (desc) {
      let chunks = this.chunk(desc, leftOverWidth)
      desc = chunks.shift()
      let first = true
      while (desc) {
        if (!first) line = ''
        if (!first && flagsWidth > 0) line += this.indent + new Array(flagsWidth + 1).join(this.pad)
        first = false
        line += this.indent + desc
        str = this.appendSection(str, line, this.lineSep)
        desc = chunks.shift()
      }
      line = ''
    }
    if (hint) {
      let chunks = this.chunk(hint, leftOverWidth)
      hint = chunks.shift()
      let first = !type.helpDesc
      while (hint) {
        if (!first) line = ''
        if (!first && flagsWidth > 0) line += this.indent + new Array(flagsWidth + 1).join(this.pad)
        first = false
        line += this.indent + hint
        str = this.appendSection(str, line, this.lineSep)
        hint = chunks.shift()
      }
    }
    return str
  }

  // split a string into an array of chunks which are each <= width
  chunk (str, width) {
    let chunks = []
    let chunk
    let ansiDiff
    let index
    let noAnsi
    while (str) {
      noAnsi = this.utils.stripAnsi(str)
      index = noAnsi.length <= width ? width : this.lastIndexOfRegex(noAnsi, this.split, width)
      if (index === -1) index = width
      // TODO this ain't cutting it for ansi reconstitution
      chunk = str.slice(0, index).trim()
      ansiDiff = chunk.length - this.utils.stripAnsi(chunk).length
      if (ansiDiff > 0) {
        index += ansiDiff
        chunk = str.slice(0, index).trim()
      }
      chunks.push(chunk)
      // prep for next iteration
      str = str.slice(index)
    }
    return chunks
  }

  lastIndexOfRegex (str, regex, fromIndex) {
    // based on http://stackoverflow.com/a/21420210/1174467
    str = fromIndex ? str.substring(0, fromIndex) : str
    let match = str.match(regex)
    return match ? str.lastIndexOf(match[match.length - 1]) : -1
  }

  // width diff
  pos (w, s) {
    return Math.max(0, w - this.utils.stripAnsi(s).length + 1)
  }

  appendSection (str, section, sep) {
    if (section && str.length) str += sep
    if (section) str += section
    return str
  }
}

module.exports = Buffer
