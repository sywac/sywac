'use strict'

const Type = require('./type')

class TypeWrapper extends Type {
  constructor (opts) {
    opts = opts || {}
    super(opts)
    this._elementType = opts.elementType || opts.of
  }

  of (subtype) {
    this._elementType = subtype
    return this
  }

  get elementType () {
    if (!this._elementType) this._elementType = require('./string').get()
    return this._elementType
  }

  get datatype () {
    return this.elementType.datatype
  }
}

module.exports = TypeWrapper
