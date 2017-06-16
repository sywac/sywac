'use strict'

const TypeBoolean = require('./boolean')

class TypeHelp extends TypeBoolean {
  static get (opts) {
    return new TypeHelp(opts)
  }

  constructor (opts) {
    super(Object.assign({ desc: 'Show help' }, opts))
  }

  // configure (opts, override) {
  //   opts = opts || {}
  //   if (typeof override === 'undefined') override = true
  //   super.configure(opts, override)
  //
  //   if (override || !this._apiName) this._apiName = opts.apiName || this._apiName
  //
  //   return this
  // }

  validateConfig (utils) {
    if (!this._flags && !this._aliases.length) this._aliases.push('help')
    super.validateConfig(utils)
  }

  postParse (context) {
    // console.log('postParse', this.constructor.name)
    // console.log('help.js postParse > type options:', Object.keys(context.types))

    // TODO if (!this.value) look for implicit "help" command?
    // TODO need to do anything to make the output command-specific?

    if (this.value) {
      // TODO clear any validation errors (from parsing) in context, if necessary
      context.deferHelp() // TODO pass opts from this type config
    }
    return this.resolve()
  }
}

module.exports = TypeHelp
