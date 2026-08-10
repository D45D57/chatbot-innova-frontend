import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(
  new URL('../src/services/publicChatSessionStorage.ts', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const module = { exports: {} }

function createStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
  }
}

globalThis.sessionStorage = createStorage()
new Function('exports', 'module', 'sessionStorage', compiled)(module.exports, module, globalThis.sessionStorage)

const {
  readStoredConsultation,
  reconcileReturnedSession,
  saveStoredConsultation,
} = module.exports

test.beforeEach(() => {
  globalThis.sessionStorage.clear()
})

test('la misma sesión conserva y recupera su consultationId', () => {
  saveStoredConsultation('negocio', 'session-1', 'consulta-1')
  assert.equal(reconcileReturnedSession('negocio', 'session-1', 'session-1'), false)
  assert.equal(readStoredConsultation('negocio', 'session-1'), 'consulta-1')
})

test('una sesión nueva elimina inmediatamente la consulta anterior', () => {
  saveStoredConsultation('negocio', 'session-1', 'consulta-1')
  assert.equal(reconcileReturnedSession('negocio', 'session-1', 'session-2'), true)
  assert.equal(readStoredConsultation('negocio', 'session-2'), null)
})

test('sin sesión previa descarta una referencia de consulta que no puede validar', () => {
  globalThis.sessionStorage.setItem('emprendebot:consulta:negocio', 'consulta-legacy')
  assert.equal(reconcileReturnedSession('negocio', null, 'session-1'), true)
  assert.equal(readStoredConsultation('negocio', 'session-1'), null)
})

test('nunca reutiliza una consulta estructurada de otra sesión', () => {
  saveStoredConsultation('negocio', 'session-1', 'consulta-1')
  assert.equal(readStoredConsultation('negocio', 'session-2'), null)
})

test('migra el consultationId legacy cuando la sesión activa fue conservada', () => {
  globalThis.sessionStorage.setItem('emprendebot:consulta:negocio', 'consulta-legacy')
  assert.equal(readStoredConsultation('negocio', 'session-1'), 'consulta-legacy')
  assert.deepEqual(
    JSON.parse(globalThis.sessionStorage.getItem('emprendebot:consulta:negocio')),
    { sessionId: 'session-1', consultationId: 'consulta-legacy' },
  )
})
