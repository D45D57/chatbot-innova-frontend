export type PresupuestoEstado =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'ENVIADO'
  | 'CONCRETADO'
  | 'RECHAZADO'

export interface PresupuestoItemInput {
  productoId?: string
  nombre: string
  cantidad: number
  precioUnitario: number
}

export interface PresupuestoItem extends PresupuestoItemInput {
  subtotal: number
}

export interface PresupuestoCliente {
  nombre: string
  telefono: string
}

export interface PresupuestoConsulta {
  id: string
  asunto: string | null
  estado: string
  cliente: PresupuestoCliente | null
}

export interface Presupuesto {
  id: number
  estado: PresupuestoEstado
  consultaId: string
  consulta?: PresupuestoConsulta
  items: PresupuestoItem[]
  total: number
  fechaEmision: string
  fechaVencimiento: string
  diasValidez: number
  linkPdf: string | null
  fechaCreacion?: string
  fechaActualizacion?: string
}

export type PresupuestoResumen = Presupuesto
export type PresupuestoDetalle = Presupuesto

export interface CreatePresupuestoPayload {
  consultaId: string
  items: PresupuestoItemInput[]
  diasValidez?: number
  idempotencyKey: string
}

export interface CreatePresupuestoResponse {
  success: boolean
  duplicated: boolean
  presupuesto: PresupuestoDetalle
}

export interface CotizarPresupuestoPayload {
  itemsCotizados: PresupuestoItemInput[]
  diasValidez?: number
}

export interface UpdatePresupuestoEstadoPayload {
  estado: PresupuestoEstado
}

export interface PresupuestosFilters {
  page?: number
  limit?: number
  estado?: PresupuestoEstado
  consultaId?: string
  startDate?: string
  endDate?: string
}

export interface PresupuestosPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PresupuestosListResponse {
  presupuestos: PresupuestoResumen[]
  pagination: PresupuestosPagination
}

export interface PresupuestoResponse {
  success: boolean
  presupuesto: PresupuestoDetalle
}
