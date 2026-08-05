import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = relativePath =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const productForm = readSource('src/pages/ProductFormPage.tsx')
const catalogPage = readSource('src/pages/CatalogPage.tsx')
const productApi = readSource('src/services/productApi.ts')
const productTypes = readSource('src/types/index.ts')

test('el formulario y las tarjetas no presentan stock', () => {
  assert.doesNotMatch(productForm, /\bstock\b/i)
  assert.doesNotMatch(catalogPage, /Stock:/)
})

test('los payloads frontend no envían stock', () => {
  assert.doesNotMatch(productApi, /appendFormValue\(formData,\s*['"]stock['"]/)

  const createPayload = productTypes.match(
    /export interface CreateProductPayload\s*{([\s\S]*?)\n}/,
  )?.[1]
  const updatePayload = productTypes.match(
    /export interface UpdateProductPayload\s*{([\s\S]*?)\n}/,
  )?.[1]

  assert.ok(createPayload)
  assert.ok(updatePayload)
  assert.doesNotMatch(createPayload, /\bstock\b/)
  assert.doesNotMatch(updatePayload, /\bstock\b/)
})

test('la respuesta administrativa puede conservar stock por compatibilidad', () => {
  const apiType = productTypes.match(/export interface ProductApi\s*{([\s\S]*?)\n}/)?.[1]
  assert.ok(apiType)
  assert.match(apiType, /\bstock:\s*number/)
})
