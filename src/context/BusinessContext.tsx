import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Business, DashboardStats } from '../types'
import {
  getStoredBusinesses,
  saveStoredBusinesses,
} from '../services/businessStorage'
import { apiRequest } from '../services/apiClient'
import { DEFAULT_CHAT_APPEARANCE } from '../services/chatAppearance'
import { useAuth } from './AuthContext'

interface BotConfigResponse {
  success: boolean
  configuracion: {
    id: string
    usuarioId: string
    nombreNegocio?: string | null
    descripcionBreve?: string | null
    horarioAtencion?: string | null
    telefono?: string | null
    mensajeBienvenida?: string | null
    respuestaDerivacion?: string | null
    logoUrl?: string | null
    rubroId?: string | null
    rubro?: {
      id: string
      nombre: string
    } | null
    slug?: string | null
    colorPrimario?: string | null
    colorSecundario?: string | null
  }
}

interface BusinessContextType {
  business: Business | null
  isBusinessLoading: boolean
  stats: DashboardStats
  loadBusiness: (userId: string) => Promise<Business | null>
  loadBusinessBySlug: (slug: string) => Business | null
  saveBusiness: (data: Partial<Business> & { userId: string }) => Business
  updateBusiness: (data: Partial<Business>) => void
}

const DEFAULT_STATS: DashboardStats = {
  consultasPendientes: 0,
  presupuestosPendientes: 0,
  consultasResueltas: 0,
  porcentajeAutomatizacion: 0,
}

const BusinessContext = createContext<BusinessContextType | null>(null)

const withoutStoredFaqs = (business: Business): Business => ({
  ...business,
  faq: [],
  faqCategories: [],
})

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [business, setBusiness] = useState<Business | null>(null)
  const [isBusinessLoading, setIsBusinessLoading] = useState(true)

  useEffect(() => {
    if (!user || (business && business.userId !== user.id)) {
      setBusiness(null)
      setIsBusinessLoading(false)
    }
  }, [user, business])

  const loadBusiness = useCallback(async (userId: string): Promise<Business | null> => {
    setIsBusinessLoading(true)
    try {
      const storedBusinesses = getStoredBusinesses()
      const stored = storedBusinesses.find(item => item.userId === userId)
      const { configuracion } = await apiRequest<BotConfigResponse>('/bot')
      const synced: Business = {
        id: configuracion.id,
        userId: configuracion.usuarioId || userId,
        nombre: configuracion.nombreNegocio ?? stored?.nombre ?? '',
        descripcion: configuracion.descripcionBreve ?? '',
        horario: configuracion.horarioAtencion ?? '',
        telefono: configuracion.telefono ?? '',
        mensajeBienvenida: configuracion.mensajeBienvenida ?? '¡Hola! ¿En qué te puedo ayudar?',
        respuestaDerivacion: configuracion.respuestaDerivacion ?? 'Te voy a conectar con un asesor en breve.',
        logo: configuracion.logoUrl ?? undefined,
        rubro: stored?.rubro ?? '',
        rubroId: configuracion.rubroId ?? undefined,
        rubroNombre: configuracion.rubro?.nombre ?? undefined,
        productos: stored?.productos ?? [],
        faq: [],
        faqCategories: [],
        slug: configuracion.slug ?? stored?.slug ?? '',
        colorPrimario: configuracion.colorPrimario ?? DEFAULT_CHAT_APPEARANCE.primary,
        colorSecundario: configuracion.colorSecundario ?? DEFAULT_CHAT_APPEARANCE.secondary,
      }
      const updatedBusinesses = stored
        ? storedBusinesses.map(item => item.userId === userId ? synced : item)
        : [...storedBusinesses, synced]
      saveStoredBusinesses(updatedBusinesses)
      setBusiness(synced)
      return synced
    } catch {
      const stored = getStoredBusinesses().find(item => item.userId === userId) ?? null
      const fallback = stored
        ? {
            ...withoutStoredFaqs(stored),
            colorPrimario: DEFAULT_CHAT_APPEARANCE.primary,
            colorSecundario: DEFAULT_CHAT_APPEARANCE.secondary,
          }
        : null
      setBusiness(fallback)
      return fallback
    } finally {
      setIsBusinessLoading(false)
    }
  }, [])

  const loadBusinessBySlug = useCallback((slug: string): Business | null => {
    const found = getStoredBusinesses().find(item => item.slug === slug) ?? null
    return found ? withoutStoredFaqs(found) : null
  }, [])

  const saveBusiness = useCallback((data: Partial<Business> & { userId: string }): Business => {
    const all = getStoredBusinesses()
    const existing = all.find(item => item.userId === data.userId)
    const newBusiness: Business = {
      id: existing?.id ?? crypto.randomUUID(),
      productos: existing?.productos ?? [],
      rubro: existing?.rubro ?? '',
      ...existing,
      ...data,
      nombre: data.nombre ?? '',
      descripcion: data.descripcion ?? '',
      horario: data.horario ?? '',
      telefono: data.telefono ?? '',
      mensajeBienvenida: data.mensajeBienvenida ?? '¡Hola! ¿En qué te puedo ayudar?',
      respuestaDerivacion: data.respuestaDerivacion ?? 'Te voy a conectar con un asesor en breve.',
      slug: data.slug ?? '',
      colorPrimario: data.colorPrimario ?? DEFAULT_CHAT_APPEARANCE.primary,
      colorSecundario: data.colorSecundario ?? DEFAULT_CHAT_APPEARANCE.secondary,
      faq: [],
      faqCategories: [],
    }
    const updated = existing
      ? all.map(item => item.userId === data.userId ? newBusiness : item)
      : [...all, newBusiness]
    saveStoredBusinesses(updated)
    setBusiness(newBusiness)
    return newBusiness
  }, [])

  const updateBusiness = useCallback((data: Partial<Business>) => {
    setBusiness(current => {
      if (!current) return current
      const updated = withoutStoredFaqs({ ...current, ...data })
      const all = getStoredBusinesses().map(item =>
        item.id === updated.id ? updated : withoutStoredFaqs(item),
      )
      saveStoredBusinesses(all)
      return updated
    })
  }, [])

  return (
    <BusinessContext.Provider value={{
      business,
      isBusinessLoading,
      stats: DEFAULT_STATS,
      loadBusiness,
      loadBusinessBySlug,
      saveBusiness,
      updateBusiness,
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
