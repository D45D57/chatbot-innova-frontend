import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Business } from '../../types'
import { AppIcon, type AppIconName } from '../ui/AppIcon'
import { Avatar } from '../ui/Avatar'

interface DrawerProps {
  business: Business | null
  isOpen: boolean
  onClose: () => void
  activeItem?: string
  desktopPersistent?: boolean
  showBusinessAvatar?: boolean
}

interface AvailableNavItem {
  id: string
  label: string
  icon: AppIconName
  path: string
  comingSoon?: false
}

interface ComingSoonNavItem {
  id: string
  label: string
  icon: AppIconName
  comingSoon: true
}

type NavItem = AvailableNavItem | ComingSoonNavItem

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { id: 'catalogo', label: 'Catálogo', icon: 'catalog', path: '/catalogo' },
  { id: 'faq', label: 'FAQ', icon: 'faq', path: '/faq' },
  { id: 'consultas', label: 'Consultas', icon: 'chat', path: '/consultas' },
  { id: 'presupuestos', label: 'Presupuestos', icon: 'budget', path: '/presupuestos' },
  { id: 'metricas', label: 'Métricas', icon: 'metrics', path: '/metricas' },
  { id: 'configuracion', label: 'Configuración', icon: 'settings', path: '/configurar' },
]

export function Drawer({
  business,
  isOpen,
  onClose,
  activeItem = 'dashboard',
  desktopPersistent = false,
  showBusinessAvatar = false,
}: DrawerProps) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleNav = (item: AvailableNavItem) => {
    const options = item.id === 'faq' ? { state: { resetFaqView: true } } : undefined
    navigate(item.path, options)
    onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {isOpen && <button type="button" className="app-drawer__overlay" onClick={onClose} aria-label="Cerrar menú" />}

      <aside
        className={`app-drawer${isOpen ? ' app-drawer--open' : ''}${desktopPersistent ? ' app-drawer--persistent' : ''}`}
        aria-hidden={!isOpen && !desktopPersistent}
      >
        <div className="app-drawer__brand">
          <div className="app-drawer__brand-name">
            <img src="/isoBot-transparente.png" alt="" aria-hidden="true" />
            <span>EmprendeBot</span>
          </div>
          <button type="button" className="app-drawer__close" onClick={onClose} aria-label="Cerrar menú">
            <AppIcon name="close" size={20} />
          </button>
        </div>

        <div className={`app-drawer__business${showBusinessAvatar ? ' app-drawer__business--with-avatar' : ''}`}>
          {showBusinessAvatar && user && (
            <div className="app-drawer__business-avatar">
              <Avatar name={user.nombre} src={business?.logo} size={58} />
            </div>
          )}
          <div className="app-drawer__business-copy">
            <span>Tu negocio</span>
            <strong title={business?.nombre ?? 'Negocio sin configurar'}>
              {business?.nombre ?? 'Negocio sin configurar'}
            </strong>
          </div>
        </div>

        <nav className="app-drawer__nav" aria-label="Navegación principal">
          {NAV_ITEMS.map(item => {
            const disabled = item.comingSoon === true
            const active = activeItem === item.id

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                onClick={disabled ? undefined : () => handleNav(item)}
                className={`app-drawer__item${active ? ' app-drawer__item--active' : ''}${disabled ? ' app-drawer__item--disabled' : ''}`}
              >
                <AppIcon name={item.icon} size={20} />
                <span className="app-drawer__item-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="app-drawer__footer">
          <button type="button" className="app-drawer__logout" onClick={handleLogout}>
            <AppIcon name="logout" size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <style>{`
        .app-drawer__overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, .58);
          backdrop-filter: blur(2px);
          cursor: default;
        }

        .app-drawer {
          --drawer-bg: #FFFFFF;
          --drawer-text: #1A202C;
          --drawer-muted: #6C738E;
          --drawer-border: #E2E8F0;
          --drawer-hover: #E8F5F5;
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 101;
          width: min(292px, 86vw);
          height: 100svh;
          display: flex;
          flex-direction: column;
          color: var(--drawer-text);
          background: var(--drawer-bg);
          border-right: 1px solid var(--drawer-border);
          box-shadow: 16px 0 42px rgba(15, 23, 42, .16);
          transform: translateX(-105%);
          transition: transform .25s ease;
        }

        :root[data-theme='dark'] .app-drawer {
          --drawer-bg: #1E293B;
          --drawer-text: #F8FAFC;
          --drawer-muted: #94A3B8;
          --drawer-border: #334155;
          --drawer-hover: #1E3A3A;
        }

        .app-drawer--open {
          transform: translateX(0);
        }

        .app-drawer__brand {
          min-height: 82px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--drawer-border);
        }

        .app-drawer__brand-name {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .app-drawer__brand-name img {
          width: 42px;
          height: 42px;
          object-fit: contain;
        }

        .app-drawer__brand-name span {
          color: #13A8A2;
          font-size: 20px;
          font-weight: 800;
        }

        .app-drawer__close {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          color: var(--drawer-muted);
          border: 1px solid var(--drawer-border);
          border-radius: 11px;
          background: transparent;
        }

        .app-drawer__business {
          margin: 16px 16px 8px;
          padding: 13px 14px;
          border: 1px solid var(--drawer-border);
          border-radius: 14px;
          background: color-mix(in srgb, var(--drawer-bg) 88%, #13A8A2 12%);
        }

        .app-drawer__business-avatar {
          display: none;
          flex: 0 0 auto;
        }

        .app-drawer__business-copy {
          min-width: 0;
        }

        .app-drawer__business-copy span {
          display: block;
          margin-bottom: 3px;
          color: var(--drawer-muted);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        .app-drawer__business-copy strong {
          display: block;
          overflow: hidden;
          font-size: 14px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .app-drawer__nav {
          flex: 1;
          padding: 8px 14px 16px;
          overflow-y: auto;
        }

        .app-drawer__item,
        .app-drawer__logout {
          width: 100%;
          min-height: 48px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--drawer-text);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          transition: color var(--transition), background-color var(--transition), transform var(--transition);
        }

        .app-drawer__item + .app-drawer__item {
          margin-top: 4px;
        }

        .app-drawer__item:hover:not(:disabled),
        .app-drawer__logout:hover {
          color: #13A8A2;
          background: var(--drawer-hover);
          transform: translateX(2px);
        }

        .app-drawer__item:focus-visible,
        .app-drawer__logout:focus-visible,
        .app-drawer__close:focus-visible {
          outline: 3px solid rgba(19, 168, 162, .28);
          outline-offset: 2px;
        }

        .app-drawer__item--active {
          color: #FFFFFF;
          background: linear-gradient(90deg, #13A8A2 0%, #255F80 100%);
          box-shadow: 0 8px 18px rgba(19, 168, 162, .22);
        }

        .app-drawer__item--disabled {
          color: var(--drawer-text);
          cursor: default;
          opacity: 1;
        }

        .app-drawer__item-label {
          flex: 1;
        }

        .app-drawer__footer {
          padding: 14px;
          border-top: 1px solid var(--drawer-border);
        }

        .app-drawer__logout {
          color: #EF4444;
        }

        @media (min-width: 1000px) {
          .app-drawer--persistent {
            z-index: 30;
            width: 280px;
            box-shadow: none;
            transform: translateX(0);
          }

          .app-drawer--persistent .app-drawer__business--with-avatar {
            min-height: 88px;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .app-drawer--persistent .app-drawer__business-avatar {
            display: block;
          }

          .app-drawer--persistent .app-drawer__close {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
