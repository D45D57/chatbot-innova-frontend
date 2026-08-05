import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const budgetsPage = readFileSync(
  new URL('../src/pages/PresupuestosPage.tsx', import.meta.url),
  'utf8',
)

test('Presupuestos expone únicamente los cinco filtros operativos', () => {
  for (const label of [
    'Todos',
    'Requieren cotización',
    'En seguimiento',
    'Concretados',
    'Rechazados',
  ]) {
    assert.match(budgetsPage, new RegExp(`label: '${label}'`))
  }

  assert.doesNotMatch(budgetsPage, /label: 'Pendientes'/)
  assert.doesNotMatch(budgetsPage, /label: 'En proceso'/)
  assert.doesNotMatch(budgetsPage, /label: 'Enviados'/)
})

test('Requieren cotización combina únicamente estados backend reales', () => {
  assert.match(budgetsPage, /getAllBudgetsByState\('PENDIENTE'\)/)
  assert.match(budgetsPage, /getAllBudgetsByState\('EN_PROCESO'\)/)
  assert.doesNotMatch(budgetsPage, /estado: 'cotizacion'/)
})

test('los filtros simples se traducen a estados backend reales', () => {
  assert.match(budgetsPage, /filter === 'seguimiento'\) return 'ENVIADO'/)
  assert.match(budgetsPage, /filter === 'concretado'\) return 'CONCRETADO'/)
  assert.match(budgetsPage, /filter === 'rechazado'\) return 'RECHAZADO'/)
})

test('las URLs técnicas anteriores se normalizan a los filtros nuevos', () => {
  assert.match(budgetsPage, /case 'pendiente':[\s\S]*case 'en_proceso':[\s\S]*return 'cotizacion'/)
  assert.match(budgetsPage, /case 'enviado':[\s\S]*return 'seguimiento'/)
  assert.match(budgetsPage, /useSearchParams/)
  assert.match(budgetsPage, /setSearchParams\(next, \{ replace: true \}\)/)
})
