import { apiRequest } from './apiClient'
import type {
  CotizarPresupuestoPayload,
  CreatePresupuestoPayload,
  CreatePresupuestoResponse,
  PresupuestoDetalle,
  PresupuestoItem,
  PresupuestoResponse,
  PresupuestosFilters,
  PresupuestosListResponse,
  UpdatePresupuestoEstadoPayload,
} from '../types/presupuesto'

const toQuery = (filters: PresupuestosFilters): string => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toPositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const toNonNegativeNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const toStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const findWrappedPayload = (
  response: unknown,
  hasPayload: (value: UnknownRecord) => boolean,
): UnknownRecord => {
  let current = response

  for (let depth = 0; depth < 5 && isRecord(current); depth += 1) {
    if (hasPayload(current)) return current

    if (isRecord(current.response)) {
      current = current.response
      continue
    }

    if (isRecord(current.data)) {
      current = current.data
      continue
    }

    break
  }

  return {}
}

const findPresupuestosPayload = (response: unknown): UnknownRecord => {
  return findWrappedPayload(response, value => Array.isArray(value.presupuestos))
}

const normalizePresupuestoItem = (value: unknown): PresupuestoItem => {
  const item = isRecord(value) ? value : {}
  const cantidad = toNonNegativeNumber(item.cantidad, 0)
  const precioUnitario = toNonNegativeNumber(item.precioUnitario ?? item.precio, 0)

  return {
    ...(typeof item.productoId === 'string' ? { productoId: item.productoId } : {}),
    nombre: toStringValue(item.nombre),
    cantidad,
    precioUnitario,
    subtotal: toNonNegativeNumber(item.subtotal, cantidad * precioUnitario),
  }
}

export const normalizePresupuesto = (value: unknown): PresupuestoDetalle => {
  const presupuesto = isRecord(value) ? value : {}
  const rawItems =
    (Array.isArray(presupuesto.items) && presupuesto.items) ||
    (Array.isArray(presupuesto.detalle) && presupuesto.detalle) ||
    (Array.isArray(presupuesto.detalles) && presupuesto.detalles) ||
    (Array.isArray(presupuesto.productos) && presupuesto.productos) ||
    []
  const items = rawItems.map(normalizePresupuestoItem)
  const rawConsulta = isRecord(presupuesto.consulta) ? presupuesto.consulta : {}
  const rawCliente = isRecord(rawConsulta.cliente)
    ? rawConsulta.cliente
    : isRecord(rawConsulta.lead)
      ? rawConsulta.lead
      : null

  return {
    id: toNonNegativeNumber(presupuesto.id, 0),
    estado: toStringValue(presupuesto.estado, 'PENDIENTE') as PresupuestoDetalle['estado'],
    consultaId: toStringValue(presupuesto.consultaId),
    consulta: {
      id: toStringValue(rawConsulta.id, toStringValue(presupuesto.consultaId)),
      asunto: typeof rawConsulta.asunto === 'string' ? rawConsulta.asunto : null,
      estado: toStringValue(rawConsulta.estado),
      cliente: rawCliente
        ? {
            nombre: toStringValue(rawCliente.nombre),
            telefono: toStringValue(rawCliente.telefono),
          }
        : null,
    },
    items,
    total: toNonNegativeNumber(
      presupuesto.total,
      items.reduce((sum, item) => sum + item.subtotal, 0),
    ),
    fechaEmision: toStringValue(presupuesto.fechaEmision),
    fechaVencimiento: toStringValue(presupuesto.fechaVencimiento),
    diasValidez: toPositiveNumber(
      presupuesto.diasValidez ?? presupuesto.validezDias,
      10,
    ),
    linkPdf: typeof presupuesto.linkPdf === 'string' ? presupuesto.linkPdf : null,
    ...(typeof presupuesto.fechaCreacion === 'string'
      ? { fechaCreacion: presupuesto.fechaCreacion }
      : {}),
    ...(typeof presupuesto.fechaActualizacion === 'string'
      ? { fechaActualizacion: presupuesto.fechaActualizacion }
      : {}),
  }
}

export const normalizePresupuestoResponse = (response: unknown): PresupuestoResponse => {
  const payload = findWrappedPayload(response, value => isRecord(value.presupuesto))

  return {
    success: payload.success !== false,
    presupuesto: normalizePresupuesto(payload.presupuesto),
  }
}

export const normalizePresupuestosResponse = (
  response: unknown,
): PresupuestosListResponse => {
  const payload = findPresupuestosPayload(response)
  const rawPagination = isRecord(payload.pagination)
    ? payload.pagination
    : isRecord(payload.paginacion)
      ? payload.paginacion
      : {}

  const presupuestos = Array.isArray(payload.presupuestos)
    ? payload.presupuestos.map(normalizePresupuesto)
    : []
  const page = toPositiveNumber(rawPagination.page ?? payload.page, 1)
  const limit = toPositiveNumber(rawPagination.limit ?? payload.limit, 10)
  const total = toNonNegativeNumber(rawPagination.total ?? payload.total, 0)
  const calculatedTotalPages = Math.max(1, Math.ceil(total / limit))
  const totalPages = toPositiveNumber(
    rawPagination.totalPages ??
      rawPagination.totalPaginas ??
      payload.totalPages ??
      payload.totalPaginas,
    calculatedTotalPages,
  )

  return {
    presupuestos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

export const createPresupuesto = (payload: CreatePresupuestoPayload) =>
  apiRequest<CreatePresupuestoResponse>('/presupuestos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getPresupuestos = async (
  filters: PresupuestosFilters = {},
): Promise<PresupuestosListResponse> => {
  const response = await apiRequest<unknown>(`/presupuestos${toQuery(filters)}`)
  return normalizePresupuestosResponse(response)
}

export const getPresupuestoById = async (id: number): Promise<PresupuestoResponse> => {
  const response = await apiRequest<unknown>(`/presupuestos/${id}`)
  return normalizePresupuestoResponse(response)
}

export const updatePresupuestoEstado = async (
  id: number,
  payload: UpdatePresupuestoEstadoPayload,
): Promise<PresupuestoResponse> => {
  const response = await apiRequest<unknown>(`/presupuestos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return normalizePresupuestoResponse(response)
}

export const cotizarPresupuesto = (id: number, payload: CotizarPresupuestoPayload) =>
  apiRequest<PresupuestoResponse>(`/presupuestos/${id}/cotizar`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
