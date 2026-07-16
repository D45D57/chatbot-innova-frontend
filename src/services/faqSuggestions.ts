import type { FAQFormData } from '../types'

export interface FAQSuggestion {
  id: string
  pregunta: string
  respuesta: string
  categoria: string
  activa: boolean
}

const MOCK_FAQ_SUGGESTIONS: FAQSuggestion[] = [
  {
    id: 'payment-methods',
    pregunta: '¿Qué medios de pago aceptan?',
    respuesta: 'Aceptamos efectivo, transferencia bancaria y pagos con tarjeta. Podés editar esta respuesta para detallar promociones, cuotas o billeteras virtuales.',
    categoria: 'Pagos',
    activa: true,
  },
  {
    id: 'shipping',
    pregunta: '¿Realizan envíos?',
    respuesta: 'Sí, realizamos envíos. Te recomendamos editar esta respuesta para indicar zonas, costos y tiempos estimados de entrega.',
    categoria: 'Envíos',
    activa: true,
  },
  {
    id: 'opening-hours',
    pregunta: '¿Cuál es el horario de atención?',
    respuesta: 'Nuestro horario de atención está publicado en la información del negocio. Podés editar esta respuesta con días y horarios específicos.',
    categoria: 'Información general',
    activa: true,
  },
  {
    id: 'stock',
    pregunta: '¿Tienen stock disponible?',
    respuesta: 'El stock puede variar según el producto. Escribinos con el producto que te interesa y te confirmamos disponibilidad.',
    categoria: 'Productos',
    activa: true,
  },
  {
    id: 'wholesale',
    pregunta: '¿Realizan ventas por mayor?',
    respuesta: 'Podemos evaluar pedidos por mayor. Editá esta respuesta para explicar mínimos de compra, descuentos o condiciones comerciales.',
    categoria: 'Ventas',
    activa: true,
  },
  {
    id: 'warranty',
    pregunta: '¿Los productos tienen garantía?',
    respuesta: 'Algunos productos pueden tener garantía. Te recomendamos editar esta respuesta para aclarar plazos, condiciones y cómo realizar un reclamo.',
    categoria: 'Garantía',
    activa: true,
  },
]

export async function getFaqSuggestions(): Promise<FAQSuggestion[]> {
  return MOCK_FAQ_SUGGESTIONS
}

export function mapSuggestionToFaqFormData(suggestion: FAQSuggestion): FAQFormData {
  return {
    pregunta: suggestion.pregunta,
    respuesta: suggestion.respuesta,
    categoria: suggestion.categoria,
    nuevaCategoriaNombre: suggestion.categoria,
    activa: suggestion.activa,
    sourceSuggestionId: suggestion.id,
  }
}
