'use strict'

const Type = require('./type')
const TypeString = require('./string')

class TypeEnum extends TypeString {
  static get (opts) {
    return new TypeEnum(opts)
  }

  constructor (opts) {
    super(Object.assign({ caseInsensitive: true }, opts))
  }

  configure (opts, override) {
    opts = opts || {}
    if (typeof override === 'undefined') override = true
    super.configure(opts, override)

    if (override || !this._choices.length) this._choices = opts.choices ? (this._choices || []).concat(opts.choices) : this._choices
    if (override || typeof this._caseInsensitive === 'undefined') this._caseInsensitive = 'caseInsensitive' in opts ? opts.caseInsensitive : this._caseInsensitive

    return this
  }

  choice (c) {
    if (c) this._choices = this._choices.concat(c)
    return this
  }

  get choices () {
    return this._choices
  }

  buildHelpHints (hints) {
    super.buildHelpHints(hints)
    // if (this.choices.length) hints.push('choices: ' + this.choices.join(', '))
    // if (this.choices.length) hints.push('one of: ' + this.choices.join(', '))
    if (this.choices.length) hints.push(this.choices.join(', '))
  }

  validateParsed (context) {
    return super.validateParsed(context).then(whenDone => {
      let value = this.value && (this._caseInsensitive ? this.value.toLocaleUpperCase() : this.value)
      if (
        this.source !== Type.SOURCE_DEFAULT &&
        this.choices.length &&
        !this.choices.some(c => {
          c = this._caseInsensitive ? String(c).toLocaleUpperCase() : String(c)
          return c === value
        })
      ) {
        context.cliMessage('Value "%s" is invalid for argument %s. Choices are: %s', this.value, this.aliases.join(' or '), this.choices.join(', '))
      }
      return this.resolve()
    })
  }
}

module.exports = TypeEnum
