import type { Business } from '../types'

const BUSINESSES_KEY = 'eb_businesses'

export function getStoredBusinesses(): Business[] {
  try {
    const stored = localStorage.getItem(BUSINESSES_KEY)
    return stored ? JSON.parse(stored) as Business[] : []
  } catch {
    return []
  }
}

export function saveStoredBusinesses(businesses: Business[]): void {
  localStorage.setItem(BUSINESSES_KEY, JSON.stringify(businesses))
}

export function updateStoredBusiness(
  businessId: string,
  updater: (business: Business) => Business,
): Business {
  const businesses = getStoredBusinesses()
  const businessIndex = businesses.findIndex(item => item.id === businessId)

  if (businessIndex === -1) {
    throw new Error('No se encontró el negocio solicitado.')
  }

  const updatedBusiness = updater(businesses[businessIndex])
  businesses[businessIndex] = updatedBusiness
  saveStoredBusinesses(businesses)
  return updatedBusiness
}
