import type { FAQ, FAQApi, FAQCategory, FAQCategoryApi } from '../types'

export function mapFaqCategoryApiToUi(category: FAQCategoryApi): FAQCategory {
  return {
    id: category.id,
    nombre: category.nombre,
    createdAt: category.fechaCreacion,
  }
}

export function mapFaqApiToUi(faq: FAQApi, index: number): FAQ {
  return {
    id: faq.id,
    businessId: faq.botId,
    categoriaId: faq.categoriaId,
    pregunta: faq.pregunta,
    respuesta: faq.respuesta,
    categoria: faq.categoria?.nombre,
    activa: faq.activa ?? true,
    orden: index + 1,
    createdAt: faq.fechaCreacion,
    updatedAt: faq.fechaModificacion,
  }
}
