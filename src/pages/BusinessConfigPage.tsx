import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Drawer } from '../components/layout/Drawer'
import { Avatar } from '../components/ui/Avatar'
import { AppIcon } from '../components/ui/AppIcon'
import { apiRequest } from '../services/apiClient'
import { brand } from '../styles/brand'
import { Switch } from '../components/ui/Switch'
import { useTheme } from '../hooks/useTheme'

interface RubroApi {
  id: string
  nombre: string
}

interface RubrosResponse {
  success: boolean
  rubros: RubroApi[]
}

interface BotConfigResponse {
  success: boolean
  configuracion: {
    nombreNegocio: string
    mensajeBienvenida: string
    rubroId?: string
  }
}

interface FormData {
  nombre: string
  rubroId: string
  descripcion: string
  horario: string
  telefono: string
  mensajeBienvenida: string
  respuestaDerivacion: string
  logo: string
}

const INITIAL: FormData = {
  nombre: '',
  rubroId: '',
  descripcion: '',
  horario: '',
  telefono: '',
  mensajeBienvenida: '',
  respuestaDerivacion: '',
  logo: '',
}

const textareaStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: '15px',
  fontFamily: 'var(--font-family)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg)',
  resize: 'vertical',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const selectStyle: React.CSSProperties = {
  height: '52px',
  padding: '0 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: '15px',
  fontFamily: 'var(--font-family)',
  background: 'var(--color-bg)',
  outline: 'none',
  width: '100%',
  cursor: 'pointer',
}

export function BusinessConfigPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { saveBusiness, business, updateBusiness } = useBusiness()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isDark, setTheme } = useTheme()

  const isEdit = !!business

  const [form, setForm] = useState<FormData>(
    business
      ? {
          nombre: business.nombre,
          rubroId: '',
          descripcion: business.descripcion,
          horario: business.horario,
          telefono: business.telefono,
          mensajeBienvenida: business.mensajeBienvenida,
          respuestaDerivacion: business.respuestaDerivacion,
          logo: business.logo ?? '',
        }
      : INITIAL
  )
  const [rubros, setRubros] = useState<RubroApi[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const publicUrl = business?.slug ? `${window.location.origin}/${business.slug}` : ''

  // Cargar rubros desde el backend (no requiere auth)
  useEffect(() => {
    apiRequest<RubrosResponse>('/bot/rubros', { auth: false }).then(data => {
      setRubros(data.rubros)
    }).catch(() => {})
  }, [])

  // Cargar config desde el backend al entrar en modo edición
  useEffect(() => {
    if (!isEdit) return
    apiRequest<BotConfigResponse>('/bot').then(data => {
      setForm(prev => ({
        ...prev,
        nombre: data.configuracion.nombreNegocio || prev.nombre,
        mensajeBienvenida: data.configuracion.mensajeBienvenida || prev.mensajeBienvenida,
        rubroId: data.configuracion.rubroId || prev.rubroId,
      }))
    }).catch(() => {})
  }, [isEdit])

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(prev => ({ ...prev, logo: ev.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (isEdit) {
      if (!form.nombre || !form.descripcion || !form.telefono || !form.horario) {
        setError('Todos los campos marcados con * son obligatorios.')
        return
      }
    } else {
      if (!form.nombre) {
        setError('El nombre del negocio es obligatorio.')
        return
      }
    }

    if (!user) return
    setLoading(true)

    try {
      await apiRequest('/bot', {
        method: 'PUT',
        body: JSON.stringify({
          nombreNegocio: form.nombre,
          mensajeBienvenida: form.mensajeBienvenida || undefined,
          rubroId: form.rubroId || undefined,
        }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar en el servidor.')
      setLoading(false)
      return
    }

    if (isEdit) {
      updateBusiness(form)
    } else {
      saveBusiness({ ...form, userId: user.id, rubro: user.rubro ?? '' })
    }

    setLoading(false)
    setShowSuccessModal(true)
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100svh',
      background: 'var(--color-bg)',
    }}>

      {/* Modal negocio creado */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '75%', maxWidth: 360,
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 24px 28px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '12px', position: 'relative', textAlign: 'center',
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                position: 'absolute', top: 12, right: 14,
                background: 'none', border: 'none',
                fontSize: '18px', cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >✕</button>

            <img src="/negocioCreado.jpeg" alt="Negocio creado" style={{ width: '80%', maxWidth: 200 }} />

            <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
              ¡Todo listo!
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Tu negocio y tu asistente virtual fueron configurados correctamente.
            </p>
            <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
              Ahora ya podés comenzar a{' '}
              <strong style={{ color: 'var(--color-primary)' }}>disfrutar de EmprendeBot.</strong>
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                marginTop: '8px', width: '100%', height: 52,
                background: brand.primaryGradient,
                color: '#fff', border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-family)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              IR AL PANEL →
            </button>
          </div>
        </div>
      )}

      {/* Header — distinto según modo */}
      {isEdit ? (
        <>
          <Drawer
            business={business}
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            activeItem="configurar"
          />
          <header style={{
            height: 56, padding: '12px 20px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--color-bg)',
          }}>
            <button
              type="button"
              aria-label="Abrir navegación"
              onClick={() => setDrawerOpen(true)}
              style={{
                width: 32, height: 32,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: brand.text, background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <AppIcon name="menu" size={21} strokeWidth={2.2} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span aria-hidden="true" style={{ color: brand.text, lineHeight: 1, display: 'inline-flex' }}>
                <AppIcon name="bell" size={21} />
              </span>
              {user && <Avatar name={user.nombre} size={32} bgColor={brand.primaryGradient} />}
            </div>
          </header>
        </>
      ) : (
        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Crear cuenta</span>
        </div>
      )}

      <div style={{ flex: 1, padding: '0 24px 40px', overflowY: 'auto' }}>

        {/* Título y subtítulo según modo */}
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
          {isEdit ? 'Configuración' : 'Configura tu negocio'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
          {isEdit
            ? 'Configura la información de tu negocio y personalizá tu chatbot.'
            : 'Solo una vez. Luego podrás editar estos datos y personalizar tu negocio desde Configuración.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Logo — solo en modo edición */}
          {isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>Logo o imagen del negocio</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    border: '2px dashed var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                    background: 'var(--color-bg-subtle)',
                  }}
                >
                  {form.logo
                    ? <img src={form.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '28px' }}>🏪</span>
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      fontSize: '13px', fontWeight: 600,
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-primary)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-family)',
                      padding: '6px 14px',
                    }}
                  >
                    {form.logo ? 'Cambiar imagen' : 'Subir imagen'}
                  </button>
                  {form.logo && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, logo: '' }))}
                      style={{
                        fontSize: '12px', color: 'var(--color-error)',
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-family)', padding: 0, textAlign: 'left',
                      }}
                    >Eliminar</button>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    JPG, PNG o SVG · máx. 2 MB
                  </span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Nombre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Nombre del negocio *</label>
            <Input
              placeholder="Ej: Bella Luna"
              value={form.nombre}
              onChange={set('nombre')}
            />
          </div>

          {/* Rubro */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Rubro de tu negocio</label>
            <select
              value={form.rubroId}
              onChange={e => setForm(prev => ({ ...prev, rubroId: e.target.value }))}
              style={{
                ...selectStyle,
                color: form.rubroId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              }}
            >
              <option value="">Seleccioná</option>
              {rubros.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Descripción breve{isEdit ? ' *' : ''}</label>
            <textarea
              value={form.descripcion}
              onChange={set('descripcion')}
              placeholder="Ej: Peluquería unisex especializada en cortes modernos, coloración y tratamientos capilares."
              rows={3}
              style={textareaStyle}
            />
          </div>

          {/* Horario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Horario de atención{isEdit ? ' *' : ''}</label>
            <Input
              placeholder="Ej: Lun a Sáb de 9:00 a 20:00 hs"
              value={form.horario}
              onChange={set('horario')}
            />
          </div>

          {/* Teléfono */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Teléfono de contacto{isEdit ? ' *' : ''}</label>
            <Input
              type="tel"
              placeholder="Ej: +54 9 11 5555-1234"
              value={form.telefono}
              onChange={set('telefono')}
            />
          </div>

          {/* Mensaje de bienvenida */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={labelStyle}>Mensaje de bienvenida del chatbot</label>
              <button
                type="button"
                disabled={!form.nombre}
                title={!form.nombre ? 'Primero completá el nombre del negocio' : undefined}
                onClick={() =>
                  setForm(prev => ({
                    ...prev,
                    mensajeBienvenida: `¡Hola! Soy el asistente de ${prev.nombre} ¿En qué te puedo ayudar? Elige una opción para continuar.`,
                  }))
                }
                style={{
                  fontSize: '11px',
                  color: !form.nombre ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                  border: 'none', background: 'none',
                  cursor: !form.nombre ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family)',
                  padding: '2px 0', fontWeight: 600,
                  opacity: !form.nombre ? 0.5 : 1,
                }}
              >
                Usar ejemplo ↗
              </button>
            </div>
            <textarea
              value={form.mensajeBienvenida}
              onChange={set('mensajeBienvenida')}
              placeholder={`Ej: ¡Hola! Soy el asistente de ${form.nombre || 'tu negocio'} ¿En qué te puedo ayudar?`}
              rows={3}
              style={textareaStyle}
            />
          </div>

          {/* Apariencia — solo en modo edición (placeholder) */}
          {isEdit && (
            <div style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: brand.primaryGradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '18px' }}>✨</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Apariencia</span>
              </div>

              {/* Selector de tema */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px',
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>Modo oscuro</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Reduce el brillo y adapta los colores de la aplicación
                  </p>
                </div>
                <Switch
                  checked={isDark}
                  label={isDark ? 'Activado' : 'Desactivado'}
                  onChange={checked => setTheme(checked ? 'dark' : 'light')}
                  style={{ flexDirection: 'row-reverse', gap: 8 }}
                />
              </div>
            </div>
          )}

          {/* Enlace público — solo en modo edición */}
          {isEdit && (
            <div style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-demo-bg)',
              border: '1px solid var(--color-demo-border)',
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Enlace público del chatbot
              </p>

              {/* URL */}
              <div style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                wordBreak: 'break-all',
              }}>
                {publicUrl}
              </div>

              {/* Botón copiar */}
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: linkCopied ? '#22c55e' : brand.primaryGradient,
                  color: '#fff',
                  fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-family)',
                  transition: 'background 0.2s',
                }}
              >
                {linkCopied ? '¡Copiado! ✓' : 'Copiar enlace'}
              </button>

              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Comparte este enlace con tus clientes para que puedan chatear con tu asistente virtual.
              </p>
            </div>
          )}

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--color-error)' }}>{error}</p>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none' }}
          >
            {isEdit ? 'GUARDAR CAMBIOS' : 'CREAR NEGOCIO'}
          </Button>
        </form>
      </div>
    </div>
  )
}
