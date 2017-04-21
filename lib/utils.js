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
    // TODO: should '<placeholder>' (angle brackets) make an option required ??
    let words = this.stripAnsi(flags).split(/[ ,|]+/)
    // first pass: expect dashes
    let aliases = words.map(word => word && word.startsWith('-') && word.replace(/^-+/, '')).filter(Boolean)
    if (!aliases.length) {
      // second pass: take anything but explicit placeholders
      aliases = words.map(word => word.replace(/^-+/, '')).filter(alias => {
        return alias && !alias.startsWith('<') && !alias.startsWith('[')
      })
    }
    // console.log(`turned flags "${flags}" into aliases:`, aliases)
    return aliases
  }

  // split a string into an args array
  stringToArgs (str) {
    let args = []
    let prev, openQuote, arg = '', cIsSpace
    for (let c of str) {
      // console.log('sywac > c:', c)
      cIsSpace = this.isSpace(c)
      if (prev !== '\\' && c === openQuote) {
        // close quote, DO NOT include c in arg
        args.push(arg)
        arg = ''
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
    return ' \t\n\r\v'.indexOf(c) > -1
  }
}

module.exports = Utils
