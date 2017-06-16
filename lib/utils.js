// copyright license from https://github.com/chalk/ansi-regex/blob/master/license
// for the use of default ansiRegex below
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

'use strict'

class Utils {
  static get (opts) {
    return new Utils(opts)
  }

  constructor (opts) {
    opts = opts || {}
    this._ansiRegex = opts.ansiRegex
    // TODO literal strings and regexes below should be configurable
  }

  get ansiRegex () {
    if (!this._ansiRegex) this._ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g
    return this._ansiRegex
  }

  // remove ANSI escape codes (e.g. terminal colors) from a string
  stripAnsi (str) {
    return String(str).replace(this.ansiRegex, '')
  }

  // remove ANSI and any preceding - or --
  normalizeAlias (alias) {
    // return this.stripAnsi(alias).replace(/^-+/, '')
    return this.flagsToAliases(alias)[0] || ''
  }

  // make sure aliases don't look like flags
  normalizeAliases (aliases) {
    return aliases.map(alias => this.normalizeAlias(alias))
  }

  // build flags string from aliases array
  aliasesToFlags (aliases) {
    // add - or --, if needed, preserving ansi
    // then join into string to set flags
    let noAnsi, normalized
    return aliases.map(alias => {
      noAnsi = this.stripAnsi(alias)
      normalized = this.normalizeAlias(alias)
      if (noAnsi !== normalized) return alias
      return (normalized.length === 1 ? '-' : '--') + alias
    }).join(', ')
  }

  // build normalized aliases array from a flags string
  flagsToAliases (flags) {
    // remove ANSI, split on any delimiters
    // then remove any preceding - or --
    let words = this.stripAnsi(flags).split(/[ ,|]+/)
    // first pass: expect dashes
    let aliases = words.map(word => word && word.startsWith('-') && word.replace(/^-+/, '')).filter(Boolean)
    if (!aliases.length) {
      // second pass: take anything but explicit placeholders
      aliases = words.map(word => word.replace(/^-+/, '')).filter(alias => {
        // return alias && !alias.startsWith('<') && !alias.startsWith('[')
        return alias && '<['.indexOf(alias[0]) === -1
      })
    }
    // if (!aliases.length) {
      // third pass: take anything to satisfy positionals
    // }
    // console.log(`turned flags "${flags}" into aliases:`, aliases)
    return aliases
  }

  // turn a formatted dsl string into an object of type properties
  // e.g. [-c|--charlie] <charlie:string..="some val">
  /*
  {
    flags: "-c|--charlie",
    aliases: ["c", "charlie"],
    acceptFlags: true,
    required: true,
    type: "array:string",
    variadic: true,
    defaultValue: ["some val"]
  }
  */
  inferPositionalProperties (str, validTypes) {
    // both: required, defaultValue, aliases
    // parent: acceptFlags, variadic
    // child: flags, type
    // start new value when (opener and isMatchingCloser) || (!opener and isOpener)
    const values = []
    let opener
    let value = ''
    const req = '<'
    const pairs = {'[': ']'}
    pairs[req] = '>'
    for (let c of str) {
      if ((opener && pairs[opener] === c) || (!opener && pairs[c])) {
        value = value && value.trim()
        if (value) values.push({value, required: opener === req})
        value = ''

        opener = opener ? '' : c

        continue
      }
      value += c
    }
    value = value && value.trim()
    if (value) values.push({value, required: true}) // required is true by default

    let props = {}
    let firstColon
    let firstEqual
    let alias
    values.forEach(o => {
      value = o.value
      if (value[0] === '-') {
        props.flags = value
        props.aliases = this.flagsToAliases(props.flags)
        props.acceptFlags = true
        return
      }
      props.required = o.required

      props.variadic = value.indexOf('..') !== -1
      value = value.replace(/(\.)\1{1,}/g, '') // remove any two or more consecutive dots

      firstEqual = value.indexOf('=')
      if (firstEqual !== -1) {
        props.defaultValue = value.slice(firstEqual + 1)
        if (props.variadic) props.defaultValue = [props.defaultValue] // TODO TypeArray with defaultValue has problems!
        value = value.slice(0, firstEqual)
      }

      firstColon = value.indexOf(':')
      if (firstColon !== -1) {
        let addTypeAsAlias = !props.acceptFlags
        alias = value.slice(0, firstColon)
        if (validTypes && validTypes.indexOf(alias) === -1) {
          props.aliases = (props.aliases || []).concat(alias) // alias
          value = value.slice(firstColon + 1)
          addTypeAsAlias = false
        }
        // value is type
        if (addTypeAsAlias) props.aliases = (props.aliases || []).concat(alias) // type
        if (props.variadic && !value.startsWith('array')) value = 'array:' + value
        props.type = value
      } else {
        // no colons, value could be alias or type
        if (validTypes && validTypes.indexOf(value) === -1) {
          props.aliases = (props.aliases || []).concat(value) // alias
          props.type = props.variadic ? 'array:string' : 'string'
        } else {
          if (!props.acceptFlags) props.aliases = (props.aliases || []).concat(value) // type
          if (props.variadic && !value.startsWith('array')) value = 'array:' + value
          props.type = value
        }
      }
    })

    if (!props.variadic && props.type && props.type.startsWith('array')) props.variadic = true

    // filter duplicates from aliases
    props.aliases = Array.from(new Set(props.aliases))

    // if no flags, set from aliases
    if (!props.flags) props.flags = this.aliasesToFlags(props.aliases)

    return props
  }

  // split a string into an array of positional flags (also strings)
  stringToMultiPositional (str) {
    let positionalFlags = []
    let flags = ''
    this.stringToArgs(this.stripAnsi(str)).forEach(candidate => {
      if (candidate.replace(/\s|\[|</g, '').startsWith('-')) {
        if (flags) {
          positionalFlags.push(flags)
          flags = ''
        }
        flags += candidate
      } else {
        if (flags) flags += ' '
        flags += candidate
        positionalFlags.push(flags)
        flags = ''
      }
    })
    return positionalFlags
  }

  // split a string into an args array
  stringToArgs (str) {
    let args = []
    let prev
    let openQuote
    let arg = ''
    let cIsSpace
    for (let c of str) {
      // console.log('sywac > c:', c)
      cIsSpace = this.isSpace(c)
      if (prev !== '\\' && c === openQuote) {
        // close quote, DO NOT include c in arg
        // args.push(arg)
        // arg = ''
        openQuote = undefined
      } else if (prev === '\\' && c === openQuote) {
        // escaped quote, remove previous backslash and add c
        arg = arg.slice(0, -1) + c
      } else if (!openQuote && '\'"'.indexOf(c) > -1) {
        // open quote, DO NOT include c in arg
        openQuote = c
      } else if (openQuote || !cIsSpace) {
        // either within quote or within group/word, include c in arg
        arg += c
      } else if (cIsSpace) {
        // end of group/word
        if (arg) args.push(arg)
        arg = ''
      }
      prev = c
    }
    if (arg) args.push(arg)
    return args
  }

  // determine if a character represents whitespace
  isSpace (c) {
    // return /\s/.test(c)
    return ' \t\n\r\v'.indexOf(c) !== -1
  }

  sameArrays (one, two) {
    const oneLength = one.length
    if (oneLength !== two.length) return false
    for (let i = 0; i < oneLength; i++) {
      if (one[i] !== two[i]) return false
    }
    return true
  }
}

module.exports = Utils
