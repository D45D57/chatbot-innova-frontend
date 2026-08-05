export type MetricsPeriod = 'last7Days' | 'last30Days' | 'currentMonth' | 'previousMonth'

export interface MetricsPeriodOption {
  value: MetricsPeriod
  label: string
}

export interface ResumenTrafico {
  ventasConcretadas: number
  consultaronProductos: number
  abandonaronBot: number
  tasaConversionPct: string
}

export interface SeccionVisitada {
  seccion: string
  porcentaje: number
}

export interface ConsultaProducto {
  boton: string
  consultas: number
}

export interface EtapaEmbudo {
  etapa: string
  usuarios: number
}

export interface MomentoAbandono {
  momento: string
  porcentaje: number
}

export interface CapitalFugado {
  sesionesConAltaIntencion: number
}

export interface HoraPicoItem {
  hora: string
  consultas: number
}

export type LeadStatus = 'Nuevo' | 'Pendiente'

export interface LeadItem {
  id: string
  nombre: string
  detalle: string
  hora: string
  estado: LeadStatus
}

export interface MetricsData {
  resumenTrafico: ResumenTrafico
  seccionesMasVisitadas: SeccionVisitada[]
  detalleConsultasProducto: ConsultaProducto[]
  dondeSeVan: EtapaEmbudo[]
  momentoAbandono: MomentoAbandono[]
  capitalFugado: CapitalFugado
  horasPico: HoraPicoItem[]
  leadsDeHoy: LeadItem[]
}

export type MetricsApiResponse =
  | {
      success: true
      data: MetricsData
    }
  | {
      success: false
      message: string
    }

export interface UseMetricsParams {
  period?: MetricsPeriod
  startDate?: string
  endDate?: string
  businessId?: string
}

export interface UseMetricsResult {
  data: MetricsData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}
