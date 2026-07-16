import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Business } from '../../types'

interface DrawerProps {
  business: Business | null
  isOpen: boolean
  onClose: () => void
  activeItem?: string
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { id: 'consultas', label: 'Consultas', icon: '💬', path: '/consultas' },
  { id: 'catalogo', label: 'Catálogo', icon: '🛍️', path: '/catalogo' },
  { id: 'faq', label: 'FAQ', icon: '❓', path: '/faq' },
  { id: 'configuracion', label: 'Configuración', icon: '⚙️', path: '/configurar' },
]

export function Drawer({ business, isOpen, onClose, activeItem = 'dashboard' }: DrawerProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleNav = (item: typeof NAV_ITEMS[number]) => {
    navigate(item.path, item.id === 'faq' ? { state: { resetFaqView: Date.now() } } : undefined)
    onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
          }}
        />
      )}

      {/* Panel */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-280px',
          width: '280px',
          height: '100svh',
          background: 'var(--color-bg)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          transition: 'left 0.25s ease',
          boxShadow: isOpen ? 'var(--shadow-lg)' : 'none',
        }}
      >
        {/* Header del drawer */}
        <div style={{
          padding: '24px 20px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
              Nombre del negocio
            </p>
            <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)' }}>
              {business?.nombre ?? 'Mi Negocio'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '14px 20px',
                background: activeItem === item.id ? 'rgba(19,171,162,0.08)' : 'transparent',
                color: activeItem === item.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                fontWeight: activeItem === item.id ? 600 : 400,
                fontSize: '15px',
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'var(--font-family)',
                textAlign: 'left',
                borderLeft: activeItem === item.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                transition: 'all var(--transition)',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-family)',
              padding: '8px 0',
            }}
          >
            <span>↩️</span> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
