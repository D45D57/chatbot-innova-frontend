import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { Drawer } from '../components/layout/Drawer'
import { StatCard } from '../components/dashboard/StatCard'
import { Avatar } from '../components/ui/Avatar'
import { AppIcon } from '../components/ui/AppIcon'
import { brand } from '../styles/brand'

const rubroLabels: Record<string, string> = {
  gastronomia: 'Gastronomia',
  peluqueria: 'Peluqueria',
  indumentaria: 'Indumentaria',
  tecnologia: 'Tecnologia',
  servicios: 'Servicios',
  salud: 'Salud',
  educacion: 'Educacion',
  otro: 'Negocio',
}

function IconWrapper({ children, color = brand.primary }: { children: ReactNode; color?: string }) {
  return (
    <span style={{
      color,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </span>
  )
}

function QuickAccessCard({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 118,
        padding: '18px 10px',
        borderRadius: '12px',
        border: `1px solid ${brand.border}`,
        background: brand.surface,
        boxShadow: brand.shadowCard,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: brand.text,
        fontWeight: 700,
        fontSize: '12px',
      }}
    >
      <span style={{
        width: 42,
        height: 42,
        borderRadius: '11px',
        background: 'var(--color-surface-muted)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </span>
      {label}
    </button>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business, stats, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (user) loadBusiness(user.id)
  }, [user, loadBusiness])

  if (!user) {
    navigate('/login')
    return null
  }

  const firstName = user.nombre.split(' ')[0]
  const businessName = business?.nombre ?? 'Tu negocio'
  const selectedRubro = business?.rubro || user.rubro
  const businessType = selectedRubro ? rubroLabels[selectedRubro] ?? selectedRubro : 'Rubro no configurado'

  const metrics = [
    {
      label: 'Consultas recibidas',
      value: stats.consultasPendientes,
      description: 'Requieren seguimiento',
      color: brand.primary,
      icon: <IconWrapper color="#FFFFFF"><AppIcon name="chat" size={21} /></IconWrapper>,
      tone: 'primary' as const,
    },
    {
      label: 'Presupuestos generados',
      value: stats.presupuestosPendientes,
      description: 'Pedidos comerciales activos',
      color: '#7C3AED',
      icon: <IconWrapper color="#FFFFFF"><AppIcon name="budget" size={21} /></IconWrapper>,
      tone: 'secondary' as const,
    },
    {
      label: 'Automatizacion',
      value: `${stats.porcentajeAutomatizacion}%`,
      description: 'Respuestas gestionadas por el bot',
      color: '#16C784',
      icon: <IconWrapper color="#FFFFFF"><AppIcon name="automation" size={21} /></IconWrapper>,
      tone: 'success' as const,
    },
    {
      label: 'Conversaciones abandonadas',
      value: 0,
      description: 'Sin respuesta final',
      color: '#FF4B1F',
      icon: <IconWrapper color="#FFFFFF"><AppIcon name="alert" size={21} /></IconWrapper>,
      tone: 'danger' as const,
    },
  ]

  return (
    <>
      <Drawer
        business={business}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="dashboard"
      />

      <div style={{
        flex: 1,
        minHeight: '100svh',
        background: brand.surface,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <header style={{
          height: 56,
          padding: '12px 20px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: brand.surface,
        }}>
          <button
            type="button"
            aria-label="Abrir navegacion"
            onClick={() => setDrawerOpen(true)}
            style={{
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: brand.text,
              background: 'transparent',
            }}
          >
            <AppIcon name="menu" size={21} strokeWidth={2.2} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span aria-hidden="true" style={{ color: brand.text, lineHeight: 1, display: 'inline-flex' }}>
              <AppIcon name="bell" size={21} />
            </span>
            <Avatar name={user.nombre} size={32} bgColor={brand.primaryGradient} />
          </div>
        </header>

        <main style={{
          flex: 1,
          padding: '18px 20px calc(142px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
        }}>
          <section style={{ marginBottom: '18px' }}>
            <h1 style={{
              color: brand.text,
              fontSize: '22px',
              lineHeight: 1.15,
              fontWeight: 800,
              marginBottom: '10px',
            }}>
              Hola, {firstName}
            </h1>
            <p style={{ color: brand.text, fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>
              {businessName}
            </p>
            <p style={{ color: brand.text, fontSize: '11px', lineHeight: 1.2 }}>
              {businessType}{' '}
              <span style={{ color: brand.muted, display: 'inline-flex', verticalAlign: '-3px' }}>
                <AppIcon name="business" size={13} strokeWidth={1.8} />
              </span>
            </p>
          </section>

          <section style={{ display: 'grid', gap: '12px', marginBottom: '22px' }}>
            {metrics.map(metric => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </section>

          <section style={{ marginBottom: '20px' }}>
            <h2 style={{ color: brand.text, fontSize: '15px', fontWeight: 800, marginBottom: '10px' }}>
              Accesos rapidos
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              <QuickAccessCard
                label="Catalogo"
                icon={<IconWrapper color={brand.primary}><AppIcon name="catalog" /></IconWrapper>}
                onClick={() => navigate('/catalogo')}
              />
              <QuickAccessCard
                label="FAQ"
                icon={<IconWrapper color={brand.secondary}><AppIcon name="faq" /></IconWrapper>}
                onClick={() => navigate('/faq')}
              />
              <QuickAccessCard
                label="Consultas"
                icon={<IconWrapper color={brand.primary}><AppIcon name="chat" /></IconWrapper>}
                onClick={() => navigate('/consultas')}
              />
              <QuickAccessCard
                label="Configuracion"
                icon={<IconWrapper color={brand.orange}><AppIcon name="settings" /></IconWrapper>}
                onClick={() => navigate('/configurar')}
              />
            </div>
          </section>

          <section>
            <h2 style={{ color: brand.text, fontSize: '15px', fontWeight: 800, marginBottom: '10px' }}>
              Actividad reciente
            </h2>
            <div style={{
              minHeight: 158,
              padding: '24px 18px',
              borderRadius: '12px',
              border: `1px solid ${brand.border}`,
              background: brand.surface,
              boxShadow: brand.shadowCard,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}>
              <span style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'rgba(19, 168, 162, 0.10)',
                color: brand.primary,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <AppIcon name="chat" size={25} />
              </span>
              <p style={{ color: brand.muted, fontSize: '13px', lineHeight: 1.45, maxWidth: 250 }}>
                Las actividades de tus clientes apareceran aqui cuando comiencen a usar el chatbot.
              </p>
            </div>
          </section>
        </main>

        <button
          type="button"
          aria-label="Abrir asistente: Probá tu Bot"
          onClick={() => business && navigate(`/${business.slug}`)}
          style={{
            position: 'fixed',
            right: 'calc(16px + env(safe-area-inset-right, 0px))',
            bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            maxWidth: 'calc(100vw - 32px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
            border: 0,
            background: 'transparent',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 0,
            color: brand.text,
            zIndex: 20,
          }}
        >
          <span style={{
            minHeight: 37,
            maxWidth: '100%',
            padding: '8px 14px',
            borderRadius: 999,
            border: `1px solid ${brand.border}`,
            background: brand.surface,
            boxShadow: '0 6px 13px rgba(17, 24, 39, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}>
            <span aria-hidden="true" style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#65E6A5',
              flexShrink: 0,
            }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Probá tu Bot
            </span>
          </span>
          <span aria-hidden="true" style={{
            width: 62,
            height: 62,
            borderRadius: '50%',
            border: `2px solid ${brand.primary}`,
            background: brand.surface,
            boxShadow: '0 6px 13px rgba(17, 24, 39, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-end',
            marginRight: 2,
            padding: 6,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <img src="/isoBot-transparente.png" alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} />
          </span>
        </button>
      </div>
    </>
  )
}

