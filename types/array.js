'use strict'

const TypeWrapper = require('./wrapper')

class TypeArray extends TypeWrapper {
  static get (opts) {
    return new TypeArray(opts)
  }

  constructor (opts) {
    opts = opts || {}
    super(Object.assign({ defaultValue: [] }, opts))
    // this._elementType = opts.elementType || opts.of

    if ('delimiter' in opts) this._delim = opts.delimiter
    else if ('delim' in opts) this._delim = opts.delim
    else this._delim = ','

    if ('cumulative' in opts) this._cumulative = opts.cumulative
    else this._cumulative = true
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

  /*
  validateConfig (utils) {
    let hasSubtype = !!this._elementType
    let hasFlagsOrAliases = !!this._aliases.length || (typeof this._flags === 'string' && !!this._flags.length)

    if (!hasSubtype && !hasFlagsOrAliases) {
      // gotta give me something
      throw new Error(`${this.constructor.name} requires an element type.`)
    } else if (!hasSubtype && hasFlagsOrAliases) {
      // implicitly use TypeString
      this._elementType = require('./string').get().alias(this.aliases).flags(this.helpFlags)
    } else if (hasSubtype && !hasFlagsOrAliases) {
      // use flags/aliases from subtype, if given
      this.alias(this._elementType.aliases).flags(this._elementType.helpFlags)
    }

    super.validateConfig(utils)
  }
  */

  get datatype () {
    let subtype = this.elementType.datatype
    return 'array' + (subtype ? `:${subtype}` : '')
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

  reset () {
    super.reset()
    this._value = this._value.slice() // DO NOT LET _value AND _defaultVal REFERENCE THE SAME ARRAY OBJECT!
  }
}

module.exports = TypeArray
