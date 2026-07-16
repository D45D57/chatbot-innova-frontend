import type { FAQCategoryApi } from '../types'
import { apiRequest } from './apiClient'

interface FAQCategoryListResponse {
  success: boolean
  categorias: FAQCategoryApi[]
}

interface FAQCategoryMutationResponse {
  success: boolean
  message: string
  categoria: FAQCategoryApi
}

export async function getFaqCategoriesApi(): Promise<FAQCategoryApi[]> {
  const response = await apiRequest<FAQCategoryListResponse>('/faq-categories')
  return response.categorias
}

export async function createFaqCategoryApi(nombre: string): Promise<FAQCategoryApi> {
  const response = await apiRequest<FAQCategoryMutationResponse>('/faq-categories', {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  })
  return response.categoria
}

export async function updateFaqCategoryApi(id: string, nombre: string): Promise<FAQCategoryApi> {
  const response = await apiRequest<FAQCategoryMutationResponse>(`/faq-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nombre }),
  })
  return response.categoria
}

export async function deleteFaqCategoryApi(id: string): Promise<void> {
  await apiRequest<{ success: boolean; message: string }>(`/faq-categories/${id}`, {
    method: 'DELETE',
  })
}
