'use strict'

class Api {
  static get (opts) {
    return new Api(opts)
  }

  constructor (opts) {
    this.types = []
    this.configure(opts)
  }

  configure (opts) {
    opts = opts || {}
    // lazily configured instance dependencies (expects a single instance)
    this._unknownType = opts.unknownType || this._unknownType
    this._utils = opts.utils || this._utils
    // lazily configured factory dependencies (expects a function to call per instance)
    this._contextFactory = opts.contextFactory || this._contextFactory
    this._helpBufferFactory = opts.helpBufferFactory || this._helpBufferFactory
    this._booleanFactory = opts.booleanFactory || this._booleanFactory
    this._stringFactory = opts.stringFactory || this._stringFactory
    this._numberFactory = opts.numberFactory || this._numberFactory
    this._helpTypeFactory = opts.helpTypeFactory || this._helpTypeFactory
    this._arrayFactory = opts.arrayFactory || this._arrayFactory
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

  get name () {
    if (typeof this._name !== 'string') this._name = require('path').basename(process.argv[1], '.js')
    return this._name
  }

  // factory wrapper methods
  newContext (opts) {
    if (typeof this._contextFactory !== 'function') this._contextFactory = require('./context').get
    return this._contextFactory(opts)
  }

  newHelpBuffer (opts) {
    if (typeof this._helpBufferFactory !== 'function') this._helpBufferFactory = require('./buffer').get
    return this._helpBufferFactory(opts)
  }

  newBoolean (opts) {
    if (typeof this._booleanFactory !== 'function') this._booleanFactory = require('./types/boolean').get
    return this._booleanFactory(opts)
  }

  newString (opts) {
    if (typeof this._stringFactory !== 'function') this._stringFactory = require('./types/string').get
    return this._stringFactory(opts)
  }

  newNumber (opts) {
    if (typeof this._numberFactory !== 'function') this._numberFactory = require('./types/number').get
    return this._numberFactory(opts)
  }

  newHelp (opts) {
    if (typeof this._helpTypeFactory !== 'function') this._helpTypeFactory = require('./types/help').get
    return this._helpTypeFactory(opts)
  }

  newArray (opts) {
    if (typeof this._arrayFactory !== 'function') this._arrayFactory = require('./types/array').get
    return this._arrayFactory(opts)
  }

  // API
  usage (usage) {
    // TODO this!
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

  _addType (flags, opts, factoryMethodName) {
    opts = opts || {}
    if (Array.isArray(flags)) {
      opts.aliases = flags // treat an array as aliases
    } else if (typeof flags === 'string') {
      opts.flags = flags // treat a string as flags
    } else if (typeof flags === 'object') {
      opts = flags
    }
    return this.custom(this[factoryMethodName](opts))
  }

  // common individual value types
  boolean (flags, opts) {
    return this._addType(flags, opts, 'newBoolean')
  }

  string (flags, opts) {
    return this._addType(flags, opts, 'newString')
  }

  number (flags, opts) {
    return this._addType(flags, opts, 'newNumber')
  }

  // specialty types
  help (flags, opts) {
    return this._addType(flags, opts, 'newHelp')
  }

  // multiple value types
  array (flags, opts) {
    return this._addType(flags, opts, 'newArray')
  }

  _addArray (flags, opts, subtypeFactoryMethodName) {
    opts = opts || {}
    if (!Array.isArray(flags) && typeof flags === 'object') opts = flags
    opts.elementType = this[subtypeFactoryMethodName](opts)
    return this.array(flags, opts)
  }

  stringArray (flags, opts) {
    return this._addArray(flags, opts, 'newString')
  }

  numberArray (flags, opts) {
    return this._addArray(flags, opts, 'newNumber')
  }

  // TODO more types

  // once configured with types, parse and exec asynchronously
  // return a Promise<Result>
  parse (args) {
    let context = this.initContext().slurpArgs(args)

    let parsePromises = this.types.map(type => type.parse(context))

    return Promise.all(parsePromises).then(whenDone => {
      if (!!this.unknownType) {
        return this.unknownType.parse(context.withTypes(this.types.map(type => {
          return type.toObject()
        })))
      }
      return Promise.resolve(true)
    }).then(whenDone => {
      let postParse = this.types.map(type => {
        return type.postParse(context)
      })
      if (!!this.unknownType) postParse = postParse.concat(this.unknownType.postParse(context))
      return postParse
    }).then(postParsePromises => {
      return Promise.all(postParsePromises) // TODO is this step necessary? test with resolveSlow
    }).then(whenDone => {
      let types = this.types.map(type => {
        let r = type.toResult()
        type.reset() // TODO instead of holding value within a Type itself, populate Context and reset should be unnecessary
        return r
      })
      if (!!this.unknownType) {
        types = types.concat(this.unknownType.toResult())
        this.unknownType.reset()
      }
      return context.toResult(types)
    })
  }

  initContext () {
    let context = this.newContext({
      utils: this.utils,
      helpBuffer: this.newHelpBuffer({ utils: this.utils })
    })
    return context.withTypes(this.types.map(type => type.toObject()))
  }

  // optional convenience methods
  getHelp (opts) {
    return this.initContext().addHelp(opts).output
  }
}

module.exports = Api
