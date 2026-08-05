import type { FAQ, FAQApi, FAQCategory, FAQCategoryApi } from '../types'

export function mapFaqCategoryApiToUi(category: FAQCategoryApi): FAQCategory {
  return {
    id: category.id,
    nombre: category.nombre,
    createdAt: category.fechaCreacion,
  }
}

export function mapFaqApiToUi(faq: FAQApi): FAQ {
  return {
    id: faq.id,
    businessId: faq.botId,
    categoriaId: faq.categoriaId,
    pregunta: faq.pregunta,
    respuesta: faq.respuesta,
    categoria: faq.categoria?.nombre,
    createdAt: faq.fechaCreacion,
    updatedAt: faq.fechaModificacion,
  }
}
