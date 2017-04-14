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
    if (this.value) context.addHelp() // TODO pass opts
    return super.resolve()
  }
}

module.exports = TypeHelp
