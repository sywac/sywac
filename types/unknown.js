'use strict'

const Type = require('./type')

class TypeUnknown extends Type {
  static get (opts) {
    return new TypeUnknown(opts)
  }

  constructor (opts) {
    super(Object.assign({
      aliases: '_',
      defaultValue: []
    }, opts))
  }

  get datatype () {
    return 'array'
  }

  parse (context) {
    // find all slurped args that have unclaimed kv pairs
    let unknownSlurped = []
    let unclaimed, argParsedLength
    context.slurped.forEach(arg => {
      // filter arg.parsed to unclaimed
      argParsedLength = arg.parsed.length
      unclaimed = arg.parsed.map((kv, kvIndex) => {
        return {
          key: kv.key,
          value: kv.value,
          claimed: kv.claimed,
          last: kvIndex === argParsedLength - 1
        }
      }).filter(kv => !kv.claimed)
      if (unclaimed.length) {
        unknownSlurped.push({
          raw: arg.raw,
          index: arg.index,
          parsed: unclaimed
        })
      }
    })
    // console.log('unknownSlurped:', JSON.stringify(unknownSlurped, null, 2))

    // TODO when setting context.argv below, add to context.details.types ??
    let unparsed = [], prev = [{}]
    unknownSlurped.forEach(arg => {
      arg.parsed.forEach(kv => {
        if (kv.key) context.argv[kv.key] = kv.value // TODO attempt to coerce to correct type?
        else unparsed.push({ raw: arg.raw, index: arg.index })
      })
      if (!arg.parsed[arg.parsed.length - 1].key && prev[prev.length - 1].key && prev[prev.length - 1].last) {
        context.argv[prev[prev.length - 1].key] = arg.parsed[arg.parsed.length - 1].value // TODO attempt to coerce to correct type?
        unparsed = unparsed.slice(0, -1)
      }
      prev = arg.parsed
    })
    this._value = unparsed.map(arg => {
      this._addPosition(arg.index)
      this._addRaw(arg.raw)
      return arg.raw
    }).concat(context.details.args.slice(context.args.length).map((arg, index) => {
      this._addPosition(context.args.length + index)
      this._addRaw(arg)
      return arg
    }))

    if (this._value.length > 0) this._source = Type.SOURCE_ARG

    return super.resolve()
  }
}

module.exports = TypeUnknown
