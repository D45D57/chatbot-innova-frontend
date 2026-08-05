import { apiRequest } from './apiClient'
import { mapFaqApiToUi } from './faqMappers'
import { mapProductApi } from './productApi'
import type { Business, FAQ, FAQApi, Product, ProductApi, Rubro } from '../types'

interface PublicFaqsResponse {
  success: boolean
  faqs: FAQApi[]
}

interface PublicProductsResponse {
  success: boolean
  productos: ProductApi[]
}

interface PublicProductApi {
  id: string
  nombre: string
  descripcion?: string | null
  precio?: number | string | null
  precioConsultar?: boolean
  imagen?: string | null
  disponible?: boolean
}

interface PublicBotData {
  botId: string
  nombre: string
  descripcion?: string | null
  horario?: string | null
  telefono?: string | null
  logo?: string | null
  mensajeBienvenida?: string | null
  respuestaDerivacion?: string | null
  colorPrimario?: string | null
  colorSecundario?: string | null
  rubroId?: string | null
  rubroNombre?: string | null
  slug?: string | null
  productos?: PublicProductApi[]
}

interface PublicChatInitResponse {
  success: boolean
  data: {
    sessionId?: string
    hasHistory?: boolean
    consultationId?: string | null
    botData?: PublicBotData
    botId?: string
    nombre?: string
    mensajeBienvenida?: string
    colorPrimario?: string
    colorSecundario?: string
  }
}

const toRubro = (value?: string | null): Rubro | '' => {
  const normalized = value?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const supported: Rubro[] = [
    'gastronomia', 'peluqueria', 'indumentaria', 'tecnologia', 'servicios',
    'salud', 'educacion', 'artesanias', 'oficios', 'otro',
  ]
  return supported.includes(normalized as Rubro) ? normalized as Rubro : ''
}

export async function getPublicBusinessApi(slug: string): Promise<Business> {
  const sessionStorageKey = `emprendebot:session:${slug}`
  const storedSessionId = localStorage.getItem(sessionStorageKey)
  const sessionQuery = storedSessionId
    ? `?sessionId=${encodeURIComponent(storedSessionId)}&hasHistory=true`
    : ''
  const response = await apiRequest<PublicChatInitResponse>(
    `/public/chatbot/${encodeURIComponent(slug)}/init${sessionQuery}`,
    { auth: false },
  )
  const data = response.data
  if (data.sessionId) localStorage.setItem(sessionStorageKey, data.sessionId)
  const bot = data.botData
  const botId = bot?.botId ?? data.botId
  if (!botId) throw new Error('La respuesta pública del chatbot no contiene un identificador.')

  return {
    id: botId,
    userId: '',
    nombre: bot?.nombre ?? data.nombre ?? 'Asistente virtual',
    logo: bot?.logo ?? undefined,
    descripcion: bot?.descripcion ?? '',
    horario: bot?.horario ?? '',
    telefono: bot?.telefono ?? '',
    mensajeBienvenida: bot?.mensajeBienvenida
      ?? data.mensajeBienvenida
      ?? '¡Hola! ¿En qué te puedo ayudar?',
    respuestaDerivacion: bot?.respuestaDerivacion ?? 'Te voy a conectar con un asesor en breve.',
    rubro: toRubro(bot?.rubroNombre),
    rubroId: bot?.rubroId ?? undefined,
    rubroNombre: bot?.rubroNombre ?? undefined,
    productos: (bot?.productos ?? []).map(producto => ({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? undefined,
      precio: producto.precio == null ? undefined : Number(producto.precio),
      precioConsultar: producto.precioConsultar ?? false,
      imagen: producto.imagen ?? undefined,
      disponible: producto.disponible ?? true,
    })),
    faq: [],
    slug: bot?.slug ?? slug,
    colorPrimario: bot?.colorPrimario ?? data.colorPrimario,
    colorSecundario: bot?.colorSecundario ?? data.colorSecundario,
    chatSessionId: data.sessionId,
    chatConsultationId: data.consultationId ?? undefined,
    chatHasHistory: data.hasHistory ?? false,
  }
}

export async function getPublicFaqsApi(slug: string): Promise<FAQ[]> {
  const response = await apiRequest<PublicFaqsResponse>(
    `/public/chatbot/${slug}/faqs`,
    { auth: false },
  )
  return response.faqs.map(mapFaqApiToUi)
}

export async function getPublicProductsApi(slug: string): Promise<Product[]> {
  const response = await apiRequest<PublicProductsResponse>(
    `/public/chatbot/${encodeURIComponent(slug)}/products`,
    { auth: false },
  )
  return response.productos.map(mapProductApi)
}
