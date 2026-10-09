import test from 'node:test'
import assert from 'node:assert/strict'
import api, { AUTH_STORAGE_KEY } from '../src/services/api.js'

test('Un 401 antiguo no borra una sesión nueva', async () => {
  const values = new Map([[AUTH_STORAGE_KEY, JSON.stringify({ accessToken: 'new-test-token' })]])
  const oldStorage = globalThis.localStorage
  const oldWindow = globalThis.window
  let events = 0
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  }
  globalThis.window = { dispatchEvent: () => events++ }
  try {
    const reject = api.interceptors.response.handlers[0].rejected
    await assert.rejects(reject({
      response: { status: 401, data: {} },
      config: { url: '/asistencias/historial', _authToken: 'old-test-token' },
    }))
    assert.ok(values.has(AUTH_STORAGE_KEY))
    assert.equal(events, 0)
    await assert.rejects(reject({
      response: { status: 401, data: {} },
      config: { url: '/asistencias/historial', _authToken: 'new-test-token' },
    }))
    assert.equal(values.has(AUTH_STORAGE_KEY), false)
    assert.equal(events, 1)
  } finally {
    globalThis.localStorage = oldStorage
    globalThis.window = oldWindow
  }
})

test('Los errores 500 no muestran detalles internos en las vistas', async () => {
  const error = { response: { status: 500, data: { message: 'SQL interno', trace: ['private'] } }, config: {} }
  await assert.rejects(api.interceptors.response.handlers[0].rejected(error))
  assert.equal(error.response.data.trace, undefined)
  assert.ok(!error.userMessage.includes('SQL'))
})
