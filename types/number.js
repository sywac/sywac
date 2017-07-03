'use strict'

const Type = require('./type')

class TypeNumber extends Type {
  static isNumber (value) {
    return typeof value === 'number' || /^0x[0-9a-f]+$/i.test(value) || /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(value)
  }

  static get (opts) {
    return new TypeNumber(opts)
  }

  get datatype () {
    return 'number'
  }

  get value () {
    if (typeof this._value === 'undefined' || this._value === null) return this._value
    return TypeNumber.isNumber(this._value) ? Number(this._value) : NaN
  }

  setValue (value) {
    this._value = typeof value === 'boolean' ? NaN : value
  }

  // this is only checked if isStrict
  get isValueValid () {
    return TypeNumber.isNumber(this._value) && !isNaN(this._value)
  }

  buildInvalidMessage (msgAndArgs) {
    super.buildInvalidMessage(msgAndArgs)
    msgAndArgs.msg += ' Please specify a number.'
  }
}

module.exports = TypeNumber
