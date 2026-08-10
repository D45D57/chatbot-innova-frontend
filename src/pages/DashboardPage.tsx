import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { Drawer } from '../components/layout/Drawer'
import { StatCard } from '../components/dashboard/StatCard'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { Avatar } from '../components/ui/Avatar'
import { AppIcon } from '../components/ui/AppIcon'
import { brand } from '../styles/brand'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { openChatPreview } from '../utils/chatRoutes'

function IconWrapper({ children }: { children: ReactNode }) {
  return <span className="dashboard-icon-wrapper">{children}</span>
}

function QuickAccessCard({
  label,
  icon,
  tone,
  onClick,
}: {
  label: string
  icon: ReactNode
  tone: string
  onClick: () => void
}) {
  return (
    <button type="button" className="dashboard-quick-card" onClick={onClick}>
      <span className="dashboard-quick-card__icon" style={{ color: tone }}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business, isBusinessLoading, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { stats, refetch } = useDashboardStats(business ? user?.id : undefined)

  useEffect(() => {
    if (user) void loadBusiness(user.id)
  }, [user, loadBusiness])

  if (!user) {
    navigate('/login')
    return null
  }

  const firstName = user.nombre.split(' ')[0]
  const businessUnavailable = !isBusinessLoading && !business
  const hasStatsError = !businessUnavailable && [
    stats.consultasPendientes,
    stats.presupuestosPendientes,
    stats.consultasResueltas,
    stats.porcentajeAutomatizacion,
  ].some(metric => metric.status === 'error')

  const metrics = [
    {
      label: 'Consultas recibidas',
      value: stats.consultasPendientes.value,
      description: 'Nuevas y en seguimiento',
      color: brand.primary,
      icon: <IconWrapper><AppIcon name="chat" size={22} /></IconWrapper>,
      tone: 'primary' as const,
      loading: isBusinessLoading || (!businessUnavailable && stats.consultasPendientes.status === 'loading'),
      error: !businessUnavailable && stats.consultasPendientes.status === 'error',
      unavailable: businessUnavailable,
      onClick: () => navigate('/consultas?estado=activas'),
    },
    {
      label: 'Presupuestos registrados',
      value: stats.presupuestosPendientes.value,
      description: 'Solicitudes recibidas desde el chat',
      color: '#7C3AED',
      icon: <IconWrapper><AppIcon name="budget" size={22} /></IconWrapper>,
      tone: 'secondary' as const,
      loading: isBusinessLoading || (!businessUnavailable && stats.presupuestosPendientes.status === 'loading'),
      error: !businessUnavailable && stats.presupuestosPendientes.status === 'error',
      unavailable: businessUnavailable,
      onClick: () => navigate('/presupuestos'),
    },
    {
      label: 'Automatización estimada',
      value: stats.porcentajeAutomatizacion.value,
      description: stats.porcentajeAutomatizacion.detail ?? 'Consultas atendidas sin intervención humana',
      color: '#16C784',
      icon: <IconWrapper><AppIcon name="automation" size={22} /></IconWrapper>,
      tone: 'success' as const,
      loading: isBusinessLoading || (!businessUnavailable && stats.porcentajeAutomatizacion.status === 'loading'),
      error: !businessUnavailable && stats.porcentajeAutomatizacion.status === 'error',
      unavailable: businessUnavailable || stats.porcentajeAutomatizacion.status === 'unavailable',
      helpText: 'Estimación basada en consultas atendidas sin intervención humana.',
      onClick: () => navigate('/metricas'),
    },
    {
      label: 'Consultas resueltas',
      value: stats.consultasResueltas.value,
      description: 'Atendidas automáticamente por el chatbot',
      color: '#F97316',
      icon: <IconWrapper><AppIcon name="check" size={22} /></IconWrapper>,
      tone: 'warning' as const,
      loading: isBusinessLoading || (!businessUnavailable && stats.consultasResueltas.status === 'loading'),
      error: !businessUnavailable && stats.consultasResueltas.status === 'error',
      unavailable: businessUnavailable,
      onClick: () => navigate('/consultas?estado=resuelta_bot'),
    },
  ]

  return (
    <div className="dashboard-page">
      <Drawer
        business={business}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="dashboard"
        desktopPersistent
        showBusinessAvatar
      />

      <div className="dashboard-page__content">
        <header className="dashboard-header">
          <button
            type="button"
            aria-label="Abrir navegación"
            className="dashboard-header__menu"
            onClick={() => setDrawerOpen(true)}
          >
            <AppIcon name="menu" size={22} strokeWidth={2.2} />
          </button>
          <strong>Dashboard</strong>
          <Avatar name={user.nombre} src={business?.logo} size={38} bgColor={brand.primaryGradient} />
        </header>

        <main className="dashboard-main">
          <section className="dashboard-welcome">
            <div>
              <p className="dashboard-welcome__eyebrow">Resumen general</p>
              <h1>Hola, {firstName}</h1>
              <p>Esto es lo que está pasando hoy en tu negocio.</p>
            </div>
          </section>

          <section aria-labelledby="dashboard-summary-title">
            <h2 id="dashboard-summary-title" className="dashboard-section-title">Resumen</h2>
            {hasStatsError && (
              <div className="dashboard-stats-notice" role="status">
                <span>Algunos datos no pudieron cargarse.</span>
                <button type="button" onClick={() => void refetch()}>Reintentar</button>
              </div>
            )}
            <div className="dashboard-metrics">
              {metrics.map(metric => <StatCard key={metric.label} {...metric} />)}
            </div>
          </section>

          <section aria-labelledby="dashboard-quick-title">
            <h2 id="dashboard-quick-title" className="dashboard-section-title">Accesos rápidos</h2>
            <div className="dashboard-quick-grid">
              <QuickAccessCard
                label="Catálogo"
                tone={brand.primary}
                icon={<AppIcon name="catalog" size={28} />}
                onClick={() => navigate('/catalogo')}
              />
              <QuickAccessCard
                label="FAQ"
                tone={brand.secondary}
                icon={<AppIcon name="faq" size={28} />}
                onClick={() => navigate('/faq')}
              />
              <QuickAccessCard
                label="Consultas"
                tone="#7C3AED"
                icon={<AppIcon name="chat" size={28} />}
                onClick={() => navigate('/consultas')}
              />
              <QuickAccessCard
                label="Configuración"
                tone={brand.orange}
                icon={<AppIcon name="settings" size={28} />}
                onClick={() => navigate('/configurar')}
              />
            </div>
          </section>

          <section aria-labelledby="dashboard-activity-title">
            <h2 id="dashboard-activity-title" className="dashboard-section-title">Actividad reciente</h2>
            <RecentActivity data={stats.recentActivity} onRetry={() => void refetch()} />
          </section>
        </main>

        <button
          type="button"
          className="dashboard-bot"
          disabled={!business?.slug}
          aria-label="Abrir asistente: Probá tu Bot"
          onClick={() => business?.slug && openChatPreview(business.slug, navigate)}
        >
          <span className="dashboard-bot__label">
            <i aria-hidden="true" />
            Probá tu Bot
          </span>
          <span className="dashboard-bot__avatar" aria-hidden="true">
            <img src="/isoBot-transparente.png" alt="" />
          </span>
        </button>
      </div>

      <style>{`
        .dashboard-page {
          --dashboard-bg: #F8FAFB;
          --dashboard-card: #FFFFFF;
          --dashboard-text: #1A202C;
          --dashboard-muted: #6C738E;
          --dashboard-border: #E2E8F0;
          position: fixed;
          inset: 0;
          z-index: 10;
          overflow: auto;
          color: var(--dashboard-text);
          background: var(--dashboard-bg);
        }

        :root[data-theme='dark'] .dashboard-page {
          --dashboard-bg: #0F172A;
          --dashboard-card: #1E293B;
          --dashboard-text: #F8FAFC;
          --dashboard-muted: #94A3B8;
          --dashboard-border: #334155;
        }

        .dashboard-page__content {
          min-height: 100svh;
          transition: margin-left .25s ease;
        }

        .dashboard-header {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 64px;
          padding: 12px clamp(18px, 3vw, 34px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--dashboard-border);
          background: color-mix(in srgb, var(--dashboard-bg) 92%, transparent);
          backdrop-filter: blur(14px);
        }

        .dashboard-header > strong { font-size: 14px; }

        .dashboard-header__menu {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          color: var(--dashboard-text);
          border: 1px solid var(--dashboard-border);
          border-radius: 11px;
          background: var(--dashboard-card);
        }

        .dashboard-header__profile {
          gap: 12px;
        }

        .dashboard-main {
          width: min(100%, 1380px);
          margin: 0 auto;
          padding: clamp(24px, 4vw, 48px) clamp(18px, 3vw, 36px) 150px;
        }

        .dashboard-welcome {
          margin-bottom: 24px;
          display: flex;
          align-items: end;
          justify-content: space-between;
        }

        .dashboard-welcome__eyebrow {
          margin: 0 0 7px;
          color: #13A8A2;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.1px;
          text-transform: uppercase;
        }

        .dashboard-welcome h1 {
          margin: 0 0 7px;
          font-size: clamp(28px, 3vw, 38px);
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .dashboard-welcome > div > p:last-child {
          margin: 0;
          color: var(--dashboard-muted);
          font-size: 14px;
        }

        .dashboard-section-title {
          margin: 0 0 14px;
          font-size: 18px;
        }

        .dashboard-metrics {
          margin-bottom: 30px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .dashboard-stats-notice {
          margin: -4px 0 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: var(--dashboard-muted);
          border: 1px solid var(--dashboard-border);
          border-radius: 11px;
          background: var(--dashboard-card);
          font-size: 12px;
        }

        .dashboard-stats-notice button {
          color: #13A8A2;
          font-size: 12px;
          font-weight: 700;
        }

        .dashboard-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        .dashboard-quick-grid {
          margin-bottom: 30px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .dashboard-quick-card {
          min-height: 132px;
          padding: 20px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--dashboard-text);
          border: 1px solid var(--dashboard-border);
          border-radius: 16px;
          background: var(--dashboard-card);
          box-shadow: 0 7px 20px rgba(15, 23, 42, .07);
          font-size: 13px;
          font-weight: 700;
          transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition);
        }

        .dashboard-quick-card:hover {
          border-color: #13A8A2;
          box-shadow: 0 14px 30px rgba(15, 23, 42, .11);
          transform: translateY(-3px);
        }

        .dashboard-quick-card:focus-visible,
        .dashboard-header button:focus-visible,
        .dashboard-bot:focus-visible {
          outline: 3px solid rgba(19, 168, 162, .3);
          outline-offset: 3px;
        }

        .dashboard-quick-card__icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: color-mix(in srgb, currentColor 11%, transparent);
        }

        .recent-activity-card {
          min-height: 190px;
          padding: 28px;
          border: 1px solid var(--dashboard-border);
          border-radius: 18px;
          background: var(--dashboard-card);
          box-shadow: 0 7px 20px rgba(15, 23, 42, .06);
        }

        .recent-activity-list {
          display: grid;
          gap: 10px;
        }

        .recent-activity-row {
          width: 100%;
          min-height: 68px;
          padding: 13px 15px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          color: var(--dashboard-text);
          text-align: left;
          border: 1px solid transparent;
          border-radius: 13px;
          background: color-mix(in srgb, var(--dashboard-bg) 68%, var(--dashboard-card));
          transition: border-color var(--transition), background var(--transition), transform var(--transition);
        }

        .recent-activity-row:hover {
          border-color: color-mix(in srgb, #13A8A2 45%, var(--dashboard-border));
          background: color-mix(in srgb, #13A8A2 7%, var(--dashboard-card));
          transform: translateY(-1px);
        }

        .recent-activity-row:focus-visible {
          outline: 3px solid rgba(19, 168, 162, .3);
          outline-offset: 2px;
        }

        .recent-activity-row__icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          border-radius: 50%;
          background: linear-gradient(135deg, #13A8A2, #1372A8);
          box-shadow: 0 7px 15px rgba(15, 23, 42, .13);
        }

        .recent-activity-row__icon.is-secondary { background: linear-gradient(135deg, #1372A8, #2563EB); }
        .recent-activity-row__icon.is-warning { background: linear-gradient(135deg, #F59E0B, #F97316); }
        .recent-activity-row__icon.is-success { background: linear-gradient(135deg, #10B981, #13A8A2); }
        .recent-activity-row__icon.is-danger { background: linear-gradient(135deg, #EF4444, #DC2626); }

        .recent-activity-row__content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .recent-activity-row__content strong {
          font-size: 13px;
          line-height: 1.4;
        }

        .recent-activity-row__content small,
        .recent-activity-row time {
          color: var(--dashboard-muted);
          font-size: 11px;
          line-height: 1.4;
        }

        .recent-activity-row time {
          white-space: nowrap;
        }

        .recent-activity-partial {
          margin: 0 0 12px;
          padding: 9px 11px;
          color: var(--dashboard-muted);
          border: 1px solid var(--dashboard-border);
          border-radius: 10px;
          background: color-mix(in srgb, #F59E0B 7%, var(--dashboard-card));
          font-size: 11px;
        }

        .recent-activity-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .recent-activity-state__icon {
          width: 58px;
          height: 58px;
          margin-bottom: 12px;
          display: grid;
          place-items: center;
          color: #13A8A2;
          border-radius: 16px;
          background: rgba(19, 168, 162, .11);
        }

        .recent-activity-state strong {
          margin-bottom: 5px;
          font-size: 14px;
        }

        .recent-activity-state p {
          max-width: 460px;
          margin: 0;
          color: var(--dashboard-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .recent-activity-state button {
          margin-top: 14px;
          padding: 9px 15px;
          color: #FFFFFF;
          border-radius: 10px;
          background: #0F918C;
          font-size: 12px;
          font-weight: 700;
        }

        .recent-activity-skeleton {
          min-height: 68px;
          padding: 13px 15px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) 110px;
          align-items: center;
          gap: 14px;
          border-radius: 13px;
          background: color-mix(in srgb, var(--dashboard-bg) 68%, var(--dashboard-card));
        }

        .recent-activity-skeleton > span,
        .recent-activity-skeleton i {
          display: block;
          border-radius: 8px;
          background: linear-gradient(90deg, var(--dashboard-border), var(--dashboard-card), var(--dashboard-border));
          background-size: 200% 100%;
          animation: dashboard-stat-loading 1.2s linear infinite;
        }

        .recent-activity-skeleton > span { width: 42px; height: 42px; border-radius: 50%; }
        .recent-activity-skeleton > div { display: grid; gap: 7px; }
        .recent-activity-skeleton > div i:first-child { width: min(340px, 85%); height: 13px; }
        .recent-activity-skeleton > div i:last-child { width: min(220px, 60%); height: 9px; }
        .recent-activity-skeleton > i { width: 100%; height: 10px; }
        .recent-activity-skeleton + .recent-activity-skeleton { margin-top: 10px; }

        .dashboard-bot {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 25;
          display: flex;
          flex-direction: column;
          align-items: end;
          gap: 8px;
          color: var(--dashboard-text);
        }

        .dashboard-bot:disabled {
          opacity: .48;
          cursor: not-allowed;
        }

        .dashboard-bot__label {
          min-height: 38px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--dashboard-border);
          border-radius: 999px;
          background: var(--dashboard-card);
          box-shadow: 0 8px 20px rgba(15, 23, 42, .16);
          font-size: 12px;
          font-weight: 700;
        }

        .dashboard-bot__label i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #65E6A5;
        }

        .dashboard-bot__avatar {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 2px solid #13A8A2;
          border-radius: 50%;
          background: var(--dashboard-card);
          box-shadow: 0 8px 20px rgba(15, 23, 42, .16);
        }

        .dashboard-bot__avatar img {
          width: 54px;
          height: 54px;
          object-fit: contain;
        }

        @media (min-width: 1000px) {
          .dashboard-page__content {
            margin-left: 280px;
          }

          .dashboard-header { display: none; }
          .dashboard-main { padding-top: 40px; }
        }

        @media (max-width: 1120px) {
          .dashboard-metrics,
          .dashboard-quick-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 620px) {
          .dashboard-header {
            min-height: 64px;
          }

          .dashboard-main {
            padding-top: 24px;
          }

          .dashboard-metrics {
            grid-template-columns: 1fr;
          }

          .dashboard-quick-grid {
            gap: 10px;
          }

          .dashboard-quick-card {
            min-height: 118px;
          }

          .dashboard-bot {
            right: 16px;
            bottom: 16px;
          }

          .recent-activity-card { padding: 14px; }
          .recent-activity-row {
            min-height: 76px;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 11px;
          }
          .recent-activity-row time {
            grid-column: 2;
            white-space: normal;
          }
          .recent-activity-skeleton {
            grid-template-columns: auto minmax(0, 1fr);
          }
          .recent-activity-skeleton > i {
            grid-column: 2;
            width: 90px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-page *,
          .dashboard-page *::before,
          .dashboard-page *::after {
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
            animation-duration: .01ms !important;
          }
          .recent-activity-skeleton > span,
          .recent-activity-skeleton i { animation: none; }
        }
      `}</style>
    </div>
  )
}
