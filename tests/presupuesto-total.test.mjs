import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const readSource = relativePath =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const source = readSource('src/utils/presupuestoTotal.ts')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const module = { exports: {} }
new Function('exports', 'module', compiled)(module.exports, module)

const { getEffectivePresupuestoTotal, isPresupuestoReadyToSend } = module.exports

test('prioriza un total positivo persistido por backend', () => {
  assert.equal(getEffectivePresupuestoTotal({
    total: 120000,
    items: [{ cantidad: 1, precioUnitario: 105000, subtotal: 105000 }],
  }), 120000)
})

test('recupera un total historico cero desde los subtotales', () => {
  assert.equal(getEffectivePresupuestoTotal({
    total: 0,
    items: [{ cantidad: 1, precioUnitario: 105000, subtotal: 105000 }],
  }), 105000)
})

test('calcula cantidad por precio cuando el subtotal no es positivo', () => {
  assert.equal(getEffectivePresupuestoTotal({
    total: 0,
    items: [
      { cantidad: 2, precioUnitario: 25000, subtotal: 0 },
      { cantidad: 1, precioUnitario: 55000, subtotal: 0 },
    ],
  }), 105000)
})

test('devuelve cero cuando no existen importes validos', () => {
  assert.equal(getEffectivePresupuestoTotal({ total: 0, items: [] }), 0)
  assert.equal(getEffectivePresupuestoTotal({
    total: Number.NaN,
    items: [{ cantidad: 1, precioUnitario: -1, subtotal: -1 }],
  }), 0)
})

test('listado y detalle utilizan la misma funcion centralizada', () => {
  const listPage = readSource('src/pages/PresupuestosPage.tsx')
  const detailPage = readSource('src/pages/PresupuestoDetailPage.tsx')

  assert.match(listPage, /formatCurrency\(getEffectivePresupuestoTotal\(presupuesto\)\)/)
  assert.match(detailPage, /formatCurrency\(getEffectivePresupuestoTotal\(presupuesto\)\)/)
})

test('solo permite enviar presupuestos con todos los importes completos', () => {
  assert.equal(isPresupuestoReadyToSend({
    total: 0,
    items: [{ cantidad: 1, precioUnitario: 0, subtotal: 0 }],
  }), false)
  assert.equal(isPresupuestoReadyToSend({
    total: 100,
    items: [
      { cantidad: 1, precioUnitario: 100, subtotal: 100 },
      { cantidad: 1, precioUnitario: 0, subtotal: 0 },
    ],
  }), false)
  assert.equal(isPresupuestoReadyToSend({
    total: 0,
    items: [
      { cantidad: 2, precioUnitario: 100, subtotal: 200 },
      { cantidad: 1, precioUnitario: 50, subtotal: 50 },
    ],
  }), true)
})

test('el detalle mantiene visible y deshabilita Marcar enviado si falta cotizar', () => {
  const detailPage = readSource('src/pages/PresupuestoDetailPage.tsx')

  assert.match(detailPage, /estado === 'ENVIADO' && !canMarkAsSent/)
  assert.match(detailPage, /Completá el precio de todos los productos/)
})
