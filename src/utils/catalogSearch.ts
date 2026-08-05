import type { ProductApi } from '../types'

export const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const filterCatalogProducts = (
  products: ProductApi[],
  query: string,
): ProductApi[] => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return products

  return products.filter(product =>
    normalizeSearchText(product.nombre).includes(normalizedQuery),
  )
}
