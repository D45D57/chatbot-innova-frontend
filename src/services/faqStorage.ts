import type { Business, FAQ, FAQCategory } from '../types'
import {
  getStoredBusinesses,
  saveStoredBusinesses,
  updateStoredBusiness,
} from './businessStorage'

export interface FAQFormData {
  pregunta: string
  respuesta: string
  categoriaId?: string
  categoria?: string
  nuevaCategoriaNombre?: string
  activa: boolean
  sourceSuggestionId?: string
}

interface FAQMutationResult {
  faq: FAQ
  faqs: FAQ[]
  categories: FAQCategory[]
}

export type FAQMoveDirection = 'up' | 'down'

function normalizeFaqData(data: FAQFormData): FAQFormData {
  const pregunta = data.pregunta.trim()
  const respuesta = data.respuesta.trim()
  const categoria = data.categoria?.trim() || undefined
  const nuevaCategoriaNombre = data.nuevaCategoriaNombre?.trim() || undefined

  if (!pregunta) throw new Error('La pregunta es obligatoria.')
  if (!respuesta) throw new Error('La respuesta es obligatoria.')
  if (!data.categoriaId && !nuevaCategoriaNombre) {
    throw new Error('Selecciona o crea una categoria para la FAQ.')
  }

  return {
    pregunta,
    respuesta,
    categoriaId: data.categoriaId,
    categoria,
    nuevaCategoriaNombre,
    activa: data.activa ?? true,
    sourceSuggestionId: data.sourceSuggestionId,
  }
}

export function normalizeFaqCategories(business: Business): FAQCategory[] {
  const categoriesById = new Map<string, FAQCategory>()
  const categoriesByName = new Map<string, FAQCategory>()

  ;(business.faqCategories ?? []).forEach(category => {
    const normalized: FAQCategory = {
      id: category.id,
      nombre: category.nombre.trim(),
      createdAt: category.createdAt,
    }
    if (!normalized.nombre) return
    categoriesById.set(normalized.id, normalized)
    categoriesByName.set(normalized.nombre.toLowerCase(), normalized)
  })

  ;(business.faq ?? []).forEach(faq => {
    const nombre = faq.categoria?.trim()
    if (!nombre) return

    const key = nombre.toLowerCase()
    if (categoriesByName.has(key)) return

    const category: FAQCategory = {
      id: faq.categoriaId ?? crypto.randomUUID(),
      nombre,
      createdAt: faq.createdAt,
    }
    categoriesById.set(category.id, category)
    categoriesByName.set(key, category)
  })

  return Array.from(categoriesById.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export function normalizeFaqs(
  businessId: string,
  faqs: Partial<FAQ>[] = [],
  categories: FAQCategory[] = [],
): FAQ[] {
  const seenSuggestionIds = new Set<string>()
  const orderedFaqs = faqs
    .map((faq, originalIndex) => ({ faq, originalIndex }))
    .sort((left, right) => {
      const leftOrder = typeof left.faq.orden === 'number' ? left.faq.orden : Number.MAX_SAFE_INTEGER
      const rightOrder = typeof right.faq.orden === 'number' ? right.faq.orden : Number.MAX_SAFE_INTEGER
      return leftOrder - rightOrder || left.originalIndex - right.originalIndex
    })
    .filter(({ faq }) => {
      if (!faq.sourceSuggestionId) return true
      if (seenSuggestionIds.has(faq.sourceSuggestionId)) return false
      seenSuggestionIds.add(faq.sourceSuggestionId)
      return true
    })

  return orderedFaqs.map(({ faq }, index) => {
    const now = new Date().toISOString()
    const createdAt = faq.createdAt ?? now
    const category = categories.find(item => item.id === faq.categoriaId)
      ?? categories.find(item => item.nombre.toLowerCase() === faq.categoria?.toLowerCase())

    return {
      id: faq.id ?? crypto.randomUUID(),
      businessId,
      categoriaId: category?.id ?? faq.categoriaId,
      pregunta: faq.pregunta?.trim() ?? '',
      respuesta: faq.respuesta?.trim() ?? '',
      categoria: category?.nombre ?? (faq.categoria?.trim() || undefined),
      activa: faq.activa ?? true,
      orden: index + 1,
      sourceSuggestionId: faq.sourceSuggestionId,
      createdAt,
      updatedAt: faq.updatedAt ?? createdAt,
    }
  })
}

function hasFaqMigrationChanges(originalFaqs: Partial<FAQ>[], normalizedFaqs: FAQ[]): boolean {
  if (originalFaqs.length !== normalizedFaqs.length) return true

  return originalFaqs.some((faq, index) => {
    const normalized = normalizedFaqs[index]
    return faq.id !== normalized.id
      || faq.businessId !== normalized.businessId
      || faq.categoriaId !== normalized.categoriaId
      || faq.pregunta !== normalized.pregunta
      || faq.respuesta !== normalized.respuesta
      || (faq.categoria || undefined) !== normalized.categoria
      || faq.activa !== normalized.activa
      || faq.orden !== normalized.orden
      || faq.sourceSuggestionId !== normalized.sourceSuggestionId
      || faq.createdAt !== normalized.createdAt
      || faq.updatedAt !== normalized.updatedAt
  })
}

export function migrateBusinessFaqs(business: Business): Business {
  const originalFaqs = business.faq ?? []
  const normalizedCategories = normalizeFaqCategories(business)
  const normalizedFaqs = normalizeFaqs(business.id, originalFaqs, normalizedCategories)

  if (
    Array.isArray(business.faq)
    && Array.isArray(business.faqCategories)
    && business.faqCategories.length === normalizedCategories.length
    && !hasFaqMigrationChanges(originalFaqs, normalizedFaqs)
  ) {
    return business
  }

  const businesses = getStoredBusinesses()
  const businessIndex = businesses.findIndex(item => item.id === business.id)
  const migratedBusiness = {
    ...business,
    faq: normalizedFaqs,
    faqCategories: normalizedCategories,
  }

  if (businessIndex === -1) return migratedBusiness

  businesses[businessIndex] = migratedBusiness
  saveStoredBusinesses(businesses)
  return migratedBusiness
}

function updateBusinessFaqs(
  businessId: string,
  updater: (faqs: FAQ[], categories: FAQCategory[]) => { faqs: FAQ[]; categories: FAQCategory[] },
): { faqs: FAQ[]; categories: FAQCategory[] } {
  let result: { faqs: FAQ[]; categories: FAQCategory[] } | null = null
  const updatedBusiness = updateStoredBusiness(businessId, business => {
    const categories = normalizeFaqCategories(business)
    const faqs = normalizeFaqs(businessId, business.faq, categories)
    result = updater(faqs, categories)
    return { ...business, faq: result.faqs, faqCategories: result.categories }
  })

  return result ?? {
    faqs: updatedBusiness.faq,
    categories: updatedBusiness.faqCategories ?? [],
  }
}

export async function getFaqs(businessId: string): Promise<FAQ[]> {
  const business = getStoredBusinesses().find(item => item.id === businessId)
  return business ? migrateBusinessFaqs(business).faq : []
}

export async function getFaqCategories(businessId: string): Promise<FAQCategory[]> {
  const business = getStoredBusinesses().find(item => item.id === businessId)
  return business ? migrateBusinessFaqs(business).faqCategories ?? [] : []
}

function resolveCategory(
  categories: FAQCategory[],
  data: FAQFormData,
): { category: FAQCategory; categories: FAQCategory[] } {
  const existingCategory = data.categoriaId
    ? categories.find(category => category.id === data.categoriaId)
    : undefined

  if (existingCategory) return { category: existingCategory, categories }

  const nombre = data.nuevaCategoriaNombre?.trim() || data.categoria?.trim()
  if (!nombre) throw new Error('Selecciona o crea una categoria para la FAQ.')

  const categoryByName = categories.find(category => category.nombre.toLowerCase() === nombre.toLowerCase())
  if (categoryByName) return { category: categoryByName, categories }

  const newCategory: FAQCategory = {
    id: crypto.randomUUID(),
    nombre,
    createdAt: new Date().toISOString(),
  }

  return {
    category: newCategory,
    categories: [...categories, newCategory].sort((a, b) => a.nombre.localeCompare(b.nombre)),
  }
}

export async function createFaq(
  businessId: string,
  data: FAQFormData,
): Promise<FAQMutationResult> {
  const normalizedData = normalizeFaqData(data)
  const now = new Date().toISOString()
  let faq: FAQ | null = null
  const result = updateBusinessFaqs(businessId, (currentFaqs, currentCategories) => {
    const existingFaq = normalizedData.sourceSuggestionId
      ? currentFaqs.find(item => item.sourceSuggestionId === normalizedData.sourceSuggestionId)
      : undefined

    if (existingFaq) {
      faq = existingFaq
      return { faqs: currentFaqs, categories: currentCategories }
    }

    const { category, categories } = resolveCategory(currentCategories, normalizedData)
    faq = {
      id: crypto.randomUUID(),
      businessId,
      categoriaId: category.id,
      categoria: category.nombre,
      pregunta: normalizedData.pregunta,
      respuesta: normalizedData.respuesta,
      activa: normalizedData.activa,
      orden: currentFaqs.length + 1,
      sourceSuggestionId: normalizedData.sourceSuggestionId,
      createdAt: now,
      updatedAt: now,
    }
    return { faqs: [...currentFaqs, faq], categories }
  })

  if (!faq) throw new Error('No se pudo crear la FAQ.')
  return { faq, faqs: result.faqs, categories: result.categories }
}

export async function updateFaq(
  businessId: string,
  faqId: string,
  data: FAQFormData,
): Promise<FAQMutationResult> {
  const normalizedData = normalizeFaqData(data)
  let updatedFaq: FAQ | null = null
  const result = updateBusinessFaqs(businessId, (currentFaqs, currentCategories) => {
    const { category, categories } = resolveCategory(currentCategories, normalizedData)
    const faqs = currentFaqs.map(faq => {
      if (faq.id !== faqId) return faq

      updatedFaq = {
        ...faq,
        categoriaId: category.id,
        categoria: category.nombre,
        pregunta: normalizedData.pregunta,
        respuesta: normalizedData.respuesta,
        activa: normalizedData.activa,
        sourceSuggestionId: normalizedData.sourceSuggestionId ?? faq.sourceSuggestionId,
        updatedAt: new Date().toISOString(),
      }
      return updatedFaq
    })
    return { faqs, categories }
  })

  if (!updatedFaq) throw new Error('No se encontro la FAQ que queres editar.')
  return { faq: updatedFaq, faqs: result.faqs, categories: result.categories }
}

export async function deleteFaq(businessId: string, faqId: string): Promise<FAQ[]> {
  const result = updateBusinessFaqs(businessId, (currentFaqs, categories) => ({
    categories,
    faqs: currentFaqs
      .filter(faq => faq.id !== faqId)
      .map((faq, index) => ({ ...faq, orden: index + 1 })),
  }))
  return result.faqs
}

export async function moveFaq(
  businessId: string,
  faqId: string,
  direction: FAQMoveDirection,
): Promise<FAQ[]> {
  const result = updateBusinessFaqs(businessId, (currentFaqs, categories) => {
    const currentIndex = currentFaqs.findIndex(faq => faq.id === faqId)
    if (currentIndex === -1) throw new Error('No se encontro la FAQ que queres mover.')

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= currentFaqs.length) return { faqs: currentFaqs, categories }

    const reorderedFaqs = [...currentFaqs]
    const currentFaq = reorderedFaqs[currentIndex]
    reorderedFaqs[currentIndex] = reorderedFaqs[targetIndex]
    reorderedFaqs[targetIndex] = currentFaq
    const now = new Date().toISOString()

    return {
      categories,
      faqs: reorderedFaqs.map((faq, index) => ({
        ...faq,
        // TODO: Persistir en backend cuando agregue soporte para orden manual.
        orden: index + 1,
        updatedAt: index === currentIndex || index === targetIndex ? now : faq.updatedAt,
      })),
    }
  })

  return result.faqs
}

export async function toggleFaq(
  businessId: string,
  faqId: string,
): Promise<FAQMutationResult> {
  let updatedFaq: FAQ | null = null
  const result = updateBusinessFaqs(businessId, (currentFaqs, categories) => {
    const faqs = currentFaqs.map(faq => {
      if (faq.id !== faqId) return faq

      updatedFaq = {
        ...faq,
        activa: !faq.activa,
        updatedAt: new Date().toISOString(),
      }
      return updatedFaq
    })
    return { faqs, categories }
  })

  if (!updatedFaq) throw new Error('No se encontro la FAQ que queres actualizar.')
  return { faq: updatedFaq, faqs: result.faqs, categories: result.categories }
}
