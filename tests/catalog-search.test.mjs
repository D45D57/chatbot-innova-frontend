import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const readSource = relativePath =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const source = readSource('src/utils/catalogSearch.ts')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const module = { exports: {} }
new Function('exports', 'module', compiled)(module.exports, module)

const { filterCatalogProducts, normalizeSearchText } = module.exports

const products = [
  { id: '1', nombre: 'Tratamiento de nutrición', descripcion: 'Bienestar integral' },
  { id: '2', nombre: 'Diseño gráfico', descripcion: 'Nutrición visual' },
  { id: '3', nombre: 'Café orgánico', descripcion: null },
]

test('normaliza tildes, mayusculas y espacios exteriores', () => {
  assert.equal(normalizeSearchText('  NUTRICIÓN  '), 'nutricion')
  assert.equal(normalizeSearchText('Diseño gráfico'), 'diseno grafico')
})

test('encuentra por nombre con o sin tilde, mayusculas y coincidencias parciales', () => {
  for (const query of [
    'nutrición', 'nutricion', 'NUTRICION', 'Nutricion',
    'tratamiento de nutricion', 'nutri', '  nutricion', 'nutricion  ',
  ]) {
    assert.deepEqual(filterCatalogProducts(products, query).map(product => product.id), ['1'], query)
  }

  assert.deepEqual(filterCatalogProducts(products, 'diseno grafico').map(product => product.id), ['2'])
  assert.deepEqual(filterCatalogProducts(products, 'diseño').map(product => product.id), ['2'])
  assert.deepEqual(filterCatalogProducts(products, 'GRAFICO').map(product => product.id), ['2'])
  assert.deepEqual(filterCatalogProducts(products, 'CAFE ORGANICO').map(product => product.id), ['3'])
})

test('una consulta vacia conserva el listado completo', () => {
  assert.equal(filterCatalogProducts(products, ''), products)
  assert.equal(filterCatalogProducts(products, '   '), products)
})

test('no incluye descripcion ni genera coincidencias falsas', () => {
  assert.deepEqual(filterCatalogProducts(products, 'bienestar'), [])
  assert.deepEqual(filterCatalogProducts(products, 'nutricion').map(product => product.id), ['1'])
  assert.deepEqual(filterCatalogProducts(products, 'peluqueria'), [])
})

test('el catalogo busca sobre el conjunto completo y pagina despues de filtrar', () => {
  const catalogPage = readSource('src/pages/CatalogPage.tsx')
  assert.match(catalogPage, /limit: SEARCH_FETCH_LIMIT/)
  assert.match(catalogPage, /filterCatalogProducts\([\s\S]*\.flatMap\(result => result\.productos\)/)
  assert.match(catalogPage, /matches\.slice\(start, start \+ PAGE_SIZE\)/)
  assert.doesNotMatch(catalogPage, /buscar: search/)
})
