import type { Consulta } from '../types'

export type ConsultationResolutionReason =
  | 'human_handoff'
  | 'quote'
  | 'contact_data'
  | 'human_intervention'
  | 'bot_resolved'
  | 'unknown'

export interface ConsultationResolution {
  requiresHumanAction: boolean
  resolvedByBot: boolean
  reason: ConsultationResolutionReason
  overrideLabel?: string
}

export interface ConsultationResolutionContext {
  budgetConsultationIds: ReadonlySet<string>
  budgetDataComplete: boolean
  budgetEstadoByConsultaId?: ReadonlyMap<string, string>
}

const normalize = (value?: string | null) =>
  value?.trim().toUpperCase().replace(/[\s-]+/g, '_') ?? ''

export function isPendingHumanConsultation(
  consulta: Consulta,
  resolution: ConsultationResolution,
): boolean {
  const hasConfirmedHumanReason = resolution.reason === 'human_handoff'
    || resolution.reason === 'human_intervention'
    || resolution.reason === 'contact_data'

  return normalize(consulta.estado) === 'EN_PROCESO'
    && resolution.requiresHumanAction
    && !resolution.resolvedByBot
    && hasConfirmedHumanReason
}

export function classifyConsultationResolution(
  consulta: Consulta,
  context: ConsultationResolutionContext,
): ConsultationResolution {
  const tipoConsulta = normalize(consulta.tipoConsulta)
  const cerradaPor = normalize(consulta.cerradaPor)
  const hasEntrepreneurMessage = consulta.mensajes.some(mensaje => {
    const emisor = normalize(mensaje.emisor)
    return emisor === 'EMPRENDEDOR' || emisor === 'USUARIO'
  })

  // RESUELTA con presupuesto activo (no concretado ni rechazado) → mostrar "En seguimiento"
  // Va primero porque puede coexistir con derivada=true cuando la consulta incluía un presupuesto
  if (normalize(consulta.estado) === 'RESUELTA') {
    const presupuestoEstado = context.budgetEstadoByConsultaId?.get(consulta.id)
    if (presupuestoEstado && !['CONCRETADO', 'RECHAZADO'].includes(presupuestoEstado)) {
      return { requiresHumanAction: true, resolvedByBot: false, reason: 'quote', overrideLabel: 'En seguimiento' }
    }
  }

  if (consulta.derivada || tipoConsulta === 'DERIVAR_HUMANO') {
    return { requiresHumanAction: true, resolvedByBot: false, reason: 'human_handoff' }
  }

  if (cerradaPor === 'EMPRENDEDOR' || hasEntrepreneurMessage) {
    return { requiresHumanAction: true, resolvedByBot: false, reason: 'human_intervention' }
  }

  if (
    context.budgetConsultationIds.has(consulta.id)
    || tipoConsulta === 'PRESUPUESTO'
    || tipoConsulta === 'COTIZACION'
  ) {
    return { requiresHumanAction: true, resolvedByBot: false, reason: 'quote' }
  }

  if (consulta.clienteNombre || consulta.clienteTelefono) {
    return { requiresHumanAction: true, resolvedByBot: false, reason: 'contact_data' }
  }

  if (!context.budgetDataComplete) {
    return { requiresHumanAction: true, resolvedByBot: false, reason: 'unknown' }
  }

  // NUEVA = el bot interactuó pero el emprendedor todavía no abrió la consulta
  // No clasificar como resuelta por el bot — debe mostrar su badge real
  if (normalize(consulta.estado) === 'NUEVA') {
    return { requiresHumanAction: false, resolvedByBot: false, reason: 'unknown' }
  }

  return { requiresHumanAction: false, resolvedByBot: true, reason: 'bot_resolved' }
}
