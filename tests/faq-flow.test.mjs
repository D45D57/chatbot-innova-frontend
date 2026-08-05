import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('el frontend no contiene un catálogo local de sugerencias', () => {
  assert.equal(
    existsSync(new URL('../src/services/faqFallbackSuggestions.ts', import.meta.url)),
    false,
  )

  const sourceFiles = [
    'src/pages/FaqPage.tsx',
    'src/services/faqApi.ts',
    'src/hooks/useFaqs.ts',
  ].map(readSource).join('\n')

  for (const question of [
    '¿Qué medios de pago aceptan?',
    '¿Realizan envíos?',
    '¿Cuál es el horario de atención?',
    '¿Tienen stock disponible?',
    '¿Realizan ventas por mayor?',
    '¿Aceptan cambios o devoluciones?',
    '¿Los productos tienen garantía?',
  ]) {
    assert.equal(sourceFiles.includes(question), false)
  }
})

test('el flujo obtiene sugerencias del backend y confirma solo IDs', () => {
  const api = readSource('src/services/faqApi.ts')
  const page = readSource('src/pages/FaqPage.tsx')

  assert.match(api, /getFaqSuggestionsApi/)
  assert.match(api, /\/faqs\/suggestions/)
  assert.match(api, /\/faqs\/from-suggestions/)
  assert.match(api, /JSON\.stringify\(\{ suggestionIds \}\)/)
  assert.match(page, /getFaqSuggestionsApi/)
  assert.match(page, /createFromSuggestions\(selectedSuggestionIds\)/)
})

test('la experiencia FAQ no expone activa, inactiva ni un switch', () => {
  const faqUi = [
    'src/pages/FaqPage.tsx',
    'src/components/faq/FaqCard.tsx',
    'src/components/faq/FaqForm.tsx',
    'src/hooks/useFaqs.ts',
  ].map(readSource).join('\n')

  assert.doesNotMatch(faqUi, /\bactiva\b|\binactiva\b|toggleFaq|role="switch"/i)
})
