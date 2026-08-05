import { apiRequest } from './apiClient'
import type { Presupuesto, PresupuestoEstado } from '../types/presupuesto'

interface ConsultationResponse {
  success: boolean
  consulta: { id: string }
}

interface PublicHistoryResponse {
  estadoChat: 'BOT_ACTIVO' | 'HUMANO_ATENDIENDO'
  mensajes: Array<{
    id: string
    emisor: 'CLIENTE' | 'BOT' | 'EMPRENDEDOR'
    contenido: string
    fechaCreacion: string
  }>
}

export interface PublicBudgetItemInput {
  productoId: string
  nombre: string
  cantidad: number
  precioUnitario?: number
  requiereCotizacion: boolean
}

export interface CreatePublicBudgetPayload {
  items: PublicBudgetItemInput[]
  diasValidez?: number
  idempotencyKey: string
}

interface PublicBudgetResponse {
  success: boolean
  duplicated?: boolean
  presupuesto: Pick<
    Presupuesto,
    'id' | 'estado' | 'total' | 'fechaEmision' | 'fechaVencimiento' | 'linkPdf'
  > & {
    estado: PresupuestoEstado
  }
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

export async function updatePublicContact(
  slug: string,
  id: string,
  clienteNombre: string,
  clienteTelefono: string,
  motivo: 'derivacion' | 'presupuesto',
): Promise<void> {
  await apiRequest(`/public/chatbot/${encodeURIComponent(slug)}/consultations/${id}/contact`, {
    method: 'PATCH',
    auth: false,
    body: JSON.stringify({ clienteNombre, clienteTelefono, motivo }),
  })
}

export async function createPublicBudget(
  slug: string,
  consultationId: string,
  payload: CreatePublicBudgetPayload,
): Promise<PublicBudgetResponse['presupuesto']> {
  const response = await apiRequest<PublicBudgetResponse>(
    `/public/chatbot/${encodeURIComponent(slug)}/consultations/${encodeURIComponent(consultationId)}/budgets`,
    {
      method: 'POST',
      auth: false,
      body: JSON.stringify(payload),
    },
  )
  return response.presupuesto
}

export async function getPublicHistory(
  slug: string,
  sessionId: string,
): Promise<PublicHistoryResponse> {
  return apiRequest<PublicHistoryResponse>(
    `/mensajes/${encodeURIComponent(slug)}/${encodeURIComponent(sessionId)}`,
    { auth: false },
  )
}
