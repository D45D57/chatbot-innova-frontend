import type { Business } from '../types'

export interface ChatAppearance {
  primary: string
  secondary: string
}

export const DEFAULT_CHAT_APPEARANCE: ChatAppearance = {
  primary: '#13A8A2',
  secondary: '#1372A8',
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export function resolveChatAppearance(business: Pick<Business, 'colorPrimario' | 'colorSecundario'>): ChatAppearance {
  return {
    primary: isValidHexColor(business.colorPrimario ?? '')
      ? business.colorPrimario!.toUpperCase()
      : DEFAULT_CHAT_APPEARANCE.primary,
    secondary: isValidHexColor(business.colorSecundario ?? '')
      ? business.colorSecundario!.toUpperCase()
      : DEFAULT_CHAT_APPEARANCE.secondary,
  }
}
