'use strict'

const TypeWrapper = require('./wrapper')

class TypeArray extends TypeWrapper {
  static get (opts) {
    return new TypeArray(opts)
  }

  constructor (opts) {
    super(Object.assign({ defaultValue: [], delim: ',', cumulative: true }, opts || {}))
  }

  configure (opts, override) {
    opts = opts || {}
    if (typeof override === 'undefined') override = true
    super.configure(opts, override)

    if (override || typeof this._delim === 'undefined') {
      if ('delimiter' in opts) this._delim = opts.delimiter
      else if ('delim' in opts) this._delim = opts.delim
    }

    if (override || typeof this._cumulative === 'undefined') this._cumulative = 'cumulative' in opts ? opts.cumulative : this._cumulative

    return this
  }

  delimiter (d) {
    this._delim = d
    return this
  }

  get delim () {
    return this._delim
  }

  cumulative (c) {
    this._cumulative = c
    return this
  }

  get datatype () {
    let subtype = this.elementType.datatype
    return 'array' + (subtype ? `:${subtype}` : '')
  }

  buildHelpHints (hints) {
    this.elementType.buildHelpHints(hints)
    const datatypeIndex = hints.findIndex(h => h === this.elementType.datatype)
    if (datatypeIndex !== -1) hints[datatypeIndex] = this.datatype
  }

  isApplicable (currentValue, previousValue, slurpedArg) {
    // remove last element if previous value was not explicit
    if (this._value && this._value.length && typeof previousValue !== 'string') {
      this._value = this._value.slice(0, -1)
    }
    this.elementType.isApplicable(currentValue, previousValue, slurpedArg)
    return true // TODO this is greedy (`--key=one two` includes `one` and `two`), make this configurable
  }

  observeAlias (alias) {
    if (!this._cumulative) this._value = []
    this.elementType.observeAlias(alias)
  }

  setValue (value) {
    // console.log('array.js > setValue:', value, 'for', this.helpFlags)
    if (Array.isArray(value)) {
      this._value = (this._value || []).concat(value)
      return
    }
    if (value && this.delim && typeof value === 'string') {
      value.split(this.delim).forEach(v => this.addValue(v))
      return
    }
    this.addValue(value)
  }

  addValue (value) {
    this.elementType.setValue(value)
    if (!this._value) this._value = []
    // if (!this._value || !Array.isArray(this._value)) this._value = []
    let elementValue = this.elementType.value
    if (Array.isArray(elementValue) && this._value.length && this._value[this._value.length - 1] === elementValue) {
      return // we already have elementValue, it's just been modified
    }
    // console.log('array.js > this._value:', this._value)
    this._value.push(elementValue)
  }

  get isStrict () {
    return super.isStrict || this.elementType.isStrict
  }

  validateValue (value, context) {
    return Promise.all((value || []).map(v => this.elementType.validateValue(v, context))).then(validArray => {
      return (validArray || []).filter(isValid => !isValid).length === 0
    })
  }

  buildInvalidMessage (msgAndArgs) {
    super.buildInvalidMessage(msgAndArgs)
    const sub = {}
    this.elementType.buildInvalidMessage(sub)
    if (sub.msg) msgAndArgs.msg = sub.msg
    if (sub.args.length > msgAndArgs.args.length) msgAndArgs.args = msgAndArgs.args.concat(sub.args.slice(msgAndArgs.args.length))
  }

  reset () {
    super.reset()
    this._value = this._value.slice() // DO NOT LET _value AND _defaultVal REFERENCE THE SAME ARRAY OBJECT!
  }
}

module.exports = TypeArray
