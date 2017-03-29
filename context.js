'use strict'

class Context {
  static get (opts) {
    return new Context(opts)
  }

  constructor (opts) {
    opts = opts || {}
    // dependencies
    this._utils = opts.utils
    // config
    this.types = []
    // args to parse per type
    this.args = []
    this.slurped = []
    // results of parsing and validation
    this.code = 0
    this.output = ''
    this.argv = {}
    this.details = { args: [], types: [] }
  }

  get utils () {
    if (!this._utils) this._utils = require('./lib/utils').get()
    return this._utils
  }

  withTypes (types) {
    this.types = types
    return this
  }

  slurpArgs (args) {
    if (!args) args = process.argv.slice(2)
    if (typeof args === 'string') args = this.utils.stringToArgs(args)
    if (!Array.isArray(args)) args = [].concat(args)
    // TODO read from stdin with no args? based on config?
    let parseable = [], extra = [], isExtra = false
    for (let i = 0, len = args.length, arg; i < len; i++) {
      arg = String(args[i])
      if (arg === '--') {
        isExtra = true
        // continue
      }
      (isExtra ? extra : parseable).push(arg)
    }
    this.args = parseable
    this.details.args = parseable.concat(extra)

    // let prev = [{}]
    // this.argv = this.args.reduce((argv, arg) => {
    //   let kvArray = this.parseSingleArg(arg)
    //   kvArray.forEach(kv => {
    //     if (kv.key) argv[kv.key] = kv.value
    //     else argv._.push(kv.value)
    //   })
    //   if (!kvArray[kvArray.length - 1].key && prev[prev.length - 1].key) {
    //     argv[prev[prev.length - 1].key] = kvArray[kvArray.length - 1].value
    //     argv._ = argv._.slice(0, -1)
    //   }
    //   prev = kvArray
    //   return argv
    // }, { _: [] })
    // console.log('context.js > argv:', this.argv)

    this.slurped = this.args.map((arg, index) => {
      return {
        raw: arg,
        index,
        parsed: this.parseSingleArg(arg)
      }
    })
    // console.log('context.js > slurped:', JSON.stringify(this.slurped, null, 2))

    return this
  }

  parseSingleArg (arg) {
    // short-circuit if no flag
    let numBeginningDashes = (arg.match(/^-+/) || [''])[0].length
    if (numBeginningDashes === 0) {
      return [{
        key: '',
        value: arg
      }]
    }
    // otherwise check for =value somewhere in arg
    let kvDelimIndex = arg.indexOf('=')
    let flags = kvDelimIndex > 1 ? arg.substring(numBeginningDashes, kvDelimIndex) : arg.slice(numBeginningDashes)
    let value = kvDelimIndex > 1 ? arg.substring(kvDelimIndex + 1) : undefined
    // can only be one flag with more than 1 dash
    if (numBeginningDashes > 1) {
      return [{
        key: flags,
        value: value || true
      }]
    }
    // may be multiple single-length flags, with value belonging to the last one
    let kvArray = flags.split('').map(flag => {
      return {
        key: flag,
        value: true
      }
    })
    if (value) kvArray[kvArray.length - 1].value = value
    return kvArray
  }

  // TODO this seems janky
  toResult (typeResults) {
    let argv = this.argv
    typeResults.forEach(tr => {
      tr.aliases.forEach(alias => {
        argv[alias] = tr.value
      })
    })
    let result = {
      code: this.code,
      output: this.output,
      argv: argv,
      details: this.details
    }
    result.details.types = result.details.types.concat(typeResults)
    return result
  }
}

module.exports = Context
