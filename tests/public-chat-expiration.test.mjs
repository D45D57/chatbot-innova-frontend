import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

async function loadLifecycleModule() {
  const source = await readFile(new URL('../src/services/publicChatLifecycle.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}

const lifecycle = await loadLifecycleModule()

test('propaga el evento de expiración junto con la transición de sesión', () => {
  assert.deepEqual(
    lifecycle.createPublicChatLifecycleFields('SESSION_EXPIRED_INACTIVITY', true),
    {
      chatLifecycleEvent: 'SESSION_EXPIRED_INACTIVITY',
      chatSessionChanged: true,
    },
  )
  assert.deepEqual(lifecycle.createPublicChatLifecycleFields(undefined, false), {
    chatLifecycleEvent: null,
    chatSessionChanged: false,
  })
})

test('agrega aviso y saludo sólo cuando backend informa expiración', () => {
  assert.deepEqual(lifecycle.createSessionStartTexts('Bienvenido', null), ['Bienvenido'])
  assert.deepEqual(
    lifecycle.createSessionStartTexts('Bienvenido', 'SESSION_EXPIRED_INACTIVITY'),
    [lifecycle.INACTIVITY_EXPIRED_MESSAGE, 'Bienvenido'],
  )
})

test('la rotación conserva el historial visual, retira controles y no duplica el aviso', () => {
  const history = [
    { id: 'user-1', role: 'user', text: 'Hola', quickReplies: ['vieja'] },
    { id: 'bot-1', role: 'bot', text: 'Respuesta', products: ['viejo'] },
  ]
  const start = [
    { id: 'notice', role: 'bot', text: lifecycle.INACTIVITY_EXPIRED_MESSAGE },
    { id: 'welcome', role: 'bot', text: 'Bienvenido', quickReplies: ['nueva'] },
  ]
  const rotated = lifecycle.mergeSessionStartMessages(history, start)

  assert.deepEqual(rotated.map(message => message.text), [
    'Hola',
    'Respuesta',
    lifecycle.INACTIVITY_EXPIRED_MESSAGE,
    'Bienvenido',
  ])
  assert.equal('quickReplies' in rotated[0], false)
  assert.equal('products' in rotated[1], false)
  assert.deepEqual(rotated.at(-1).quickReplies, ['nueva'])

  const repeated = lifecycle.mergeSessionStartMessages(rotated, start)
  assert.equal(
    repeated.filter(message => message.text === lifecycle.INACTIVITY_EXPIRED_MESSAGE).length,
    1,
  )
})

test('un 409 CONSULTATION_CLOSED crea reemplazo y reintenta una sola vez', async () => {
  const sends = []
  let invalidations = 0
  let creations = 0

  const result = await lifecycle.sendWithConsultationRecovery({
    consultationId: 'old',
    getCurrentConsultationId: async () => 'old',
    send: async id => {
      sends.push(id)
      if (id === 'old') throw { status: 409, code: 'CONSULTATION_CLOSED' }
    },
    invalidateConsultation: () => { invalidations += 1 },
    createReplacementConsultation: async () => {
      creations += 1
      return 'new'
    },
  })

  assert.equal(result, 'new')
  assert.deepEqual(sends, ['old', 'new'])
  assert.equal(invalidations, 1)
  assert.equal(creations, 1)
})

test('si falla el reintento no inicia un ciclo de recuperación', async () => {
  const sends = []
  let creations = 0

  await assert.rejects(lifecycle.sendWithConsultationRecovery({
    consultationId: 'old',
    getCurrentConsultationId: async () => 'old',
    send: async id => {
      sends.push(id)
      throw { status: 409, code: 'CONSULTATION_CLOSED' }
    },
    invalidateConsultation: () => undefined,
    createReplacementConsultation: async () => {
      creations += 1
      return 'new'
    },
  }))

  assert.deepEqual(sends, ['old', 'new'])
  assert.equal(creations, 1)
})

test('otros errores no invalidan ni crean una consulta', async () => {
  let invalidations = 0
  let creations = 0

  await assert.rejects(lifecycle.sendWithConsultationRecovery({
    consultationId: 'current',
    getCurrentConsultationId: async () => 'current',
    send: async () => { throw { status: 409, code: 'OTHER_CONFLICT' } },
    invalidateConsultation: () => { invalidations += 1 },
    createReplacementConsultation: async () => {
      creations += 1
      return 'new'
    },
  }))

  assert.equal(invalidations, 0)
  assert.equal(creations, 0)
})
