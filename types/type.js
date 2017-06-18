'use strict'

class Type {
  static get SOURCE_DEFAULT () {
    return 'default'
  }

  static get SOURCE_FLAG () {
    return 'flag'
  }

  static get SOURCE_POSITIONAL () {
    return 'positional'
  }

  constructor (opts) {
    this._aliases = []
    this.configure(opts, true)
    // prepare for parsing
    this.reset()
  }

  configure (opts, override) {
    opts = opts || {}
    if (typeof override === 'undefined') override = true
    // configurable for parsing
    if (override || !this._aliases.length) this._aliases = opts.aliases ? (this._aliases || []).concat(opts.aliases) : this._aliases
    if (override || typeof this._defaultVal === 'undefined') this._defaultVal = 'defaultValue' in opts ? opts.defaultValue : this._defaultVal
    if (override || typeof this._required === 'undefined') this._required = 'required' in opts ? opts.required : this._required
    // configurable for help text
    if (override || !this._flags) this._flags = opts.flags || this._flags
    if (override || !this._desc) this._desc = opts.description || opts.desc || this._desc
    if (override || typeof this._hints === 'undefined') this._hints = 'hints' in opts ? opts.hints : this._hints
    if (override || !this._group) this._group = opts.group || this._group
    if (override || typeof this._hidden === 'undefined') this._hidden = 'hidden' in opts ? opts.hidden : this._hidden
    return this
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

  required (r) {
    this._required = r
    return this
  }

  get isRequired () {
    return !!this._required
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

  desc (d) {
    return this.description(d)
  }

  get helpDesc () {
    // if this isn't a string, it can mess up buffer.js logic
    return typeof this._desc === 'string' ? this._desc : ''
  }

  hints (h) {
    this._hints = h
    return this
  }

  get helpHints () {
    if (typeof this._hints !== 'undefined') return this._hints
    let hints = []
    this.buildHelpHints(hints)
    return hints.length ? '[' + hints.join('] [') + ']' : ''
  }

  buildHelpHints (hintsArray) {
    // datatype
    if (this.datatype) hintsArray.push(this.datatype)
    // default value
    let dv = this._defaultVal
    if (dv && (!Array.isArray(dv) || dv.length)) hintsArray.push(`default: ${dv}`)
  }

  group (g) {
    this._group = g
    return this
  }

  get helpGroup () {
    return this._group || 'Options:'
  }

  hidden (h) {
    this._hidden = h
    return this
  }

  get isHidden () {
    return !!this._hidden
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
  // + helpGroup
  // + helpKeys: all flagged aliases
  // x helpPlaceholder: all value aliases
  // + helpDesc
  // + helpHints
  // typeName ?

  // resolveSlow () {
  //   let self = this
  //   let timeout = Math.floor(Math.random() * 500)
  //   console.log('resolving %s in %d ms', self.constructor.name, timeout)
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       console.log('resolve', self.constructor.name)
  //       resolve(self)
  //     }, timeout)
  //   })
  // }

  resolve () {
    // console.log('resolve', this.constructor.name)
    return Promise.resolve(this)
    // return this.resolveSlow()
  }

  // async parsing
  parse (context) {
    // console.log('parse', this.constructor.name, this.helpFlags)
    let lastKeyMatchesAlias = false
    let anyKeyMatchedAlias = false
    let previousUsedValue
    // iterate over each slurped arg and determine if its key-value pairs are relevant to this type/option
    context.slurped.forEach(arg => {
      // if the last key seen applies to this type, see if a keyless value applies as the value
      // e.g. --key value1 value2 => (1) k=key v=true, (2) k='' v=value1, (3) k='' v=value2
      //      does value1 apply to key? how about value2?
      if (lastKeyMatchesAlias && arg.parsed.length === 1 && !arg.parsed[0].key && this.isApplicable(arg.parsed[0].value, previousUsedValue, arg)) {
        previousUsedValue = arg.parsed[0].value
        this.setValue(previousUsedValue)
        this.applySource(Type.SOURCE_FLAG, arg.index, arg.raw)
        arg.parsed[0].claimed = true
        return
      }

      arg.parsed.forEach((kv, kvIndex) => {
        if (!kv.key) return undefined
        let matchedAlias = this.aliases.find(alias => alias === kv.key)
        lastKeyMatchesAlias = !!matchedAlias
        if (matchedAlias) {
          anyKeyMatchedAlias = true
          this.observeAlias(matchedAlias)
          previousUsedValue = kv.value
          this.setValue(previousUsedValue) // TODO pass isExplicit arg ? or first check if isValid(value) ?
          this.applySource(Type.SOURCE_FLAG, arg.index, arg.raw)
          kv.claimed = true
        }
      })
    })

    if (!anyKeyMatchedAlias) {
      this.setValue(this.defaultVal)
      this._source = Type.SOURCE_DEFAULT
    }

    return this.validateParsed(context)
  }

  // async validation called from parse
  validateParsed (context) {
    // TODO do validation here, add any errors to context
    if (this.isRequired && this.source === Type.SOURCE_DEFAULT && !context.helpRequested) console.log('Missing required arg:', this.aliases)
    return this.resolve()
  }

  // async hook to execute after all parsing
  postParse (context) {
    // console.log('postParse', this.constructor.name)
    return this.resolve()
  }

  applySource (source, position, raw) {
    this._source = source
    this._addPosition(position)
    this._addRaw(raw)
  }

  isApplicable (currentValue, previousValue, slurpedArg) {
    // assumes (1) this type should hold a single value
    // and (2) a non-string previous value was not explicit
    // e.g. previous was not --key=value
    return typeof previousValue !== 'string'
  }

  observeAlias (alias) {}

  setValue (value) {
    this._value = value
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
    this._source = Type.SOURCE_DEFAULT
    // source precedence, most to least direct (for future reference):
    // 1. prompt (interactive mode only)
    // 2. arg
    // 3. stdin
    // 4. env
    // 5. configfile
    // 6. default
    this._position = []
    this._raw = []
  }

  toObject () {
    return {
      // populated via config
      aliases: this.aliases,
      datatype: this.datatype,
      defaultVal: this.defaultVal,
      isRequired: this.isRequired,
      helpFlags: this.helpFlags,
      helpDesc: this.helpDesc,
      helpHints: this.helpHints,
      helpGroup: this.helpGroup,
      isHidden: this.isHidden,
      // populated via parse
      value: this.value,
      source: this.source,
      position: this.position,
      raw: this.raw
    }
  }

  toResult () {
    // console.log('toResult', this.constructor.name, this.helpFlags)
    return {
      // populated via config
      // TODO add parent (mainly for commands) ??
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
