'use strict'

class Api {
  static get (opts) {
    return new Api(opts)
  }

  constructor (opts) {
    this.types = []
    this._helpOpts = {}
    this._factories = {
      context: this.getContext,
      helpBuffer: this.getHelpBuffer,
      boolean: this.getBoolean,
      string: this.getString,
      number: this.getNumber,
      help: this.getHelpType,
      array: this.getArray,
      positional: this.getPositional
    }
    this.configure(opts)
  }

  configure (opts) {
    opts = opts || {}
    // lazily configured instance dependencies (expects a single instance)
    this._unknownType = opts.unknownType || this._unknownType
    this._utils = opts.utils || this._utils

    // lazily configured factory dependencies (expects a function to call per instance)
    if ('factories' in opts) {
      Object.keys(opts.factories).forEach(name => this.registerFactory(name, opts.factories[name]))
    }

    // other
    this._name = opts.name || this._name
    return this
  }

  // lazy dependency accessors
  get unknownType () {
    if (!this._unknownType) this._unknownType = require('./types/unknown').get()
    return this._unknownType
  }

  get utils () {
    if (!this._utils) this._utils = require('./lib/utils').get()
    return this._utils
  }

  get helpOpts () {
    return this._helpOpts
  }

  get name () {
    if (typeof this._name !== 'string') this._name = require('path').basename(process.argv[1], '.js')
    return this._name
  }

  // type factories
  registerFactory (name, factory) {
    if (name && typeof factory === 'function') this._factories[name] = factory
    return this
  }

  get (name, opts) {
    if (name && this._factories[name]) return this._factories[name].call(this, opts)
    return null
  }

  getContext (opts) {
    return require('./context').get(opts)
  }

  getHelpBuffer (opts) {
    return require('./buffer').get(opts)
  }

  getBoolean (opts) {
    return require('./types/boolean').get(opts)
  }

  getString (opts) {
    return require('./types/string').get(opts)
  }

  getNumber (opts) {
    return require('./types/number').get(opts)
  }

  getHelpType (opts) {
    return require('./types/help').get(opts)
  }

  getArray (opts) {
    return require('./types/array').get(opts)
  }

  getPositional (opts) {
    return require('./types/positional').get(opts)
  }

  // API
  usage (usage) {
    if (usage) this.helpOpts.usage = usage
    return this
  }

  positional (dsl, opts) {
    opts = opts || {}

    // TODO this logic is repetitive and messy
    if (Array.isArray(dsl)) {
      opts.params = dsl
    } else if (typeof dsl === 'object') {
      opts = dsl
    } else if (typeof dsl === 'string') {
      if (!this.helpOpts.usage) this.helpOpts.usage = dsl
      let array = this.utils.stringToMultiPositional(dsl)
      if (!opts.params) {
        opts.params = array
      } else if (Array.isArray(opts.params)) {
        opts.params = array.map((string, index) => {
          return opts.params[index] ? Object.assign({ flags: string }, opts.params[index]) : string
        })
      } else {
        opts.params = Object.keys(opts.params).map((key, index) => {
          let obj = opts.params[key]
          if (obj && !obj.flags) obj.flags = array[index]
          // if (obj && !obj.aliases) obj.aliases = key
          return obj
        })
      }
    }

    opts.ignore = [].concat(opts.ignore).filter(Boolean) // guarantee array

    let params = Array.isArray(opts.params) ? opts.params : Object.keys(opts.params).map(key => {
      let obj = opts.params[key]
      if (obj && !obj.flags) obj.flags = key
      return obj
    })
    // console.log('!!!\n', params, '\n!!!')
    let numSkipped = 0
    params.forEach((param, index) => {
      // accept an array of strings or objects
      if (typeof param === 'string' && param.length) param = { flags: param }
      if (!param.flags && param.aliases) param.flags = [].concat(param.aliases)[0]

      // allow "commentary" things in positional dsl string via opts.ignore
      if (!param || ~opts.ignore.indexOf(param.flags)) return numSkipped++

      // TODO if no flags or aliases, throw error

      // convenience to define descriptions in opts
      if (!(param.description || param.desc) && (opts.description || opts.desc)) {
        param.desc = [].concat(opts.description || opts.desc)[index - numSkipped]
      }

      let positionalFlags = param.flags
      delete param.flags
      param = Object.assign(this.utils.inferPositionalProperties(positionalFlags, Object.keys(this._factories)), param)
      if (!param.elementType) param.elementType = this._getType(param).configure(opts, false)
      param.flags = positionalFlags
      let positional = this.get('positional', param).configure(opts, false)
      if (this.unknownType) this.unknownType.addPositional(positional)
      this.custom(positional)
    })

    return this
  }

  // configure any arg type
  custom (type) {
    if (type) {
      if (typeof type.validateConfig === 'function') type.validateConfig(this.utils)
      this.types.push(type)
    }
    return this
  }

  _normalizeOpts (flags, opts) {
    opts = opts || {}
    if (Array.isArray(flags)) {
      opts.aliases = flags // treat an array as aliases
    } else if (typeof flags === 'string') {
      opts.flags = flags // treat a string as flags
    } else if (typeof flags === 'object') {
      opts = flags
    }
    return opts
  }

  _addType (flags, opts, name) {
    return this.custom(this._getType(flags, opts, name))
  }

  _getType (flags, opts, name) {
    opts = this._normalizeOpts(flags, opts)

    name = String(name || opts.type)
    if (name.indexOf(':') !== -1) {
      let types = name.split(':').filter(Boolean)
      if (types[0] === 'array') return this._getArrayType(flags, opts, types.slice(1).join(':') || 'string')
      name = types[0]
    }

    return this.get(name, opts)
  }

  _getArrayType (flags, opts, subtypeName) {
    opts = this._normalizeOpts(flags, opts) // TODO this may be redundant

    subtypeName = String(subtypeName || opts.type)
    if (subtypeName.indexOf(':') !== -1) {
      let types = subtypeName.split(':').filter(Boolean)
      if (types[0] === 'array') {
        opts.elementType = this._getArrayType(flags, opts, types.slice(1).join(':') || 'string')
        return this.get('array', opts)
      }
      subtypeName = types[0]
    }

    opts.elementType = this.get(subtypeName, opts)
    return this.get('array', opts)
  }

  // specify 'type' (as string) in opts
  option (flags, opts) {
    return this._addType(flags, opts)
  }

  // common individual value types
  boolean (flags, opts) {
    return this._addType(flags, opts, 'boolean')
  }

  string (flags, opts) {
    return this._addType(flags, opts, 'string')
  }

  number (flags, opts) {
    return this._addType(flags, opts, 'number')
  }

  // specialty types
  help (flags, opts) {
    return this._addType(flags, opts, 'help')
  }

  // multiple value types
  array (flags, opts) {
    return this._addType(flags, opts, 'array')
  }

  stringArray (flags, opts) {
    return this._addType(flags, opts, 'array:string')
  }

  numberArray (flags, opts) {
    return this._addType(flags, opts, 'array:number')
  }

  // TODO more types

  // once configured with types, parse and exec asynchronously
  // return a Promise<Result>
  parse (args) {
    let context = this.initContext().slurpArgs(args)

    let parsePromises = this.types.map(type => type.parse(context))

    return Promise.all(parsePromises).then(whenDone => {
      return (this.unknownType && this.unknownType.parse(context)) || Promise.resolve(true)
    }).then(whenDone => {
      // TODO before postParse, determine if any are promptable (and need prompting) and prompt each in series
      let postParse = this.types.map(type => type.postParse(context))
      if (this.unknownType) postParse = postParse.concat(this.unknownType.postParse(context))
      return Promise.all(postParse)
    }).then(whenDone => {
      let types = this.types.map(type => {
        let r = type.toResult()
        type.reset() // TODO instead of holding value within a Type itself, populate Context and reset should be unnecessary
        return r
      })
      if (this.unknownType) {
        types = types.concat(this.unknownType.toResult())
        this.unknownType.reset()
      }
      return context.toResult(types)
    })
  }

  initContext () {
    let helpOpts = Object.assign({ utils: this.utils }, this.helpOpts)
    if (typeof helpOpts.usage === 'string') helpOpts.usage = helpOpts.usage.replace('$0', this.name)
    let context = this.get('context', {
      utils: this.utils,
      helpBuffer: this.get('helpBuffer', helpOpts)
    })
    return context.withTypes(this.types.map(type => type.toObject()))
  }

  // optional convenience methods
  getHelp (opts) {
    return this.initContext().addHelp(opts).output
  }
}

module.exports = Api
