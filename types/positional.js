'use strict'

const TypeWrapper = require('./wrapper')

class TypePositional extends TypeWrapper {
  static get (opts) {
    return new TypePositional(opts)
  }

  constructor (opts) {
    opts = opts || {}
    super(opts)
    if ('acceptFlags' in opts) this.acceptFlags = opts.acceptFlags
    // TODO flags in positional and flags in elementType should be different
    this._variadic = opts.variadic
  }

  get isVariadic () {
    return this._variadic
  }

  get helpGroup () {
    return this._group || 'Arguments:'
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
      // first pass of parsing checks for flags
      // temporarily disable validation for this.elementType
      // TODO this is totally hacky
      let r = this.elementType.isRequired
      return this.elementType.required(false).parse(context).then(whenDone => {
        this.elementType.required(r)
        return super.resolve()
      })
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

  toResult () {
    return this.elementType.toResult()
  }

}

module.exports = TypePositional
