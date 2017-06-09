'use strict'

const TypeBoolean = require('./boolean')

class TypeHelp extends TypeBoolean {
  static get (opts) {
    return new TypeHelp(opts)
  }

  constructor (opts) {
    super(Object.assign({ desc: 'Show help' }, opts))
  }

  validateConfig (utils) {
    if (!this._flags && !this._aliases.length) this._aliases.push('help')
    super.validateConfig(utils)
  }

  postParse (context) {
    // console.log('postParse', this.constructor.name)
    if (this.value) {
      // TODO clear any validation errors (from parsing) in context, if necessary
      context.addHelp() // TODO pass opts to addHelp
    }
    return super.resolve()
  }
}

module.exports = TypeHelp
