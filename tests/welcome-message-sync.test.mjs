import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const readSource = relativePath =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const source = readSource('src/utils/welcomeMessage.ts')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const module = { exports: {} }
new Function('exports', 'module', compiled)(module.exports, module)

const {
  getDefaultWelcomeMessage,
  getVirtualAssistantWelcomeMessage,
  syncDefaultWelcomeMessage,
} = module.exports

test('actualiza la plantilla del asistente virtual al cambiar el negocio', () => {
  const initial = getVirtualAssistantWelcomeMessage('Bella Luna')
  assert.equal(
    syncDefaultWelcomeMessage(initial, 'Bella Luna', 'Pastas Don Carlos'),
    '¡Hola! Soy el asistente virtual de Pastas Don Carlos. ¿En qué te puedo ayudar?',
  )
})

test('actualiza el mensaje generado varias veces mientras siga siendo predeterminado', () => {
  const first = getDefaultWelcomeMessage('Bella Luna')
  const second = syncDefaultWelcomeMessage(first, 'Bella Luna', 'Pastas Don Carlos')
  assert.equal(second, getDefaultWelcomeMessage('Pastas Don Carlos'))
  assert.equal(
    syncDefaultWelcomeMessage(second, 'Pastas Don Carlos', 'Casa de Pastas'),
    getDefaultWelcomeMessage('Casa de Pastas'),
  )
})

test('actualiza una plantilla predeterminada que conserva un nombre anterior', () => {
  const staleDefault = getDefaultWelcomeMessage('Negocio de prueba')
  assert.equal(
    syncDefaultWelcomeMessage(staleDefault, 'Tannat & Co', 'Pastas Don Carlos'),
    getDefaultWelcomeMessage('Pastas Don Carlos'),
  )
})

test('conserva exactamente un mensaje personalizado al cambiar el nombre', () => {
  const custom = '¡Hola! Bienvenido a nuestro local 😊\nRespondemos consultas sobre productos, horarios y pedidos.'
  assert.equal(syncDefaultWelcomeMessage(custom, 'Bella Luna', 'Pastas Don Carlos'), custom)
})

test('un mensaje personalizado después de renombrar no vuelve a sincronizarse', () => {
  const defaultAfterRename = syncDefaultWelcomeMessage(
    getDefaultWelcomeMessage('Bella Luna'),
    'Bella Luna',
    'Pastas Don Carlos',
  )
  assert.equal(defaultAfterRename, getDefaultWelcomeMessage('Pastas Don Carlos'))

  const custom = 'Mensaje personalizado después del primer cambio'
  assert.equal(syncDefaultWelcomeMessage(custom, 'Pastas Don Carlos', 'Casa de Pastas'), custom)
})

test('la configuración usa comparación exacta y no reemplazos parciales', () => {
  const page = readSource('src/pages/BusinessConfigPage.tsx')
  assert.match(page, /syncDefaultWelcomeMessage\([\s\S]*prev\.mensajeBienvenida,[\s\S]*prev\.nombre,[\s\S]*value/)
  assert.doesNotMatch(source, /\.includes\(|\.replace\(/)
})
