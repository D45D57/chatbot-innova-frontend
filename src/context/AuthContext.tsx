import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { apiRequest } from '../services/apiClient'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<User>
  register: (nombre: string, email: string, password: string, rubro: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const CURRENT_USER_KEY = 'eb_current_user'
const TOKEN_KEY = 'eb_auth_token'

interface LoginResponse {
  success: boolean
  token: string
  usuario: { id: string; nombre: string; email: string; rol: string }
}

interface RegisterResponse {
  success: boolean
  usuarioId: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(CURRENT_USER_KEY)
    if (saved) setUser(JSON.parse(saved))
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const data = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    })

    localStorage.setItem(TOKEN_KEY, data.token)

    const userData: User = {
      id: data.usuario.id,
      nombre: data.usuario.nombre,
      email: data.usuario.email,
      slug: data.usuario.nombre.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''),
    }

    setUser(userData)
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData))
  }

  const register = async (nombre: string, email: string, password: string, _rubro: string): Promise<User> => {
    await apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password }),
      auth: false,
    })

    // Después del registro, hacemos login automático para obtener el token
    await login(email, password)

    const saved = localStorage.getItem(CURRENT_USER_KEY)
    return saved ? JSON.parse(saved) : { id: '', nombre, email, slug: '' }
  }

  const loginWithGoogle = async (credential: string): Promise<User> => {
    const data = await apiRequest<LoginResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
      auth: false,
    })

    const googleUser: User = {
      id: data.usuario.id,
      nombre: data.usuario.nombre,
      email: data.usuario.email,
      slug: data.usuario.nombre.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''),
    }

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(googleUser))
    setUser(googleUser)
    return googleUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
