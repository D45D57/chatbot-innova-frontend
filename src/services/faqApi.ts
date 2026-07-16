import type { CreateFAQPayload, FAQApi, UpdateFAQPayload } from '../types'
import { apiRequest } from './apiClient'

interface FAQListResponse {
  success: boolean
  faqs: FAQApi[]
}

interface FAQMutationResponse {
  success: boolean
  message: string
  faq: FAQApi
}

export async function getFaqsApi(): Promise<FAQApi[]> {
  const response = await apiRequest<FAQListResponse>('/faqs')
  return response.faqs
}

export async function createFaqApi(payload: CreateFAQPayload): Promise<FAQApi> {
  const response = await apiRequest<FAQMutationResponse>('/faqs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.faq
}

export async function updateFaqApi(id: string, payload: UpdateFAQPayload): Promise<FAQApi> {
  const response = await apiRequest<FAQMutationResponse>(`/faqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return response.faq
}

export async function deleteFaqApi(id: string): Promise<void> {
  await apiRequest<{ success: boolean; message: string }>(`/faqs/${id}`, {
    method: 'DELETE',
  })
}
