import type { LeadItem, MetricsData, MetricsPeriod, MetricsPeriodOption } from './futureMetrics.types'

export const METRICS_PERIOD_OPTIONS: MetricsPeriodOption[] = [
  { value: 'last7Days', label: 'Últimos 7 días' },
  { value: 'last30Days', label: 'Últimos 30 días' },
  { value: 'currentMonth', label: 'Este mes' },
  { value: 'previousMonth', label: 'Mes anterior' },
]

export const LEADS_DE_HOY_MOCK: LeadItem[] = [
  { id: 'ses_98765', nombre: 'María López', detalle: 'Consultó campera de cuero', hora: '21:34 h', estado: 'Nuevo' },
  { id: 'ses_98766', nombre: 'Carlos García', detalle: 'Pidió presupuesto x3 unidades', hora: '20:18 h', estado: 'Pendiente' },
]

const last7Days: MetricsData = {
  resumenTrafico: {
    ventasConcretadas: 47,
    consultaronProductos: 183,
    abandonaronBot: 96,
    tasaConversionPct: '26.00',
  },
  seccionesMasVisitadas: [
    { seccion: 'Precios', porcentaje: 48 },
    { seccion: 'Catálogo', porcentaje: 31 },
    { seccion: 'Envíos', porcentaje: 14 },
    { seccion: 'Presupuesto', porcentaje: 7 },
  ],
  detalleConsultasProducto: [
    { boton: 'stock', consultas: 21 },
    { boton: 'caracteristicas', consultas: 14 },
    { boton: 'fotos', consultas: 8 },
  ],
  dondeSeVan: [
    { etapa: 'Iniciaron conversación', usuarios: 183 },
    { etapa: 'Consultaron productos', usuarios: 142 },
    { etapa: 'Iniciaron compra', usuarios: 87 },
    { etapa: 'Abandonaron sin comprar', usuarios: 40 },
    { etapa: 'Completaron la compra', usuarios: 47 },
  ],
  momentoAbandono: [
    { momento: 'Al ver el precio', porcentaje: 43 },
    { momento: 'Al pedir datos', porcentaje: 29 },
    { momento: 'Sin respuesta del bot', porcentaje: 28 },
  ],
  capitalFugado: {
    sesionesConAltaIntencion: 75,
  },
  horasPico: [
    { hora: '20 - 22 h', consultas: 64 },
    { hora: '18 - 20 h', consultas: 41 },
    { hora: '12 - 14 h', consultas: 28 },
  ],
  leadsDeHoy: LEADS_DE_HOY_MOCK,
}

const last30Days: MetricsData = {
  resumenTrafico: {
    ventasConcretadas: 162,
    consultaronProductos: 684,
    abandonaronBot: 301,
    tasaConversionPct: '23.68',
  },
  seccionesMasVisitadas: [
    { seccion: 'Precios', porcentaje: 42 },
    { seccion: 'Catálogo', porcentaje: 34 },
    { seccion: 'Envíos', porcentaje: 16 },
    { seccion: 'Presupuesto', porcentaje: 8 },
  ],
  detalleConsultasProducto: [
    { boton: 'stock', consultas: 88 },
    { boton: 'caracteristicas', consultas: 61 },
    { boton: 'fotos', consultas: 37 },
  ],
  dondeSeVan: [
    { etapa: 'Iniciaron conversación', usuarios: 684 },
    { etapa: 'Consultaron productos', usuarios: 529 },
    { etapa: 'Iniciaron compra', usuarios: 308 },
    { etapa: 'Abandonaron sin comprar', usuarios: 146 },
    { etapa: 'Completaron la compra', usuarios: 162 },
  ],
  momentoAbandono: [
    { momento: 'Al ver el precio', porcentaje: 39 },
    { momento: 'Al pedir datos', porcentaje: 34 },
    { momento: 'Sin respuesta del bot', porcentaje: 27 },
  ],
  capitalFugado: {
    sesionesConAltaIntencion: 241,
  },
  horasPico: [
    { hora: '20 - 22 h', consultas: 217 },
    { hora: '18 - 20 h', consultas: 164 },
    { hora: '12 - 14 h', consultas: 119 },
  ],
  leadsDeHoy: LEADS_DE_HOY_MOCK,
}

const currentMonth: MetricsData = {
  resumenTrafico: {
    ventasConcretadas: 118,
    consultaronProductos: 497,
    abandonaronBot: 224,
    tasaConversionPct: '23.74',
  },
  seccionesMasVisitadas: [
    { seccion: 'Catálogo', porcentaje: 40 },
    { seccion: 'Precios', porcentaje: 36 },
    { seccion: 'Envíos', porcentaje: 15 },
    { seccion: 'Presupuesto', porcentaje: 9 },
  ],
  detalleConsultasProducto: [
    { boton: 'stock', consultas: 64 },
    { boton: 'caracteristicas', consultas: 48 },
    { boton: 'fotos', consultas: 29 },
  ],
  dondeSeVan: [
    { etapa: 'Iniciaron conversación', usuarios: 497 },
    { etapa: 'Consultaron productos', usuarios: 388 },
    { etapa: 'Iniciaron compra', usuarios: 229 },
    { etapa: 'Abandonaron sin comprar', usuarios: 111 },
    { etapa: 'Completaron la compra', usuarios: 118 },
  ],
  momentoAbandono: [
    { momento: 'Al ver el precio', porcentaje: 41 },
    { momento: 'Al pedir datos', porcentaje: 32 },
    { momento: 'Sin respuesta del bot', porcentaje: 27 },
  ],
  capitalFugado: {
    sesionesConAltaIntencion: 176,
  },
  horasPico: [
    { hora: '20 - 22 h', consultas: 173 },
    { hora: '18 - 20 h', consultas: 128 },
    { hora: '12 - 14 h', consultas: 92 },
  ],
  leadsDeHoy: LEADS_DE_HOY_MOCK,
}

export const EMPTY_METRICS_DATA: MetricsData = {
  resumenTrafico: {
    ventasConcretadas: 0,
    consultaronProductos: 0,
    abandonaronBot: 0,
    tasaConversionPct: '0.00',
  },
  seccionesMasVisitadas: [],
  detalleConsultasProducto: [],
  dondeSeVan: [],
  momentoAbandono: [],
  capitalFugado: {
    sesionesConAltaIntencion: 0,
  },
  horasPico: [],
  leadsDeHoy: LEADS_DE_HOY_MOCK,
}

export const METRICS_MOCK_DATA: Record<MetricsPeriod, MetricsData> = {
  last7Days,
  last30Days,
  currentMonth,
  previousMonth: EMPTY_METRICS_DATA,
}

export function getMetricsMock(period: MetricsPeriod = 'last7Days'): MetricsData {
  return METRICS_MOCK_DATA[period]
}
