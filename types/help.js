'use strict'

const Type = require('./type')
const TypeBoolean = require('./boolean')

class TypeHelp extends TypeBoolean {
  static get (opts) {
    return new TypeHelp(opts)
  }

  constructor (opts) {
    super(Object.assign({ desc: 'Show help', implicitCommand: true }, opts))
  }

  configure (opts, override) {
    opts = opts || {}
    if (typeof override === 'undefined') override = true
    super.configure(opts, override)

    if (override || typeof this._implicitCommand === 'undefined') {
      this._implicitCommand = 'implicitCommand' in opts ? opts.implicitCommand : this._implicitCommand
    }

    return this
  }

  get implicitCommands () {
    if (!this._implicitCommand) return []
    return this.aliases.filter(alias => alias.length > 1)
  }

  buildHelpHints (hints) {
    let commands = this.implicitCommands
    if (commands.length) hints.push('commands: ' + commands.join(', '))
    super.buildHelpHints(hints)
  }

  validateConfig (utils) {
    if (!this._flags && !this._aliases.length) this._aliases.push('help')
    super.validateConfig(utils)
  }

  validateParsed (context) {
    if (this.value) this.requestHelp(context) // must call this before postParse in case of commands
    return this.resolve()
  }

  implicitCommandFound (source, position, raw, context) {
    this.setValue(true)
    this.applySource(source, position, raw)
    this.requestHelp(context) // must call this before postParse in case of commands
  }

  requestHelp (context) {
    context.deferHelp() // TODO pass opts from this type config
  }
}

module.exports = TypeHelp
