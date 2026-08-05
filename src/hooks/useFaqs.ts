import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FAQ, FAQCategory, FAQFormData } from '../types'
import {
  createFaqApi,
  createFaqsFromSuggestionsApi,
  deleteFaqApi,
  getFaqsApi,
  updateFaqApi,
} from '../services/faqApi'
import { createFaqCategoryApi, getFaqCategoriesApi } from '../services/faqCategoryApi'
import { mapFaqApiToUi, mapFaqCategoryApiToUi } from '../services/faqMappers'
import { DUPLICATE_FAQ_MESSAGE, normalizeFaqQuestion } from '../utils/normalizeFaqQuestion'

export type FAQSortOption = 'created-desc' | 'created-asc' | 'alpha-asc' | 'alpha-desc'

interface UseFaqFilters {
  category: string
  sort: FAQSortOption
}

const AUTH_INTEGRATION_MESSAGE = 'No se pudo conectar con el servidor. Volvé a iniciar sesión cuando la integración de autenticación esté disponible.'
const BOT_CONFIG_MESSAGE = 'Primero debe configurarse el bot/negocio para poder administrar preguntas frecuentes.'
const CONNECTION_MESSAGE = 'No pudimos conectar con el servidor. Revisá tu conexión e intentá nuevamente.'

function getTime(value: string): number {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function sortFaqs(left: FAQ, right: FAQ, sort: FAQSortOption): number {
  if (sort === 'created-asc') {
    return getTime(left.createdAt) - getTime(right.createdAt)
  }

  if (sort === 'alpha-asc') {
    return left.pregunta.localeCompare(right.pregunta, 'es', { sensitivity: 'base' })
  }

  if (sort === 'alpha-desc') {
    return right.pregunta.localeCompare(left.pregunta, 'es', { sensitivity: 'base' })
  }

  return getTime(right.createdAt) - getTime(left.createdAt)
}

function normalizeApiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : 'No pudimos conectar con el servidor.'
  const normalized = message.toLowerCase()

  if (normalized.includes('failed to fetch') || normalized.includes('networkerror')) {
    return new Error(CONNECTION_MESSAGE)
  }

  if (
    normalized.includes('acceso denegado')
    || normalized.includes('token')
    || normalized.includes('credenciales')
    || normalized.includes('401')
    || normalized.includes('403')
  ) {
    return new Error(AUTH_INTEGRATION_MESSAGE)
  }

  if (
    normalized.includes('configuración de bot no encontrada')
    || normalized.includes('configuracion de bot no encontrada')
    || normalized.includes('bot_not_found')
  ) {
    return new Error(BOT_CONFIG_MESSAGE)
  }

  if (
    normalized.includes('faq_duplicate')
    || normalized.includes('pregunta frecuente similar')
    || normalized.includes('409')
  ) {
    return new Error(DUPLICATE_FAQ_MESSAGE)
  }

  return new Error(message)
}

function normalizeFaqData(data: FAQFormData): FAQFormData {
  const pregunta = data.pregunta.trim()
  const respuesta = data.respuesta.trim()
  const categoria = data.categoria?.trim() || undefined
  const nuevaCategoriaNombre = data.nuevaCategoriaNombre?.trim() || undefined

  if (!pregunta) throw new Error('La pregunta es obligatoria.')
  if (!respuesta) throw new Error('La respuesta es obligatoria.')
  if (!data.categoriaId && !nuevaCategoriaNombre) {
    throw new Error('Seleccioná o creá una categoría para la FAQ.')
  }

  return {
    pregunta,
    respuesta,
    categoriaId: data.categoriaId,
    categoria,
    nuevaCategoriaNombre,
  }
}

function mapFaqsWithCategories(faqs: Awaited<ReturnType<typeof getFaqsApi>>, categories: FAQCategory[]): FAQ[] {
  return faqs.map(faq => {
    const mapped = mapFaqApiToUi(faq)
    const category = categories.find(item => item.id === mapped.categoriaId)
    return {
      ...mapped,
      categoria: mapped.categoria ?? category?.nombre,
    }
  })
}

export function useFaqs(filters: UseFaqFilters) {
  const [allFaqs, setAllFaqs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<FAQCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFaqData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [categoryResponse, faqResponse] = await Promise.all([
        getFaqCategoriesApi(),
        getFaqsApi(),
      ])
      const mappedCategories = categoryResponse
        .map(mapFaqCategoryApiToUi)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))

      setCategories(mappedCategories)
      setAllFaqs(mapFaqsWithCategories(faqResponse, mappedCategories))
    } catch (loadError) {
      const normalizedError = normalizeApiError(loadError)
      setError(normalizedError.message)
      setAllFaqs([])
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadFaqData(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadFaqData])

  const resolveCategoryId = useCallback(async (data: FAQFormData): Promise<{ categoryId: string; categories: FAQCategory[] }> => {
    if (data.categoriaId) return { categoryId: data.categoriaId, categories }

    const nombre = data.nuevaCategoriaNombre?.trim() || data.categoria?.trim()
    if (!nombre) throw new Error('Seleccioná o creá una categoría para la FAQ.')

    const existingCategory = categories.find(category => category.nombre.toLowerCase() === nombre.toLowerCase())
    if (existingCategory) return { categoryId: existingCategory.id, categories }

    try {
      const createdCategory = mapFaqCategoryApiToUi(await createFaqCategoryApi(nombre))
      const nextCategories = [...categories, createdCategory].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setCategories(nextCategories)
      return { categoryId: createdCategory.id, categories: nextCategories }
    } catch (categoryError) {
      throw normalizeApiError(categoryError)
    }
  }, [categories])

  const createFaq = useCallback(async (data: FAQFormData): Promise<FAQ> => {
    const normalizedData = normalizeFaqData(data)
    const normalizedQuestion = normalizeFaqQuestion(normalizedData.pregunta)
    if (allFaqs.some(faq => normalizeFaqQuestion(faq.pregunta) === normalizedQuestion)) {
      throw new Error(DUPLICATE_FAQ_MESSAGE)
    }

    try {
      const { categoryId, categories: nextCategories } = await resolveCategoryId(normalizedData)
      const createdFaq = await createFaqApi({
        categoriaId: categoryId,
        pregunta: normalizedData.pregunta,
        respuesta: normalizedData.respuesta,
      })
      const mappedFaq = mapFaqsWithCategories([createdFaq], nextCategories)[0]
      setAllFaqs(current => [mappedFaq, ...current])
      setError('')
      return mappedFaq
    } catch (createError) {
      throw normalizeApiError(createError)
    }
  }, [allFaqs, resolveCategoryId])

  const updateFaq = useCallback(async (faqId: string, data: FAQFormData): Promise<FAQ> => {
    const normalizedData = normalizeFaqData(data)
    const normalizedQuestion = normalizeFaqQuestion(normalizedData.pregunta)
    if (allFaqs.some(faq => faq.id !== faqId && normalizeFaqQuestion(faq.pregunta) === normalizedQuestion)) {
      throw new Error(DUPLICATE_FAQ_MESSAGE)
    }

    try {
      const { categoryId, categories: nextCategories } = await resolveCategoryId(normalizedData)
      const updatedFaq = await updateFaqApi(faqId, {
        categoriaId: categoryId,
        pregunta: normalizedData.pregunta,
        respuesta: normalizedData.respuesta,
      })
      const mappedFaq = mapFaqsWithCategories([updatedFaq], nextCategories)[0]
      setAllFaqs(current => current.map(faq => faq.id === faqId ? mappedFaq : faq))
      setError('')
      return mappedFaq
    } catch (updateError) {
      throw normalizeApiError(updateError)
    }
  }, [allFaqs, resolveCategoryId])

  const deleteFaq = useCallback(async (faqId: string): Promise<void> => {
    try {
      await deleteFaqApi(faqId)
      setAllFaqs(current => current.filter(faq => faq.id !== faqId))
      setError('')
    } catch (deleteError) {
      throw normalizeApiError(deleteError)
    }
  }, [])

  const createFromSuggestions = useCallback(async (suggestionIds: string[]): Promise<FAQ[]> => {
    try {
      const created = await createFaqsFromSuggestionsApi(suggestionIds)
      await loadFaqData()
      return mapFaqsWithCategories(created, categories)
    } catch (createError) {
      throw normalizeApiError(createError)
    }
  }, [categories, loadFaqData])

  const faqs = useMemo(() => {
    return [...allFaqs]
      .filter(faq => {
        const matchesCategory = filters.category === 'all' || faq.categoriaId === filters.category
        return matchesCategory
      })
      .sort((left, right) => sortFaqs(left, right, filters.sort))
  }, [allFaqs, filters.category, filters.sort])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [categories],
  )

  return {
    faqs,
    allFaqs,
    categories: sortedCategories,
    isLoading,
    error,
    reload: loadFaqData,
    createFaq,
    updateFaq,
    deleteFaq,
    createFromSuggestions,
  }
}
