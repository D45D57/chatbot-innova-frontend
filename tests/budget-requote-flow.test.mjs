import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = relativePath =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const detailPage = readSource('src/pages/PresupuestoDetailPage.tsx')
const listPage = readSource('src/pages/PresupuestosPage.tsx')

test('una recotizacion exitosa vuelve al listado general reemplazando el historial', () => {
  const quoteFlow = detailPage.slice(
    detailPage.indexOf('const handleQuote'),
    detailPage.indexOf('const canQuote'),
  )

  assert.match(quoteFlow, /await cotizarPresupuesto/)
  assert.match(quoteFlow, /navigate\('\/presupuestos', \{[\s\S]*replace: true/)
  assert.match(quoteFlow, /Presupuesto actualizado con éxito\. Ya está listo para enviar al cliente\./)
  assert.doesNotMatch(quoteFlow, /setPresupuesto\(response\.presupuesto\)/)
  assert.match(quoteFlow, /catch \(quoteError\)[\s\S]*setError\(readableError\(quoteError\)\)/)
})

test('el listado consume el mensaje, lo muestra accesible y ejecuta un GET nuevo', () => {
  assert.match(listPage, /useLocation\(\)/)
  assert.match(listPage, /navigate\(`\$\{location\.pathname\}\$\{location\.search\}`, \{ replace: true, state: null \}\)/)
  assert.match(listPage, /window\.setTimeout\(\(\) => setSuccessMessage\(''\), 4000\)/)
  assert.match(listPage, /role="status" aria-live="polite"/)
  assert.match(listPage, /useEffect\(\(\) => \{[\s\S]*loadBudgets\(\)/)
  assert.match(listPage, /getPresupuestos\(/)
})
