import { apiRequest } from './apiClient'

interface ConsultationResponse {
  success: boolean
  consulta: { id: string }
}

export async function createPublicConsultation(slug: string, sessionAnonimaId: string): Promise<string> {
  const response = await apiRequest<ConsultationResponse>(`/public/chatbot/${encodeURIComponent(slug)}/consultations`, {
    method: 'POST', auth: false, body: JSON.stringify({ sessionAnonimaId, canal: 'web', prioridad: 'normal' }),
  })
  return response.consulta.id
}

export async function savePublicMessage(slug: string, id: string, emisor: 'cliente' | 'bot', contenido: string): Promise<void> {
  await apiRequest(`/public/chatbot/${encodeURIComponent(slug)}/consultations/${id}/messages`, {
    method: 'POST', auth: false, body: JSON.stringify({ emisor, contenido, tipoMensaje: 'texto' }),
  })
}

export async function updatePublicContact(slug: string, id: string, clienteNombre: string, clienteTelefono: string): Promise<void> {
  await apiRequest(`/public/chatbot/${encodeURIComponent(slug)}/consultations/${id}/contact`, {
    method: 'PATCH', auth: false, body: JSON.stringify({ clienteNombre, clienteTelefono }),
  })
}
