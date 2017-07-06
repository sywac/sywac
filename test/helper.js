'use strict'

class TestHelper {
  static get (parent) {
    return new TestHelper(parent)
  }

  constructor (parent) {
    this.parent = parent
  }

  assertNoErrors (t, result) {
    t.equal(result.code, 0)
    t.equal(result.output, '')
    t.equal(result.errors.length, 0)
  }

  assertTypeDetails (t, result, index, aliases, datatype, value, source, position, raw) {
    t.equal(result.details.types[index].parent, this.parent)
    t.same(result.details.types[index].aliases, aliases)
    t.equal(result.details.types[index].datatype, datatype)
    if (Array.isArray(value)) {
      t.same(result.details.types[index].value, value)
    } else if (value !== '_SKIP_') {
      t.equal(result.details.types[index].value, value)
    }
    t.equal(result.details.types[index].source, source)
    t.same(result.details.types[index].position, position)
    t.same(result.details.types[index].raw, raw)
  }
}

module.exports = TestHelper
