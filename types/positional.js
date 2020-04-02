'use strict'

const TypeWrapper = require('./wrapper')

class TypePositional extends TypeWrapper {
  static get (opts) {
    return new TypePositional(opts)
  }

  constructor (opts) {
    super(Object.assign({ acceptFlags: false, variadic: false }, opts || {}))
  }

  configure (opts, override) {
    opts = opts || {}
    if (typeof override === 'undefined') override = true
    super.configure(opts, override)

    if (override || typeof this.acceptFlags === 'undefined') this.acceptFlags = 'acceptFlags' in opts ? opts.acceptFlags : this.acceptFlags
    if (override || typeof this._variadic === 'undefined') this._variadic = 'variadic' in opts ? opts.variadic : this._variadic

    return this
  }

  get isVariadic () {
    // TODO perhaps remove this._variadic and return this.datatype.startsWith('array') instead
    return this._variadic
  }

  get helpGroup () {
    return this._group || 'Arguments:'
  }

  buildHelpHints (hints) {
    this.elementType.buildHelpHints(hints)
  }

  withParent (apiName) {
    super.withParent(apiName)
    this.elementType.withParent(apiName)
    return this
  }

  // called by api
  validateConfig (utils) {
    if (this.acceptFlags) this.elementType.validateConfig(utils)
  }

  // called by api
  async parse (context) {
    // only need to parse for flags
    // otherwise will be populated by unknownType
    if (this.acceptFlags) {
      // first pass of parsing checks for flags with validation disabled
      await this.elementType._internalParse(context, false)
      return this.resolve()
    }
    return super.resolve()
  }

  // called by unknownType
  async validateParsed (context) {
    await this.elementType.validateParsed(context)
    return super.resolve()
  }

  // called by unknownType
  setValue (context, value) {
    this.elementType.setValue(context, value)
  }

  // called by unknownType
  applySource (context, source, position, raw) {
    this.elementType.applySource(context, source, position, raw)
  }

  toResult (context, shouldCoerce) {
    return this.elementType.toResult(context, shouldCoerce)
  }
}

module.exports = TypePositional
