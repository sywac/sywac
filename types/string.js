'use strict'

const Type = require('./type')

class TypeString extends Type {
  static get (opts) {
    return new TypeString(opts)
  }

  constructor (opts) {
    super(opts)
  }

  get datatype () {
    return 'string'
  }

  get value () {
    if (typeof this._value === 'undefined' || this._value === null) return this._value
    return String(this._value)
  }

  setValue (value) {
    this._value = typeof value === 'boolean' ? '' : value
  }
}

module.exports = TypeString
