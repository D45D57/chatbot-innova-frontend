import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConsultaCard } from '../components/consultas/ConsultaCard'
import { ConsultaDetail } from '../components/consultas/ConsultaDetail'
import { Drawer } from '../components/layout/Drawer'
import { AppIcon } from '../components/ui/AppIcon'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { brand } from '../styles/brand'
import {
  useConsultas,
  type ConsultaCanalFilter,
  type ConsultaEstadoFilter,
  type ConsultaSortOption,
} from '../hooks/useConsultas'

const ESTADO_OPTIONS: Array<{ value: ConsultaEstadoFilter; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'nueva', label: 'Nuevas' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'cerrada', label: 'Cerradas' },
]

const CANAL_OPTIONS: Array<{ value: ConsultaCanalFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'web', label: 'Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

const SORT_OPTIONS: Array<{ value: ConsultaSortOption; label: string }> = [
  { value: 'recentes', label: 'Más recientes' },
  { value: 'antiguas', label: 'Más antiguas' },
]

const fieldStyle: CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  fontSize: 12,
  fontFamily: 'var(--font-family)',
  outline: 'none',
}

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

export function ConsultasPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [demoStarted, setDemoStarted] = useState(false)
  const {
    consultas,
    filteredConsultas,
    selectedConsulta,
    selectedConsultaId,
    estadoFilter,
    canalFilter,
    sortOption,
    searchQuery,
    isLoading,
    isShowingDemo,
    setEstadoFilter,
    setCanalFilter,
    setSortOption,
    setSearchQuery,
    selectConsulta,
    clearSelection,
    updateConsultaStatus,
  } = useConsultas(user?.id)

  useEffect(() => {
    if (user) loadBusiness(user.id)
  }, [loadBusiness, user])

  if (!user) return null

  const showingDetail = Boolean(selectedConsultaId && selectedConsulta)
  const showingDemoIntro = isLoading || (isShowingDemo && !demoStarted)

  const handleBack = () => {
    if (showingDetail) {
      clearSelection()
      return
    }

    if (isShowingDemo && demoStarted) {
      setDemoStarted(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <>
      <Drawer
        business={business}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="consultas"
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100svh',
        background: 'var(--color-bg)',
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          padding: '13px 20px 7px',
          background: 'var(--color-bg)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <button
            type="button"
            aria-label="Abrir navegación"
            onClick={() => setDrawerOpen(true)}
            style={{ color: 'var(--color-text-primary)', padding: 4 }}
          >
            <AppIcon name="menu" size={20} />
          </button>
          <span aria-hidden="true" style={{ marginLeft: 'auto', marginRight: 14 }}>
            <AppIcon name="bell" size={19} strokeWidth={1.8} />
          </span>
          <Avatar name={user.nombre} size={30} />
        </header>

        <main style={{
          flex: 1,
          padding: '18px 20px 24px',
          overflowY: 'auto',
          background: showingDemoIntro ? 'var(--color-bg-subtle)' : 'var(--color-bg)',
        }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: showingDetail ? 22 : 12,
              padding: 0,
              color: 'var(--color-text-primary)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 20,
                height: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'var(--color-surface-muted)',
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              {'<'}
            </span>
            Volver
          </button>

          {!showingDetail && (
            <div style={{ marginBottom: 14 }}>
              <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 3 }}>Consultas</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 11, lineHeight: 1.4 }}>
                Historial de conversaciones e interacciones recibidas.
              </p>
            </div>
          )}

          {!showingDetail && !showingDemoIntro && (
            <section
              aria-label="Filtros de consultas"
              style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15 }}
            >
              <label>
                <span className="sr-only">Buscar</span>
                <span style={{ position: 'relative', display: 'block' }}>
                  <span aria-hidden="true" style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-4-4" />
                    </svg>
                  </span>
                  <input
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    placeholder="Buscar cliente o mensaje..."
                    style={{ ...fieldStyle, paddingLeft: 37, boxShadow: 'var(--shadow-sm)' }}
                  />
                </span>
              </label>

              {[
                { label: 'Estado', value: estadoFilter, onChange: setEstadoFilter, options: ESTADO_OPTIONS },
                { label: 'Canal', value: canalFilter, onChange: setCanalFilter, options: CANAL_OPTIONS },
                { label: 'Orden', value: sortOption, onChange: setSortOption, options: SORT_OPTIONS },
              ].map(field => (
                <label key={field.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={labelStyle}>{field.label}</span>
                  <select
                    value={field.value}
                    onChange={event => field.onChange(event.target.value as never)}
                    style={fieldStyle}
                  >
                    {field.options.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              ))}
            </section>
          )}

          {!showingDetail && isShowingDemo && !isLoading && !showingDemoIntro && (
            <aside
              aria-label="Consultas de ejemplo"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 11,
                padding: '12px 14px',
                marginBottom: 15,
                border: '1px solid var(--color-demo-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-demo-bg)',
                color: 'var(--color-secondary)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span aria-hidden="true" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 9,
                background: 'var(--color-primary)',
                color: '#FFFFFF',
              }}>
                <AppIcon name="faq" size={16} strokeWidth={2} />
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Estas son consultas de ejemplo
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11, lineHeight: 1.45 }}>
                  Podés explorarlas para conocer cómo funciona esta sección. Cuando recibas tu primera consulta real, estos ejemplos desaparecerán automáticamente.
                </p>
              </div>
            </aside>
          )}

          {showingDemoIntro ? (
            <section style={{
              padding: '48px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              textAlign: 'center',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <span aria-hidden="true" style={{
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                background: 'rgba(19, 168, 162, 0.11)',
                color: 'var(--color-primary)',
              }}>
                <AppIcon name="chat" size={38} strokeWidth={1.8} />
              </span>

              <h2 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.35, margin: 0, padding: 10, maxWidth: 280 }}>
                Todavía no recibiste consultas
              </h2>

              <p style={{
                maxWidth: 260,
                margin: 0,
                padding: 8,
                color: 'var(--color-text-secondary)',
                fontSize: 14,
                lineHeight: 1.5,
                textAlign: 'center',
              }}>
                Cuando un cliente inicie una conversación desde el chatbot, la consulta aparecerá aquí automáticamente.
              </p>

              <button
                type="button"
                onClick={() => setDemoStarted(true)}
                style={{
                  margin: 12,
                  padding: '14px 40px',
                  borderRadius: 'var(--radius-md)',
                  background: brand.primaryGradient,
                  color: '#FFFFFF',
                  boxShadow: brand.shadowAction,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                COMENZAR
              </button>
            </section>
          ) : isLoading ? (
            <section style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              Cargando consultas...
            </section>
          ) : consultas.length === 0 ? (
            <section style={{
              padding: '32px 20px',
              textAlign: 'center',
              background: 'var(--color-bg)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <AppIcon name="chat" size={34} />
              <h2 style={{ fontSize: 17, margin: '10px 0 6px' }}>Todavía no hay consultas</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                Cuando lleguen conversaciones del chat, van a aparecer acá.
              </p>
            </section>
          ) : showingDetail ? (
            <ConsultaDetail
              consulta={selectedConsulta}
              onUpdateStatus={updateConsultaStatus}
            />
          ) : (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredConsultas.length === 0 ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  fontSize: 13,
                  borderRadius: 'var(--radius-md)',
                }}>
                  No hay consultas que coincidan con estos filtros.
                </div>
              ) : filteredConsultas.map(consulta => (
                <ConsultaCard
                  key={consulta.id}
                  consulta={consulta}
                  selected={selectedConsultaId === consulta.id}
                  onSelect={selectConsulta}
                />
              ))}
            </section>
          )}
        </main>
      </div>
    </>
  )
}
