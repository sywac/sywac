'use strict'

const TypeImplicitCommand = require('./implicit')

class TypeHelp extends TypeImplicitCommand {
  static get (opts) {
    return new TypeHelp(opts)
  }

  constructor (opts) {
    super(Object.assign({ desc: 'Show help' }, opts))
  }

  configure (opts, override) {
    opts = opts || {}
    if (typeof override === 'undefined') override = true
    super.configure(opts, override)

    // if (override || typeof this._implicitCommand === 'undefined') {
    //   this._implicitCommand = 'implicitCommand' in opts ? opts.implicitCommand : this._implicitCommand
    // }

    return this
  }

  validateConfig (utils) {
    if (!this._flags && !this._aliases.length) this._aliases.push('help')
    super.validateConfig(utils)
  }

  validateParsed (context) {
    if (this.value) this.requestHelp(context) // must call this before postParse in case of commands
    return this.resolve()
  }

  implicitCommandFound (source, position, raw, context) {
    super.implicitCommandFound(source, position, raw, context)
    this.requestHelp(context) // must call this before postParse in case of commands
  }

  requestHelp (context) {
    context.deferHelp() // TODO pass opts from this type config
  }
}

module.exports = TypeHelp
