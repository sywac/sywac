'use strict'

class Type {
  static get SOURCE_DEFAULT () {
    return 'default'
  }

  static get SOURCE_ARG () {
    return 'arg'
  }

  constructor (opts) {
    opts = opts || {}
    // configurable for parsing
    this._aliases = !!opts.aliases ? [].concat(opts.aliases) : []
    this._defaultVal = opts.defaultValue
    // configurable for help text
    this._flags = opts.flags
    this._desc = opts.description || opts.desc
    // prepare for parsing
    this.reset()
  }

  get datatype () {
    // subtypes should override this so as not to rely on this._value
    // because it's used for help text hints, when value is not set
    return Array.isArray(this._value) ? 'array' : typeof this._value
  }

  // == before parsing ==
  alias (a) {
    if (a) this._aliases = this._aliases.concat(a)
    return this
  }

  get aliases () {
    return this._aliases
  }

  defaultValue (dv) {
    this._defaultVal = dv
    return this
  }

  get defaultVal () {
    return this._defaultVal
  }

  flags (f) {
    this._flags = f
    return this
  }

  get helpFlags () {
    return this._flags
  }

  description (d) {
    this._desc = d
    return this
  }

  get helpDesc () {
    return this._desc
  }

  get helpHints () {
    let datatype = this.datatype
    return datatype ? `[${datatype}]` : '' // TODO this
  }

  get helpGroup () {
    return 'Options:' // TODO this too
  }

  validateConfig (utils) {
    // derive flags from aliases
    if (typeof this._flags !== 'string' && this._aliases.length) {
      this._flags = utils.aliasesToFlags(this._aliases)
    }
    // nornalize aliases or derive from flags
    if (this._aliases.length) {
      this._aliases = utils.normalizeAliases(this._aliases)
    } else if (typeof this._flags === 'string' && this._flags.length) {
      this._aliases = utils.flagsToAliases(this._flags)
    }
    // console.log(`aliases=${this.aliases}, flags=${this.helpFlags}`)
    // validate aliases
    if (!this._aliases.length) {
      throw new Error(`${this.constructor.name} requires aliases or flags.`)
    }
  }

  // + parse <-- async?
  // - interactivePrompt ?
  // + rawGiven
  // + keys or aliases
  // + value
  // + positions (key + values?)
  // - required
  // - helpGroup
  // + helpKeys: all flagged aliases
  // x helpPlaceholder: all value aliases
  // + helpDesc
  // - helpHints
  // typeName ?

  // resolveSlow () {
  //   let self = this
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       console.log('resolve', self.constructor.name)
  //       resolve(self)
  //     }, 500)
  //   })
  // }

  resolve () {
    // console.log('resolve', this.constructor.name)
    return Promise.resolve(this)
  }

  // == parsing ==
  parse (context) {
    // console.log('parse', this.constructor.name)
    let lookForValueArg = true, set = -2
    context.slurped.forEach(arg => {
      if (arg.index === (set + 1) && lookForValueArg && arg.parsed.length === 1 && !arg.parsed[0].key && this.isApplicableValue(arg.parsed[0].value)) {
        this.setValue(arg.parsed[0].value)
        this.applySource(Type.SOURCE_ARG, arg.index, arg.raw)
        arg.parsed[0].claimed = true
        return
      }

      arg.parsed.forEach((kv, kvIndex) => {
        this.aliases.forEach(alias => {
          if (alias === kv.key) {
            lookForValueArg = this.setValue(kv.value) && (alias.length > 1 || kvIndex === arg.parsed.length - 1)
            if (set !== arg.index) this.applySource(Type.SOURCE_ARG, arg.index, arg.raw)
            set = arg.index
            kv.claimed = true
          }
        })
      })
    })

    if (set === -2) {
      this.setValue(this.defaultVal)
      this._source = Type.SOURCE_DEFAULT
    }

    return this.resolve()
  }

  postParse (context) {
    // TODO do type-specific validation here ??
    // console.log('postParse', this.constructor.name)
    return this.resolve()
  }

  applySource (source, position, raw) {
    this._source = source
    this._addPosition(position)
    this._addRaw(raw)
  }

  isApplicableValue (value) {
    return true
  }

  setValue (value) {
    this._value = value
    return true
  }

  // == after parsing ==
  get value () {
    return this._value
  }

  get source () {
    return this._source
  }

  _addPosition (p) {
    this._position = (this._position || []).concat(p)
  }

  get position () {
    return this._position
  }

  _addRaw (r) {
    this._raw = (this._raw || []).concat(r)
  }

  get raw () {
    return this._raw
  }

  reset () {
    this._value = this._defaultVal
    this._source = Type.SOURCE_DEFAULT // e.g. arg, env, configfile
    this._position = []
    this._raw = []
  }

  toObject () {
    return {
      // populated via config
      aliases: this.aliases,
      datatype: this.datatype,
      defaultVal: this.defaultVal,
      helpFlags: this.helpFlags,
      helpDesc: this.helpDesc,
      helpHints: this.helpHints,
      helpGroup: this.helpGroup,
      // populated via parse
      value: this.value,
      source: this.source,
      position: this.position,
      raw: this.raw
    }
  }

  toResult () {
    return {
      // populated via config
      aliases: this.aliases,
      datatype: this.datatype,
      // defaultVal: this.defaultVal,
      // helpFlags: this.helpFlags,
      // helpDesc: this.helpDesc,
      // helpHints: this.helpHints,
      // helpGroup: this.helpGroup,
      // populated via parse
      value: this.value,
      source: this.source,
      position: this.position,
      raw: this.raw
    }
  }
}

module.exports = Type
