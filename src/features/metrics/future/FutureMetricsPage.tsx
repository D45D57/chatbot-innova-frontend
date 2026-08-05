import { useEffect, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from '../../../components/layout/Drawer'
import {
  AbandonmentMomentsCard,
  ConversionFunnel,
  LostCapitalCard,
  MetricsEmptyState,
  MetricsErrorState,
  MetricsLoadingState,
  MetricsSummary,
  PeakHoursChart,
  ProductQueriesCard,
  TodayLeadsList,
  VisitedSectionsCard,
} from './FutureMetricsComponents'
import { Avatar } from '../../../components/ui/Avatar'
import { AppIcon } from '../../../components/ui/AppIcon'
import { PageBackButton } from '../../../components/navigation/PageBackButton'
import { useAuth } from '../../../context/AuthContext'
import { useBusiness } from '../../../context/BusinessContext'
import { useMetrics } from './useFutureMetrics'
import { METRICS_PERIOD_OPTIONS } from './futureMetrics.mock'
import type { MetricsData, MetricsPeriod } from './futureMetrics.types'
import { openChatPreview } from '../../../utils/chatRoutes'

type MetricsTab = 'summary' | 'abandonment' | 'leads'

const METRICS_TABS: Array<{ id: MetricsTab; label: string; icon: 'dashboard' | 'automation' | 'agent' }> = [
  { id: 'summary', label: 'Resumen', icon: 'dashboard' },
  { id: 'abandonment', label: 'Abandono', icon: 'automation' },
  { id: 'leads', label: 'Clientes interesados', icon: 'agent' },
]

function isSummaryEmpty(data: MetricsData) {
  return data.resumenTrafico.ventasConcretadas === 0
    && data.resumenTrafico.consultaronProductos === 0
    && data.resumenTrafico.abandonaronBot === 0
    && data.seccionesMasVisitadas.length === 0
    && data.detalleConsultasProducto.length === 0
}

function isAbandonmentEmpty(data: MetricsData) {
  return data.dondeSeVan.length === 0
    && data.momentoAbandono.length === 0
    && data.capitalFugado.sesionesConAltaIntencion === 0
}

function isLeadsEmpty(data: MetricsData) {
  return data.horasPico.length === 0 && data.leadsDeHoy.length === 0
}

export function MetricsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MetricsTab>('summary')
  const [period, setPeriod] = useState<MetricsPeriod>('last7Days')
  const { data, isLoading, error, refetch } = useMetrics({
    businessId: business?.id,
    period,
  })

  useEffect(() => {
    if (user) void loadBusiness(user.id)
  }, [loadBusiness, user])

  if (!user) return null

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentTab: MetricsTab) => {
    const currentIndex = METRICS_TABS.findIndex(tab => tab.id === currentTab)
    let nextIndex: number

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % METRICS_TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + METRICS_TABS.length) % METRICS_TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = METRICS_TABS.length - 1
    else return

    event.preventDefault()
    const nextTab = METRICS_TABS[nextIndex]
    setActiveTab(nextTab.id)
    document.getElementById(`metrics-tab-${nextTab.id}`)?.focus()
  }

  return (
    <div className="metrics-page">
      <Drawer
        business={business}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="metricas"
        desktopPersistent
        showBusinessAvatar
      />

      <div className="metrics-page__content">
        <header className="metrics-header">
          <button
            type="button"
            aria-label="Abrir navegación"
            className="metrics-header__menu"
            onClick={() => setDrawerOpen(true)}
          >
            <AppIcon name="menu" size={22} strokeWidth={2.2} />
          </button>
          <strong>Métricas</strong>
          <Avatar name={user.nombre} src={business?.logo} size={38} />
        </header>

        <main className="metrics-main">
          <PageBackButton onClick={() => navigate('/dashboard')} />
          <div className="metrics-heading">
            <div>
              <span className="metrics-eyebrow">ANÁLISIS</span>
              <h1>Métricas</h1>
              <p>Entendé cómo interactúan tus clientes y detectá oportunidades de venta.</p>
            </div>

            <div className="metrics-period">
              <label htmlFor="metrics-period-select">Período</label>
              <select
                id="metrics-period-select"
                value={period}
                onChange={event => setPeriod(event.target.value as MetricsPeriod)}
              >
                {METRICS_PERIOD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="metrics-tabs" role="tablist" aria-label="Secciones de métricas">
            {METRICS_TABS.map(tab => (
              <button
                key={tab.id}
                id={`metrics-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`metrics-panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={event => handleTabKeyDown(event, tab.id)}
              >
                <AppIcon name={tab.icon} size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <MetricsLoadingState />
          ) : error ? (
            <MetricsErrorState message={error} onRetry={() => void refetch()} />
          ) : !data ? (
            <MetricsEmptyState />
          ) : (
            <>
              {activeTab === 'summary' && (
                <section
                  id="metrics-panel-summary"
                  role="tabpanel"
                  aria-labelledby="metrics-tab-summary"
                  className="metrics-panel"
                >
                  {isSummaryEmpty(data) ? (
                    <MetricsEmptyState />
                  ) : (
                    <>
                      <MetricsSummary data={data.resumenTrafico} />
                      <div className="metrics-grid">
                        <VisitedSectionsCard sections={data.seccionesMasVisitadas} />
                        <ProductQueriesCard queries={data.detalleConsultasProducto} />
                      </div>
                    </>
                  )}
                </section>
              )}

              {activeTab === 'abandonment' && (
                <section
                  id="metrics-panel-abandonment"
                  role="tabpanel"
                  aria-labelledby="metrics-tab-abandonment"
                  className="metrics-panel metrics-grid"
                >
                  {isAbandonmentEmpty(data) ? (
                    <div className="metrics-panel__empty">
                      <MetricsEmptyState />
                    </div>
                  ) : (
                    <>
                      <ConversionFunnel stages={data.dondeSeVan} />
                      <AbandonmentMomentsCard moments={data.momentoAbandono} />
                      <LostCapitalCard data={data.capitalFugado} />
                    </>
                  )}
                </section>
              )}

              {activeTab === 'leads' && (
                <section
                  id="metrics-panel-leads"
                  role="tabpanel"
                  aria-labelledby="metrics-tab-leads"
                  className="metrics-panel metrics-grid"
                >
                  {isLeadsEmpty(data) ? (
                    <div className="metrics-panel__empty">
                      <MetricsEmptyState
                        title="Todavía no hay clientes interesados registrados hoy"
                        message="Las oportunidades comerciales captadas durante el día aparecerán en esta sección."
                      />
                    </div>
                  ) : (
                    <>
                      <PeakHoursChart hours={data.horasPico} />
                      <TodayLeadsList leads={data.leadsDeHoy} />
                    </>
                  )}
                </section>
              )}
            </>
          )}
        </main>

        <button
          type="button"
          className="metrics-public-bot"
          disabled={!business?.slug}
          aria-label="Abrir modo de prueba del chatbot"
          onClick={() => business?.slug && openChatPreview(business.slug, navigate)}
        >
          <span className="metrics-public-bot__label"><i aria-hidden="true" />Probá tu chat</span>
          <span className="metrics-public-bot__avatar" aria-hidden="true">
            <img src="/isoBot-transparente.png" alt="" />
          </span>
        </button>
      </div>

      <style>{`
        .metrics-page {
          --metrics-bg: #F8FAFB;
          --metrics-card: #FFFFFF;
          --metrics-text: #1A202C;
          --metrics-muted: #6C738E;
          --metrics-border: #E2E8F0;
          position: fixed;
          inset: 0;
          z-index: 10;
          overflow: auto;
          color: var(--metrics-text);
          background: var(--metrics-bg);
        }

        :root[data-theme='dark'] .metrics-page {
          --metrics-bg: #0F172A;
          --metrics-card: #1E293B;
          --metrics-text: #F8FAFC;
          --metrics-muted: #94A3B8;
          --metrics-border: #334155;
        }

        .metrics-page__content { min-height: 100svh; }

        .metrics-header {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 64px;
          padding: 12px clamp(18px, 3vw, 34px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--metrics-border);
          background: color-mix(in srgb, var(--metrics-bg) 92%, transparent);
          backdrop-filter: blur(14px);
        }

        .metrics-header > strong { font-size: 14px; }

        .metrics-header__menu {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          color: var(--metrics-text);
          border: 1px solid var(--metrics-border);
          border-radius: 11px;
          background: var(--metrics-card);
        }

        .metrics-main {
          width: min(100%, 1380px);
          margin: 0 auto;
          padding: clamp(24px, 4vw, 44px) clamp(18px, 3vw, 36px) 150px;
        }

        .metrics-heading {
          margin-bottom: 22px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
        }

        .metrics-eyebrow {
          display: block;
          margin-bottom: 7px;
          color: #13A8A2;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .metrics-heading h1 {
          margin: 0 0 7px;
          font-size: clamp(28px, 3vw, 36px);
          letter-spacing: -.8px;
        }

        .metrics-heading p {
          max-width: 680px;
          margin: 0;
          color: var(--metrics-muted);
          font-size: 13px;
        }

        .metrics-period {
          width: min(220px, 100%);
          flex: 0 0 auto;
        }

        .metrics-period label {
          display: block;
          margin-bottom: 6px;
          color: var(--metrics-muted);
          font-size: 11px;
          font-weight: 700;
        }

        .metrics-period select {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          color: var(--metrics-text);
          border: 1px solid var(--metrics-border);
          border-radius: 11px;
          outline: none;
          background: var(--metrics-card);
          font-size: 12px;
          font-weight: 600;
        }

        .metrics-tabs {
          margin-bottom: 24px;
          padding: 5px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 5px;
          border: 1px solid var(--metrics-border);
          border-radius: 14px;
          background: var(--metrics-card);
        }

        .metrics-tabs button {
          min-height: 44px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--metrics-muted);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          transition: color .2s ease, background-color .2s ease, box-shadow .2s ease;
        }

        .metrics-tabs button:hover { color: #13A8A2; }

        .metrics-tabs button[aria-selected='true'] {
          color: #FFFFFF;
          background: linear-gradient(90deg, #13A8A2, #1372A8);
          box-shadow: 0 5px 14px rgba(19, 168, 162, .22);
        }

        .metrics-panel { min-width: 0; }

        .metrics-panel__empty { grid-column: 1 / -1; }

        .metrics-summary {
          margin-bottom: 24px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: stretch;
          gap: 24px;
        }

        .metrics-card {
          min-width: 0;
          padding: clamp(19px, 2.4vw, 26px);
          border: 1px solid var(--metrics-border);
          border-radius: 18px;
          background: var(--metrics-card);
          box-shadow: 0 7px 20px rgba(15, 23, 42, .07);
        }

        .metrics-card--wide { grid-column: 1 / -1; }

        .metrics-card__heading { margin-bottom: 22px; }

        .metrics-card__heading h2 {
          margin: 0 0 4px;
          font-size: 16px;
        }

        .metrics-card__heading p {
          margin: 0;
          color: var(--metrics-muted);
          font-size: 11px;
          line-height: 1.45;
        }

        .metrics-summary-card__icon {
          width: 48px;
          height: 48px;
          margin-bottom: 15px;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          border-radius: 13px;
        }

        .metrics-summary-card__icon--teal { background: linear-gradient(135deg, #13A8A2, #1372A8); }
        .metrics-summary-card__icon--blue { background: linear-gradient(135deg, #1372A8, #3B82F6); }
        .metrics-summary-card__icon--orange { background: linear-gradient(135deg, #F59E0B, #F97316); }
        .metrics-summary-card__icon--green { background: linear-gradient(135deg, #10B981, #13A8A2); }

        .metrics-summary-card > strong {
          display: block;
          margin-bottom: 5px;
          font-size: 28px;
          line-height: 1.1;
        }

        .metrics-summary-card h2 {
          margin: 0 0 3px;
          font-size: 12px;
        }

        .metrics-summary-card p {
          margin: 0;
          color: var(--metrics-muted);
          font-size: 10px;
          line-height: 1.4;
        }

        .metrics-progress-list {
          display: flex;
          flex-direction: column;
          gap: 19px;
        }

        .metrics-progress__label {
          margin-bottom: 7px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          font-size: 11px;
        }

        .metrics-progress__label strong { font-size: 12px; }

        .metrics-progress__track,
        .metrics-query-item__track,
        .metrics-funnel__track {
          width: 100%;
          overflow: hidden;
          border-radius: 999px;
          background: var(--color-surface-muted);
        }

        .metrics-progress__track { height: 10px; }

        .metrics-progress__fill {
          height: 100%;
          display: block;
          border-radius: inherit;
        }

        .metrics-progress__fill--teal { background: linear-gradient(90deg, #13A8A2, #1372A8); }
        .metrics-progress__fill--blue { background: linear-gradient(90deg, #1372A8, #3B82F6); }
        .metrics-progress__fill--purple { background: linear-gradient(90deg, #8B5CF6, #EC4899); }
        .metrics-progress__fill--orange { background: linear-gradient(90deg, #F59E0B, #F97316); }

        .metrics-query-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .metrics-query-item {
          min-height: 58px;
          padding: 10px 12px;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--metrics-border);
          border-radius: 13px;
          background: color-mix(in srgb, var(--metrics-card) 94%, #13A8A2 6%);
        }

        .metrics-query-item__rank {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          border-radius: 10px;
          background: #13A8A2;
          font-size: 11px;
          font-weight: 800;
        }

        .metrics-query-item__rank--2 { background: #1372A8; }
        .metrics-query-item__rank--3 { background: #8B5CF6; }

        .metrics-query-item > div > strong,
        .metrics-query-item > strong { font-size: 11px; }

        .metrics-query-item__track {
          height: 5px;
          margin-top: 7px;
        }

        .metrics-query-item__track span {
          height: 100%;
          display: block;
          border-radius: inherit;
          background: linear-gradient(90deg, #13A8A2, #1372A8);
        }

        .metrics-funnel {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .metrics-funnel__meta {
          margin-bottom: 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          font-size: 11px;
        }

        .metrics-funnel__meta span {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .metrics-funnel__meta i {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          border-radius: 8px;
          background: #13A8A2;
          font-size: 9px;
          font-style: normal;
          font-weight: 800;
        }

        .metrics-funnel__track { height: 16px; }

        .metrics-funnel__track span {
          height: 100%;
          display: block;
          border-radius: inherit;
          background: linear-gradient(90deg, #13A8A2, #1372A8);
        }

        .metrics-lost-card {
          display: flex;
          flex-direction: column;
        }

        .metrics-lost-card__content {
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 15px;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(245, 158, 11, .13), rgba(249, 115, 22, .09));
        }

        .metrics-lost-card__content > span {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          border-radius: 14px;
          background: linear-gradient(135deg, #F59E0B, #F97316);
        }

        .metrics-lost-card__content strong {
          display: block;
          font-size: 28px;
        }

        .metrics-lost-card__content p,
        .metrics-lost-card__note { margin: 0; }

        .metrics-lost-card__content p {
          color: var(--metrics-muted);
          font-size: 11px;
        }

        .metrics-lost-card__note {
          margin-top: 16px;
          color: var(--metrics-muted);
          font-size: 11px;
          line-height: 1.55;
        }

        .metrics-peak-chart {
          min-height: 220px;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          gap: 18px;
        }

        .metrics-peak-chart__column {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
        }

        .metrics-peak-chart__column > strong { font-size: 12px; }

        .metrics-peak-chart__bar-wrap {
          height: 150px;
          display: flex;
          align-items: flex-end;
        }

        .metrics-peak-chart__bar-wrap span {
          width: clamp(34px, 6vw, 58px);
          max-height: 150px;
          display: block;
          border-radius: 12px 12px 3px 3px;
          background: linear-gradient(#13A8A2, #1372A8);
          box-shadow: 0 8px 18px rgba(19, 114, 168, .16);
        }

        .metrics-peak-chart small {
          color: var(--metrics-muted);
          font-size: 9px;
          text-align: center;
        }

        .metrics-leads {
          display: flex;
          flex-direction: column;
          gap: 10px;
          list-style: none;
        }

        .metrics-leads li {
          min-height: 72px;
          padding: 11px 12px;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr) auto;
          align-items: center;
          gap: 11px;
          border: 1px solid var(--metrics-border);
          border-radius: 14px;
          background: color-mix(in srgb, var(--metrics-card) 95%, #13A8A2 5%);
        }

        .metrics-leads__avatar {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          border-radius: 50%;
          background: linear-gradient(135deg, #13A8A2, #1372A8);
          font-size: 14px;
          font-weight: 800;
        }

        .metrics-leads li > div > strong { font-size: 11px; }

        .metrics-leads li p {
          margin: 3px 0 0;
          color: var(--metrics-muted);
          font-size: 9px;
          line-height: 1.4;
        }

        .metrics-leads__status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 7px;
        }

        .metrics-leads__status time {
          color: var(--metrics-muted);
          font-size: 9px;
        }

        .metrics-leads__badge {
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .metrics-leads__badge--new {
          color: #0F766E;
          background: #CCFBF1;
        }

        .metrics-leads__badge--pending {
          color: #B45309;
          background: #FEF3C7;
        }

        :root[data-theme='dark'] .metrics-leads__badge--new {
          color: #99F6E4;
          background: #134E4A;
        }

        :root[data-theme='dark'] .metrics-leads__badge--pending {
          color: #FDE68A;
          background: #78350F;
        }

        .metrics-state,
        .metrics-section-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--metrics-muted);
          text-align: center;
        }

        .metrics-state {
          min-height: 330px;
          padding: 36px 20px;
          border: 1px solid var(--metrics-border);
          border-radius: 18px;
          background: var(--metrics-card);
          box-shadow: 0 7px 20px rgba(15, 23, 42, .06);
        }

        .metrics-state > span {
          width: 92px;
          height: 92px;
          margin-bottom: 18px;
          display: grid;
          place-items: center;
          color: #13A8A2;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(19, 168, 162, .12), rgba(19, 114, 168, .12));
        }

        .metrics-state h2 {
          margin: 0 0 7px;
          color: var(--metrics-text);
          font-size: 18px;
        }

        .metrics-state p {
          max-width: 430px;
          margin: 0;
          font-size: 11px;
          line-height: 1.55;
        }

        .metrics-state button {
          min-height: 44px;
          margin-top: 18px;
          padding: 0 22px;
          color: #FFFFFF;
          border-radius: 11px;
          background: linear-gradient(90deg, #13A8A2, #1372A8);
          font-size: 11px;
          font-weight: 700;
        }

        .metrics-state--error > span {
          color: #EF4444;
          background: rgba(239, 68, 68, .1);
        }

        .metrics-section-empty {
          min-height: 220px;
          gap: 10px;
        }

        .metrics-section-empty p {
          margin: 0;
          font-size: 11px;
        }

        .metrics-loading {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .metrics-loading span {
          min-height: 170px;
          border: 1px solid var(--metrics-border);
          border-radius: 18px;
          background: linear-gradient(90deg, var(--metrics-card), var(--metrics-border), var(--metrics-card));
          background-size: 220% 100%;
          animation: metrics-skeleton 1.5s ease infinite;
        }

        .metrics-public-bot {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 25;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          color: var(--metrics-text);
        }

        .metrics-public-bot:disabled {
          opacity: .48;
          cursor: not-allowed;
        }

        .metrics-public-bot__label {
          min-height: 38px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--metrics-border);
          border-radius: 999px;
          background: var(--metrics-card);
          box-shadow: 0 8px 20px rgba(15, 23, 42, .16);
          font-size: 11px;
          font-weight: 700;
        }

        .metrics-public-bot__label i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #65E6A5;
        }

        .metrics-public-bot__avatar {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 2px solid #13A8A2;
          border-radius: 50%;
          background: var(--metrics-card);
          box-shadow: 0 8px 20px rgba(15, 23, 42, .16);
        }

        .metrics-public-bot__avatar img {
          width: 54px;
          height: 54px;
          object-fit: contain;
        }

        .metrics-tabs button:focus-visible,
        .metrics-period select:focus-visible,
        .metrics-header button:focus-visible,
        .metrics-public-bot:focus-visible,
        .metrics-state button:focus-visible {
          outline: 3px solid rgba(19, 168, 162, .3);
          outline-offset: 3px;
        }

        @keyframes metrics-skeleton {
          from { background-position: 100% 0; }
          to { background-position: -100% 0; }
        }

        @media (min-width: 1000px) {
          .metrics-page__content { margin-left: 280px; }
          .metrics-header { display: none; }
          .metrics-main { padding-top: 40px; }
        }

        @media (max-width: 1120px) {
          .metrics-summary,
          .metrics-loading { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 760px) {
          .metrics-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .metrics-period { width: 100%; }
          .metrics-grid { grid-template-columns: 1fr; }
          .metrics-card--wide { grid-column: auto; }
        }

        @media (max-width: 620px) {
          .metrics-header { min-height: 64px; }

          .metrics-main {
            padding-top: 24px;
            padding-right: 14px;
            padding-left: 14px;
          }

          .metrics-heading p { font-size: 11px; }

          .metrics-tabs {
            position: sticky;
            top: 64px;
            z-index: 8;
          }

          .metrics-tabs button {
            min-height: 42px;
            padding: 0 7px;
            gap: 5px;
            font-size: 10px;
          }

          .metrics-tabs button svg { width: 16px; }

          .metrics-summary,
          .metrics-loading { grid-template-columns: 1fr; }

          .metrics-summary-card {
            min-height: 112px;
            display: grid;
            grid-template-columns: 48px 1fr;
            grid-template-rows: auto auto auto;
            column-gap: 14px;
            align-items: center;
          }

          .metrics-summary-card__icon {
            grid-row: 1 / 4;
            margin: 0;
          }

          .metrics-summary-card > strong { font-size: 24px; }
          .metrics-card { padding: 17px; }

          .metrics-funnel__meta span {
            align-items: flex-start;
            line-height: 1.35;
          }

          .metrics-peak-chart { gap: 8px; }

          .metrics-peak-chart__bar-wrap span {
            width: clamp(28px, 11vw, 44px);
          }

          .metrics-leads li {
            grid-template-columns: 36px minmax(0, 1fr);
          }

          .metrics-leads__avatar {
            width: 36px;
            height: 36px;
          }

          .metrics-leads__status {
            grid-column: 2;
            align-items: flex-start;
            flex-direction: row;
          }

          .metrics-public-bot {
            right: 14px;
            bottom: 14px;
          }
        }

        @media (max-width: 360px) {
          .metrics-tabs button {
            flex-direction: column;
            gap: 2px;
            font-size: 9px;
          }

          .metrics-query-item {
            grid-template-columns: 30px minmax(0, 1fr) auto;
            gap: 8px;
          }

          .metrics-query-item__rank {
            width: 30px;
            height: 30px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .metrics-page *,
          .metrics-page *::before,
          .metrics-page *::after {
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
            animation-duration: .01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
