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
  stock?: number
}

export interface ProductApi {
  id: string
  botId: string
  nombre: string
  descripcion: string | null
  precio: number | string
  stock: number
  urlImagen: string | null
  activo: boolean
  requiereCotizacion: boolean
  fechaCreacion: string
  fechaActualizacion: string
}

export interface ProductFilters {
  page?: number
  limit?: number
  buscar?: string
  activo?: boolean
}

export interface ProductPage {
  productos: ProductApi[]
  total: number
  page: number
  limit: number
  totalPaginas: number
}

export interface CreateProductPayload {
  nombre: string
  descripcion?: string
  precio?: number
  activo: boolean
  requiereCotizacion: boolean
  imagen?: File
}

export interface UpdateProductPayload {
  nombre?: string
  descripcion?: string | null
  precio?: number
  activo?: boolean
  requiereCotizacion?: boolean
  urlImagen?: string | null
  imagen?: File
}

export interface FAQ {
  id: string
  businessId: string
  categoriaId?: string
  pregunta: string
  respuesta: string
  categoria?: string
  createdAt: string
  updatedAt: string
}

export interface FAQFormData {
  pregunta: string
  respuesta: string
  categoriaId?: string
  categoria?: string
  nuevaCategoriaNombre?: string
}

export interface FAQSuggestion {
  id: string
  pregunta: string
  respuesta: string
  categoria: {
    nombre: string
  }
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
}

export interface UpdateFAQPayload {
  categoriaId?: string
  pregunta?: string
  respuesta?: string
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
  rubroId?: string
  rubroNombre?: string
  productos: Product[]
  faqCategories?: FAQCategory[]
  faq: FAQ[]
  slug: string
  colorPrimario?: string
  colorSecundario?: string
  chatSessionId?: string
  chatConsultationId?: string
  chatHasHistory?: boolean
  chatSessionChanged?: boolean
}

// ===== CHAT =====
export type MessageRole = 'bot' | 'user'
export type QuickReplyAction =
  | 'SHOW_MAIN_MENU'
  | 'SHOW_FAQ_MENU'
  | 'SHOW_CATALOG'
  | 'SHOW_SCHEDULE'
  | 'START_HUMAN_HANDOFF'
  | 'START_BUDGET'
  | 'SELECT_FAQ'
  | 'REQUEST_BUDGET'
  | 'CONFIRM_BUDGET'
  | 'CANCEL_BUDGET'
  | 'ASK_IF_HELPFUL'
  | 'HELPFUL_YES'
  | 'HELPFUL_NO'
  | 'SEND_TEXT'

export interface QuickReplyOption {
  id: string
  label: string
  action: QuickReplyAction
  value?: string
}

export type AwaitingInput =
  | 'budget'
  | 'faq-selection'
  | 'contact-name'
  | 'contact-phone'
  | 'quote-contact-name'
  | 'quote-contact-phone'
  | 'quote-confirm'

export interface QuoteSummaryItem {
  productId: string
  name: string
  quantity: number
  requiresQuote: boolean
  unitPrice?: number
  subtotal?: number
}

export interface QuoteSummaryMessageData {
  items: QuoteSummaryItem[]
  subtotal: number
}

export interface GeneratedQuoteMessageData {
  requestRegistered: true
  sourceSummaryMessageId: string
  pdfUrl?: string
  quoteId?: string
  number?: string
  status?: import('./presupuesto').PresupuestoEstado
  issuedAt?: string
  expiresAt?: string
  customer?: {
    name?: string
    phone?: string
  }
  items?: QuoteSummaryItem[]
  total?: number
}

export interface Message {
  id: string
  role: MessageRole
  text: string
  timestamp: Date
  action?: QuickReplyAction
  actionValue?: string
  quickReplies?: QuickReplyOption[]
  confirmQuote?: boolean
  products?: Product[]
  faqs?: FAQ[]
  quoteSummary?: QuoteSummaryMessageData
  generatedQuote?: GeneratedQuoteMessageData
}

export interface ChatSession {
  sessionId: string
  businessSlug: string
  messages: Message[]
}

// ===== CONSULTAS =====
export type ConsultaEstado = 'iniciada' | 'nueva' | 'en_proceso' | 'resuelta' | 'cerrada'
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
