import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Business, DashboardStats, FAQ, FAQCategory } from '../types'
import {
  createFaq as createStoredFaq,
  deleteFaq as deleteStoredFaq,
  migrateBusinessFaqs,
  moveFaq as moveStoredFaq,
  toggleFaq as toggleStoredFaq,
  updateFaq as updateStoredFaq,
  type FAQFormData,
  type FAQMoveDirection,
} from '../services/faqStorage'
import {
  getStoredBusinesses,
  saveStoredBusinesses,
} from '../services/businessStorage'

interface BusinessContextType {
  business: Business | null
  faqCategories: FAQCategory[]
  isBusinessLoading: boolean
  stats: DashboardStats
  loadBusiness: (userId: string) => void
  loadBusinessBySlug: (slug: string) => Business | null
  saveBusiness: (data: Partial<Business> & { userId: string }) => Business
  updateBusiness: (data: Partial<Business>) => void
  createFaq: (data: FAQFormData) => Promise<FAQ>
  updateFaq: (faqId: string, data: FAQFormData) => Promise<FAQ>
  deleteFaq: (faqId: string) => Promise<void>
  toggleFaq: (faqId: string) => Promise<FAQ>
  moveFaq: (faqId: string, direction: FAQMoveDirection) => Promise<void>
}

const DEFAULT_STATS: DashboardStats = {
  consultasPendientes: 0,
  presupuestosPendientes: 0,
  consultasResueltas: 0,
  porcentajeAutomatizacion: 0,
}

const BusinessContext = createContext<BusinessContextType | null>(null)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isBusinessLoading, setIsBusinessLoading] = useState(true)
  const faqCategories = business?.faqCategories ?? []

  const loadBusiness = useCallback((userId: string) => {
    setIsBusinessLoading(true)
    try {
      const found = getStoredBusinesses().find(item => item.userId === userId) ?? null
      setBusiness(found ? migrateBusinessFaqs(found) : null)
    } finally {
      setIsBusinessLoading(false)
    }
  }, [])

  const loadBusinessBySlug = useCallback((slug: string): Business | null => {
    const found = getStoredBusinesses().find(item => item.slug === slug) ?? null
    return found ? migrateBusinessFaqs(found) : null
  }, [])

  const saveBusiness = useCallback((data: Partial<Business> & { userId: string }): Business => {
    const all = getStoredBusinesses()
    const newBusiness: Business = {
      id: crypto.randomUUID(),
      productos: [],
      faq: [],
      faqCategories: [],
      rubro: '',
      ...data,
      nombre: data.nombre ?? '',
      descripcion: data.descripcion ?? '',
      horario: data.horario ?? '',
      telefono: data.telefono ?? '',
      mensajeBienvenida: data.mensajeBienvenida ?? '¡Hola! ¿En qué te puedo ayudar?',
      respuestaDerivacion: data.respuestaDerivacion ?? 'Te voy a conectar con un asesor en breve.',
      slug: data.slug ?? data.nombre?.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') ?? crypto.randomUUID(),
    }
    all.push(newBusiness)
    saveStoredBusinesses(all)
    setBusiness(newBusiness)
    return newBusiness
  }, [])

  const updateBusiness = useCallback((data: Partial<Business>) => {
    if (!business) return
    const updated = { ...business, ...data }
    const all = getStoredBusinesses().map(item => item.id === updated.id ? updated : item)
    saveStoredBusinesses(all)
    setBusiness(updated)
  }, [business])

  const createFaq = useCallback(async (data: FAQFormData): Promise<FAQ> => {
    if (!business) throw new Error('Primero tenés que configurar tu negocio.')
    const result = await createStoredFaq(business.id, data)
    setBusiness(current => current ? { ...current, faq: result.faqs, faqCategories: result.categories } : current)
    return result.faq
  }, [business])

  const updateFaq = useCallback(async (faqId: string, data: FAQFormData): Promise<FAQ> => {
    if (!business) throw new Error('Primero tenés que configurar tu negocio.')
    const result = await updateStoredFaq(business.id, faqId, data)
    setBusiness(current => current ? { ...current, faq: result.faqs, faqCategories: result.categories } : current)
    return result.faq
  }, [business])

  const deleteFaq = useCallback(async (faqId: string): Promise<void> => {
    if (!business) throw new Error('Primero tenés que configurar tu negocio.')
    const faqs = await deleteStoredFaq(business.id, faqId)
    setBusiness(current => current ? { ...current, faq: faqs } : current)
  }, [business])

  const toggleFaq = useCallback(async (faqId: string): Promise<FAQ> => {
    if (!business) throw new Error('Primero tenés que configurar tu negocio.')
    const result = await toggleStoredFaq(business.id, faqId)
    setBusiness(current => current ? { ...current, faq: result.faqs } : current)
    return result.faq
  }, [business])

  const moveFaq = useCallback(async (faqId: string, direction: FAQMoveDirection): Promise<void> => {
    if (!business) throw new Error('Primero tenés que configurar tu negocio.')
    const faqs = await moveStoredFaq(business.id, faqId, direction)
    setBusiness(current => current ? { ...current, faq: faqs } : current)
  }, [business])

  return (
    <BusinessContext.Provider value={{
      business,
      faqCategories,
      isBusinessLoading,
      stats: DEFAULT_STATS,
      loadBusiness,
      loadBusinessBySlug,
      saveBusiness,
      updateBusiness,
      createFaq,
      updateFaq,
      deleteFaq,
      toggleFaq,
      moveFaq,
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness debe usarse dentro de BusinessProvider')
  return ctx
}
