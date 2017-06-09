'use strict'

class Buffer {
  static get (opts) {
    return new Buffer(opts)
  }

  constructor (opts) {
    opts = opts || {}
    this._lineSep = opts.lineSep || '\n'
    this._sectionSep = opts.sectionSep || this._lineSep + this._lineSep
    this._pad = opts.pad || ' '
    this._indent = opts.indent || this._pad + this._pad
    this._split = opts.split || /\s/g // note that global is needed for the chunk method and doesn't affect split() usage
    // stuff
    this._icon = opts.icon || ''     // think alain
    this._slogan = opts.slogan || '' // "Need a product name? Ask alain!"
    this._usage = opts.usage || ''   // "Usage: $0 [options] <command>"
    this._groups = opts.groups || {} // Commands, Options, Examples
    this._groupOrder = opts.groupOrder || []
    // each group keyed by heading
    // with a value of array<types>
    // each type should have:
    // - flags with or without placeholder
    // - description
    // - hints
    this._epilogue = opts.epilogue || '' // "See alainasaservice.com for more details"
    this._error = opts.error
    this._errorMsg = opts.errorMsg || ''
    this._maxWidth = opts.maxWidth || Math.min(process.stdout.columns || 100, 100)
    // dependencies
    this._utils = opts.utils
  }

  reset () {
    // TODO reset error stuff
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
    return this._usage
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

  get epilogue () {
    return this._epilogue
  }

  toString (opts) {
    let str = this.helpContent(opts)
    str = this.appendSection(str, this.errorContent(opts), this.sectionSep)
    return str
  }

  helpContent (opts) {
    opts = Object.assign({
      includePreface: true,
      includeUsage: true,
      includeGroups: true,
      includeEpilogue: true
    }, opts)
    let str = this.appendSection('', !!opts.includePreface && this.icon, this.sectionSep)
    if (opts.includePreface) str = this.appendSection(str, this.slogan, this.sectionSep)
    if (opts.includeUsage) str = this.appendSection(str, this.usage, this.sectionSep)
    if (opts.includeGroups) str = this.appendSection(str, this.groupsContent(), this.sectionSep)
    if (opts.includeEpilogue) str = this.appendSection(str, this.epilogue, this.sectionSep)
    return str
  }

  groupsContent () {
    let str = ''
    let groupsLeft = JSON.parse(JSON.stringify(this.groups))
    let order = this.groupOrder
    if (!order || !order.length) order = Object.keys(groupsLeft)
    let types
    order.forEach(heading => {
      types = groupsLeft[heading] // array of types
      if (!types || !types.length) {
        delete groupsLeft[heading]
        return undefined
      }

      // first determine width needed for all flags
      let flagsWidth = 0
      types.forEach(type => {
        if (type.hidden) return undefined
        if (type.helpFlags) flagsWidth = Math.max(flagsWidth, this.utils.stripAnsi(type.helpFlags).length)
      })

      if (heading) str = this.appendSection(str, heading, this.sectionSep)

      // then add each line:
      // indent + flags + padding + indent + ((desc + padding + hints) || (descMultiline + hintsMultiline))
      // let p = true
      types.forEach(type => {
        // if (p) {
        //   p = false
        //   str += '\n' + new Array(this.maxWidth + 1).join('.')
        // }
        str = this.appendTypeSimple(str, type, flagsWidth)
      })

      delete groupsLeft[heading]
    })
    Object.keys(groupsLeft).forEach(heading => {
      // TODO ditto
    })
    return str
  }

  groupsContentX () {
    let str = ''
    let groupsLeft = JSON.parse(JSON.stringify(this.groups))
    let order = this.groupOrder
    if (!order || !order.length) order = Object.keys(groupsLeft)
    let types
    order.forEach(heading => {
      types = groupsLeft[heading] // array of types
      if (!types || !types.length) {
        delete groupsLeft[heading]
        return undefined
      }
      let flagsWidth = 0
      let descWidth = 0
      let hintsWidth = 0
      let minHintsWidth = 0
      let hintsNoAnsi
      types.forEach(type => {
        if (type.hidden) return undefined
        if (type.helpFlags) flagsWidth = Math.max(flagsWidth, this.utils.stripAnsi(type.helpFlags).length)
        if (type.helpDesc) descWidth = Math.max(descWidth, this.utils.stripAnsi(type.helpDesc).length)
        // TODO perhaps helpHints should be an array ??
        if (type.helpHints) {
          hintsNoAnsi = this.utils.stripAnsi(type.helpHints)
          hintsWidth = Math.max(hintsWidth, hintsNoAnsi.length)
          minHintsWidth = Math.max(minHintsWidth, hintsNoAnsi.split(this.split).filter(Boolean).reduce((x, y) => Math.max(x, y.length), 0))
        }
      })
      if (flagsWidth === 0 && descWidth === 0 && hintsWidth === 0) return undefined
      if (heading) {
        str += heading
        // str += this.lineSep
      }
      let maxDescWidth = (this.maxWidth - (this.indent.length * 3) - flagsWidth) * (descWidth / (descWidth + hintsWidth))
      let maxHintsWidth = (this.maxWidth - (this.indent.length * 3) - flagsWidth) * (hintsWidth / (descWidth + hintsWidth))
      maxHintsWidth = Math.max(Math.floor(maxHintsWidth), minHintsWidth)
      maxDescWidth = Math.min(Math.floor(maxDescWidth), this.maxWidth - (this.indent.length * 3) - flagsWidth - maxHintsWidth)
      // let line
      let p = true
      types.forEach(type => {
        if (p) {
          p = false
          str += '\n' + new Array(this.maxWidth + 1).join('.')
          str += '\n' + new Array((this.indent.length * 3) + flagsWidth + maxDescWidth + maxHintsWidth + 1).join('=')
          str = this.appendType(str, {
            helpFlags: String(flagsWidth),
            helpDesc: String(maxDescWidth),
            helpHints: String(maxHintsWidth)
          }, flagsWidth, maxDescWidth, maxHintsWidth)
        }
        str = this.appendType(str, type, flagsWidth, maxDescWidth, maxHintsWidth)
      })

      delete groupsLeft[heading]
    })
    Object.keys(groupsLeft).forEach(heading => {
      // TODO ditto
    })
    return str
  }

  errorContent () {
    return '' // TODO
  }

  appendTypeSimple (str, type, flagsWidth) {
    if (type.hidden || (!type.helpFlags && !type.helpDesc && !type.helpHints)) return str

    let maxWidth = Math.max(this.maxWidth, this.indent.length + flagsWidth)
    let flag = type.helpFlags
    let desc = type.helpDesc
    let hint = type.helpHints
    let line = ''

    // single line case
    let singleLineWidth = 0
    if (flag) singleLineWidth += this.indent.length + flagsWidth
    if (desc) singleLineWidth += this.indent.length + this.utils.stripAnsi(desc).length
    if (hint) singleLineWidth += this.indent.length + this.utils.stripAnsi(hint).length
    if (singleLineWidth <= maxWidth) {
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

    // multi line case
    let leftOverWidth = maxWidth
    if (flag) {
      line += this.indent + flag + new Array(this.pos(flagsWidth, flag)).join(this.pad)
    } else if (flagsWidth > 0) {
      line += this.indent + new Array(flagsWidth + 1).join(this.pad)
    }
    if (line) leftOverWidth -= this.utils.stripAnsi(line).length
    if (desc) {
      leftOverWidth -= this.indent.length
      // line += this.indent
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
      leftOverWidth -= this.indent.length
      // line += this.indent
      let chunks = this.chunk(hint, leftOverWidth)
      hint = chunks.shift()
      let first = true
      while (hint) {
        if (!first) line = ''
        first = false
        if (flagsWidth > 0) line += this.indent + new Array(flagsWidth + 1).join(this.pad)
        line += this.indent + hint
        str = this.appendSection(str, line, this.lineSep)
        hint = chunks.shift()
      }
    }
    return str
  }

  appendType (str, type, flagsWidth, descWidth, hintsWidth) {
    if (type.hidden || (!type.helpFlags && !type.helpDesc && !type.helpHints)) return str
    let flag = type.helpFlags

    // split desc and hint into array of chunks <= width
    let descChunks = this.chunk(type.helpDesc, descWidth)
    let hintChunks = this.chunk(type.helpHints, hintsWidth)
    let desc = descChunks.shift()
    let hint = hintChunks.shift()

    let line
    while (flag || desc || hint) {
      line = ''

      if (flag) {
        line += this.indent + flag + new Array(this.pos(flagsWidth, flag)).join(this.pad)
        flag = ''
      } else {
        line += this.indent + new Array(flagsWidth + 1).join(this.pad)
      }

      if (desc) {
        line += this.indent + desc + new Array(this.pos(descWidth, desc)).join(this.pad)
        desc = descChunks.shift()
      } else {
        line += this.indent + new Array(descWidth + 1).join(this.pad)
      }

      if (hint) { // right-aligned, so padding first
        line += this.indent + new Array(this.pos(hintsWidth, hint)).join(this.pad) + hint
        hint = hintChunks.shift()
      } else {
        // TODO need anything here?
      }

      str = this.appendSection(str, line, this.lineSep)
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
      index = noAnsi.length <= width ? width : this.lastIndexOfRegex(this.utils.stripAnsi(str), this.split, width)
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
