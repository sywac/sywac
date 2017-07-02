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
  parse (context) {
    // only need to parse for flags
    // otherwise will be populated by unknownType
    if (this.acceptFlags) {
      // first pass of parsing checks for flags with validation disabled
      return this.elementType._internalParse(context, false).then(whenDone => this.resolve())
    }
    return super.resolve()
  }

  // called by unknownType
  validateParsed (context) {
    return this.elementType.validateParsed(context).then(whenDone => super.resolve())
  }

  // called by unknownType
  setValue (value) {
    this.elementType.setValue(value)
  }

  // called by unknownType
  applySource (source, position, raw) {
    this.elementType.applySource(source, position, raw)
  }

  get source () {
    return this.elementType.source
  }

  reset () {
    super.reset()
    this.elementType.reset()
  }

  toResult (shouldCoerce) {
    return this.elementType.toResult(shouldCoerce)
  }
}

module.exports = TypePositional
