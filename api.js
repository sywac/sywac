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
    this._booleanFactory = opts.booleanFactory || this._booleanFactory
    this._stringFactory = opts.stringFactory || this._stringFactory
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

  newBoolean (opts) {
    if (typeof this._booleanFactory !== 'function') this._booleanFactory = require('./types/boolean').get
    return this._booleanFactory(opts)
  }

  newString (opts) {
    if (typeof this._stringFactory !== 'function') this._stringFactory = require('./types/string').get
    return this._stringFactory(opts)
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

  boolean (flags, opts) {
    return this._addType(flags, opts, 'newBoolean')
  }

  string (flags, opts) {
    return this._addType(flags, opts, 'newString')
  }

  // TODO more types

  // once configured with types, parse and exec asynchronously
  // return a Promise<Result>
  parse (args) {
    let context = this.newContext({ utils: this.utils })
    context.withTypes(this.types.map(type => {
      return type.toObject()
    })).slurpArgs(args)

    let parsePromises = this.types.map(type => {
      return type.parse(context)
    })

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
}

module.exports = Api
