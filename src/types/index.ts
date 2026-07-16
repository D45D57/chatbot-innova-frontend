// ===== USER =====
export interface User {
  id: string
  email: string
  nombre: string
  slug: string
  rubro?: Rubro | ''
}

// ===== BUSINESS =====
export type Rubro =
  | 'gastronomia'
  | 'peluqueria'
  | 'indumentaria'
  | 'tecnologia'
  | 'servicios'
  | 'salud'
  | 'educacion'
  | 'artesanias'
  | 'oficios'
  | 'artesanias'
  | 'oficios'
  | 'otro'

export interface Product {
  id: string
  nombre: string
  precio?: number
  precioConsultar?: boolean
  descripcion?: string
  imagen?: string
  disponible: boolean
}

export interface FAQ {
  id: string
  businessId: string
  categoriaId?: string
  pregunta: string
  respuesta: string
  categoria?: string
  activa: boolean
  orden?: number
  sourceSuggestionId?: string
  createdAt: string
  updatedAt: string
}

export interface FAQFormData {
  pregunta: string
  respuesta: string
  categoriaId?: string
  categoria?: string
  nuevaCategoriaNombre?: string
  activa: boolean
  sourceSuggestionId?: string
}

export interface FAQCategory {
  id: string
  nombre: string
  createdAt?: string
}

export interface FAQApi {
  id: string
  botId: string
  categoriaId: string
  pregunta: string
  respuesta: string
  activa?: boolean
  fechaCreacion: string
  fechaModificacion: string
  categoria?: {
    id: string
    nombre: string
  }
}

export interface FAQCategoryApi {
  id: string
  botId?: string
  nombre: string
  fechaCreacion?: string
}

export interface CreateFAQPayload {
  categoriaId: string
  pregunta: string
  respuesta: string
  activa?: boolean
}

export interface UpdateFAQPayload {
  categoriaId?: string
  pregunta?: string
  respuesta?: string
  activa?: boolean
}

export interface Business {
  id: string
  userId: string
  nombre: string
  logo?: string
  descripcion: string
  horario: string
  telefono: string
  mensajeBienvenida: string
  respuestaDerivacion: string
  rubro: Rubro | ''
  productos: Product[]
  faqCategories?: FAQCategory[]
  faq: FAQ[]
  slug: string
}

// ===== CHAT =====
export type MessageRole = 'bot' | 'user'
export type AwaitingInput = 'budget' | 'faq-selection' | 'contact-name' | 'contact-phone'

export interface Message {
  id: string
  role: MessageRole
  text: string
  timestamp: Date
  quickReplies?: string[]
  products?: Product[]
  faqs?: FAQ[]
}

export interface ChatSession {
  sessionId: string
  businessSlug: string
  messages: Message[]
}

// ===== CONSULTAS =====
export type ConsultaEstado = 'nueva' | 'en_proceso' | 'cerrada'
export type ConsultaCerradaPor = 'bot' | 'emprendedor'
export type CanalConsulta = 'web' | 'whatsapp'
export type TipoConsulta = 'general' | 'catalogo' | 'presupuesto' | 'soporte' | 'derivacion'
export type PrioridadConsulta = 'baja' | 'normal' | 'alta' | 'urgente'
export type EmisorMensaje = 'cliente' | 'usuario' | 'bot'

export interface Mensaje {
  id: string
  consultaId: string
  mensajePadreId?: string | null
  emisor: EmisorMensaje
  contenido: string
  tipoMensaje?: string | null
  fechaCreacion: string
  fechaActualizacion: string
  leido: boolean
}

export interface Consulta {
  id: string
  usuarioId?: string | null
  sessionAnonimaId?: string | null
  clienteNombre?: string | null
  clienteTelefono?: string | null
  estado: ConsultaEstado
  derivada: boolean
  cerradaPor?: ConsultaCerradaPor | null
  tipoConsulta?: TipoConsulta | string | null
  prioridad?: PrioridadConsulta | string | null
  canal?: CanalConsulta | string | null
  asunto?: string | null
  descripcion?: string | null
  derivadaA?: string | null
  fechaCreacion: string
  fechaActualizacion: string
  fechaCierre?: string | null
  mensajes: Mensaje[]
}

// ===== DASHBOARD =====
export interface DashboardStats {
  consultasPendientes: number
  presupuestosPendientes: number
  consultasResueltas: number
  porcentajeAutomatizacion: number
}
