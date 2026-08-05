import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const catalogPage = readFileSync(
  new URL('../src/pages/CatalogPage.tsx', import.meta.url),
  'utf8',
)
const catalogStyles = readFileSync(
  new URL('../src/styles/catalog.css', import.meta.url),
  'utf8',
)

test('Catálogo presenta el filtro de visibilidad con los estados definidos por UX', () => {
  assert.match(catalogPage, /<span>Visibilidad<\/span>/)
  assert.match(catalogPage, /<option value="all">Todos<\/option>/)
  assert.match(catalogPage, /<option value="active">Activos<\/option>/)
  assert.match(catalogPage, /<option value="inactive">Inactivos<\/option>/)
})

test('el filtro conserva el contrato activo del backend', () => {
  assert.match(
    catalogPage,
    /activo: activeFilter === 'all' \? undefined : activeFilter === 'active'/,
  )
})

test('las opciones tienen colores explícitos para ambos temas', () => {
  assert.match(catalogStyles, /\.catalog-filter select option\s*{[\s\S]*color: var\(--catalog-text\)/)
  assert.match(catalogStyles, /\.catalog-filter select option\s*{[\s\S]*background: var\(--catalog-card\)/)
})
