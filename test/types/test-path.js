'use strict'

const tap = require('tap')
const Api = require('../../api')
const path = require('path')

const parent = path.basename(__filename, '.js')
const helper = require('../helper').get(parent)
const assertNoErrors = helper.assertNoErrors.bind(helper)
const assertTypeDetails = helper.assertTypeDetails.bind(helper)

const SLASH = path.sep
const DIRBASENAME = path.basename(__dirname)
const DNE = 'blerg_dne'

tap.test('path > mustExist true', t => {
  const api = Api.get().path('-p, --path', { mustExist: true })
  return api.parse(`-p ${__filename}`).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.p, __filename)
    t.equal(result.argv.path, __filename)
    assertTypeDetails(t, result, 1, ['p', 'path'], 'path', __filename, 'flag', [0, 1], ['-p', __filename])
    return api.parse(`-p ${__dirname}`)
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.p, __dirname)
    t.equal(result.argv.path, __dirname)
    assertTypeDetails(t, result, 1, ['p', 'path'], 'path', __dirname, 'flag', [0, 1], ['-p', __dirname])
    return api.parse(`-p ${DNE}`)
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The path does not exist: ${DNE}`))
    t.equal(result.errors.length, 0)
  })
})

tap.test('path > mustExist false', t => {
  const api = Api.get().path('-p, --path', { mustExist: false })
  return api.parse(`-p ${__filename}`).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The file already exists: ${__filename}`))
    t.equal(result.errors.length, 0)
    return api.parse(`-p ${__dirname}`)
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The directory already exists: ${__dirname}`))
    t.equal(result.errors.length, 0)
    return api.parse(`-p ${DNE}`)
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.p, DNE)
    t.equal(result.argv.path, DNE)
    assertTypeDetails(t, result, 1, ['p', 'path'], 'path', DNE, 'flag', [0, 1], ['-p', DNE])
  })
})

tap.test('file > mustExist true', t => {
  const api = Api.get().file('-f, --file', { mustExist: true })
  return api.parse(`-f ${__filename}`).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.f, __filename)
    t.equal(result.argv.file, __filename)
    assertTypeDetails(t, result, 1, ['f', 'file'], 'file', __filename, 'flag', [0, 1], ['-f', __filename])
    return api.parse(`-f ${__dirname}`)
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The path is a directory: ${__dirname}`))
    t.equal(result.errors.length, 0)
    return api.parse(`-f ${DNE}`)
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The file does not exist: ${DNE}`))
    t.equal(result.errors.length, 0)
  })
})

tap.test('file > mustExist false', t => {
  const api = Api.get().file('-f, --file', { mustExist: false })
  return api.parse(`-f ${__filename}`).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The file already exists: ${__filename}`))
    t.equal(result.errors.length, 0)
    return api.parse(`-f ${__dirname}`)
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The path exists and is a directory: ${__dirname}`))
    t.equal(result.errors.length, 0)
    return api.parse(`-f ${DNE}`)
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.f, DNE)
    t.equal(result.argv.file, DNE)
    assertTypeDetails(t, result, 1, ['f', 'file'], 'file', DNE, 'flag', [0, 1], ['-f', DNE])
  })
})

tap.test('dir > mustExist true', t => {
  const api = Api.get().dir('-d, --dir', { mustExist: true })
  return api.parse(`-d ${__filename}`).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The path is a file: ${__filename}`))
    t.equal(result.errors.length, 0)
    return api.parse(`-d ${__dirname}`)
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.d, __dirname)
    t.equal(result.argv.dir, __dirname)
    assertTypeDetails(t, result, 1, ['d', 'dir'], 'dir', __dirname, 'flag', [0, 1], ['-d', __dirname])
    return api.parse(`-d ${DNE}`)
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The directory does not exist: ${DNE}`))
    t.equal(result.errors.length, 0)
  })
})

tap.test('dir > mustExist false', t => {
  const api = Api.get().dir('-d, --dir', { mustExist: false })
  return api.parse(`-d ${__filename}`).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The path exists and is a file: ${__filename}`))
    t.equal(result.errors.length, 0)
    return api.parse(`-d ${__dirname}`)
  }).then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The directory already exists: ${__dirname}`))
    t.equal(result.errors.length, 0)
    return api.parse(`-d ${DNE}`)
  }).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.d, DNE)
    t.equal(result.argv.dir, DNE)
    assertTypeDetails(t, result, 1, ['d', 'dir'], 'dir', DNE, 'flag', [0, 1], ['-d', DNE])
  })
})

tap.test('path > normalize', t => {
  const dirnameEquivalent = `${__dirname}${SLASH}..${SLASH}${DIRBASENAME}`
  return Api.get().path('-p, --path', { normalize: true }).parse(`-p ${dirnameEquivalent}`).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.p, __dirname)
    t.equal(result.argv.path, __dirname)
    assertTypeDetails(t, result, 1, ['p', 'path'], 'path', __dirname, 'flag', [0, 1], ['-p', dirnameEquivalent])
  })
})

tap.test('path > normalize asWin32', t => {
  const dirnamePosix = __dirname.split(SLASH).join('/')
  const dirnameWin32 = __dirname.split(SLASH).join('\\')
  return Api.get().path('-p, --path', { normalize: true, asWin32: true }).parse(`-p ${dirnamePosix}`).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.p, dirnameWin32)
    t.equal(result.argv.path, dirnameWin32)
    assertTypeDetails(t, result, 1, ['p', 'path'], 'path', dirnameWin32, 'flag', [0, 1], ['-p', dirnamePosix])
  })
})

tap.test('path > asObject', t => {
  return Api.get().path('-p', { asObject: true }).parse(`-p ${__filename}`).then(result => {
    assertNoErrors(t, result)
    t.equal(result.argv.p && result.argv.p.dir, __dirname)
    t.equal(result.argv.p && result.argv.p.base, `${parent}.js`)
    t.equal(result.argv.p && result.argv.p.ext, '.js')
    t.equal(result.argv.p && result.argv.p.name, parent)
  })
})

tap.test('path > validate default value in strict mode', t => {
  return Api.get().path('-p <path>', {
    defaultValue: DNE,
    mustExist: true
  }).parse('').then(result => {
    t.equal(result.code, 1)
    t.match(result.output, new RegExp(`The path does not exist: ${DNE}`))
    t.equal(result.errors.length, 0)
  })
})
