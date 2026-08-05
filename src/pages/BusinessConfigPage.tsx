import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Drawer } from '../components/layout/Drawer'
import { PageBackButton } from '../components/navigation/PageBackButton'
import { Avatar } from '../components/ui/Avatar'
import { AppIcon } from '../components/ui/AppIcon'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog'
import { AuthLayout } from '../components/auth/AuthLayout'
import { apiRequest, getUserFacingErrorMessage, UserFacingError } from '../services/apiClient'
import { brand } from '../styles/brand'
import { Switch } from '../components/ui/Switch'
import { useTheme } from '../hooks/useTheme'
import { DEFAULT_CHAT_APPEARANCE, isValidHexColor } from '../services/chatAppearance'
import { getPublicChatUrl, openChatPreview } from '../utils/chatRoutes'
import { getDefaultWelcomeMessage, syncDefaultWelcomeMessage } from '../utils/welcomeMessage'

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
    nombreNegocio?: string | null
    mensajeBienvenida?: string | null
    rubroId?: string | null
    descripcionBreve?: string | null
    horarioAtencion?: string | null
    telefono?: string | null
    respuestaDerivacion?: string | null
    logoUrl?: string | null
    slug?: string | null
    slugPersonalizado: boolean
    colorPrimario?: string | null
    colorSecundario?: string | null
  }
}

interface UpdateSlugResponse {
  success: boolean
  slug: string
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
  slug: string
  colorPrimario: string
  colorSecundario: string
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
  slug: '',
  colorPrimario: DEFAULT_CHAT_APPEARANCE.primary,
  colorSecundario: DEFAULT_CHAT_APPEARANCE.secondary,
}

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024
const LOGO_UPLOAD_TIMEOUT_MS = 30_000
const VALID_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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
  const { business, loadBusiness, updateBusiness } = useBusiness()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isDark, setTheme } = useTheme()

  const [businessExists, setBusinessExists] = useState<boolean | null>(
    business ? Boolean(business.nombre) : null
  )
  const isEdit = businessExists === true

  const [form, setForm] = useState<FormData>(
    business
      ? {
          nombre: business.nombre,
          rubroId: business.rubroId ?? '',
          descripcion: business.descripcion,
          horario: business.horario,
          telefono: business.telefono,
          mensajeBienvenida: business.mensajeBienvenida,
          respuestaDerivacion: business.respuestaDerivacion,
          logo: business.logo ?? '',
          slug: business.slug,
          colorPrimario: business.colorPrimario ?? DEFAULT_CHAT_APPEARANCE.primary,
          colorSecundario: business.colorSecundario ?? DEFAULT_CHAT_APPEARANCE.secondary,
        }
      : INITIAL
  )
  const [rubros, setRubros] = useState<RubroApi[]>([])
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const [logoValidationError, setLogoValidationError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [slugPersonalizado, setSlugPersonalizado] = useState<boolean | null>(null)
  const [slugOriginal, setSlugOriginal] = useState(business?.slug ?? '')
  const [persistedLogo, setPersistedLogo] = useState(business?.logo ?? '')
  const [showSlugConfirmation, setShowSlugConfirmation] = useState(false)
  const pendingSubmitFormRef = useRef<HTMLFormElement | null>(null)
  const slugConfirmationAcceptedRef = useRef(false)

  const publicUrl = form.slug ? getPublicChatUrl(form.slug, window.location.origin) : ''

  // Resolver el modo antes de renderizar para evitar mostrar fugazmente
  // la creación de negocio mientras se carga una configuración existente.
  useEffect(() => {
    if (!user) return

    let active = true
    void loadBusiness(user.id).then(loadedBusiness => {
      if (active) setBusinessExists(Boolean(loadedBusiness?.nombre))
    })

    return () => {
      active = false
    }
  }, [user, loadBusiness])

  // Cargar rubros desde el backend (no requiere auth)
  useEffect(() => {
    apiRequest<RubrosResponse>('/bot/rubros', { auth: false }).then(data => {
      setRubros(data.rubros)
    }).catch(err => {
      setError(getUserFacingErrorMessage(err, { fallback: 'No pudimos cargar los rubros. Intentá nuevamente.' }))
    })
  }, [])

  // Cargar config desde el backend al entrar en modo edición
  useEffect(() => {
    if (!user) return
    apiRequest<BotConfigResponse>('/bot').then(data => {
      setForm(prev => ({
        ...prev,
        nombre: data.configuracion.nombreNegocio ?? '',
        mensajeBienvenida: data.configuracion.mensajeBienvenida || prev.mensajeBienvenida,
        rubroId: data.configuracion.rubroId ?? '',
        descripcion: data.configuracion.descripcionBreve ?? '',
        horario: data.configuracion.horarioAtencion ?? '',
        telefono: data.configuracion.telefono ?? '',
        respuestaDerivacion: data.configuracion.respuestaDerivacion ?? '',
        logo: data.configuracion.logoUrl ?? '',
        slug: data.configuracion.slug ?? '',
        colorPrimario: data.configuracion.colorPrimario ?? prev.colorPrimario,
        colorSecundario: data.configuracion.colorSecundario ?? prev.colorSecundario,
      }))
      setSlugOriginal(data.configuracion.slug ?? '')
      setSlugPersonalizado(data.configuracion.slugPersonalizado)
      setPersistedLogo(data.configuracion.logoUrl ?? '')
    }).catch(err => {
      setError(getUserFacingErrorMessage(err, { fallback: 'No pudimos cargar la configuración. Intentá nuevamente.' }))
    })
  }, [user])

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setForm(prev => {
        if (field !== 'nombre') return { ...prev, [field]: value }

        return {
          ...prev,
          nombre: value,
          mensajeBienvenida: syncDefaultWelcomeMessage(
            prev.mensajeBienvenida,
            prev.nombre,
            value,
          ),
        }
      })
    }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setLogoValidationError('')

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setSelectedLogo(null)
      setForm(prev => ({ ...prev, logo: persistedLogo }))
      e.target.value = ''
      setLoading(false)
      setLogoValidationError('La imagen no puede superar los 2 MB.')
      setError('La imagen no puede superar los 2 MB.')
      return
    }

    if (!VALID_LOGO_TYPES.has(file.type)) {
      setSelectedLogo(null)
      setForm(prev => ({ ...prev, logo: persistedLogo }))
      e.target.value = ''
      setLoading(false)
      setLogoValidationError('El formato de la imagen debe ser JPG, PNG o WEBP.')
      setError('El formato de la imagen debe ser JPG, PNG o WEBP.')
      return
    }

    setSelectedLogo(file)
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(prev => ({ ...prev, logo: ev.target?.result as string }))
    }
    reader.onerror = () => {
      setSelectedLogo(null)
      setForm(prev => ({ ...prev, logo: persistedLogo }))
      if (fileInputRef.current) fileInputRef.current.value = ''
      setLoading(false)
      setLogoValidationError('No se pudo leer la imagen seleccionada.')
      setError('No se pudo leer la imagen seleccionada.')
    }

    try {
      reader.readAsDataURL(file)
    } catch {
      setSelectedLogo(null)
      setForm(prev => ({ ...prev, logo: persistedLogo }))
      e.target.value = ''
      setLoading(false)
      setLogoValidationError('No se pudo leer la imagen seleccionada.')
      setError('No se pudo leer la imagen seleccionada.')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

    if (!isValidHexColor(form.colorPrimario) || !isValidHexColor(form.colorSecundario)) {
      setError('Los colores deben tener formato hexadecimal, por ejemplo #13A8A2.')
      return
    }

    if (logoValidationError) {
      setLoading(false)
      setError(logoValidationError)
      return
    }

    if (selectedLogo && selectedLogo.size > MAX_LOGO_SIZE_BYTES) {
      setSelectedLogo(null)
      setForm(prev => ({ ...prev, logo: persistedLogo }))
      if (fileInputRef.current) fileInputRef.current.value = ''
      setLoading(false)
      setLogoValidationError('La imagen no puede superar los 2 MB.')
      setError('La imagen no puede superar los 2 MB.')
      return
    }

    const slugCambio = isEdit && Boolean(slugOriginal) && form.slug.trim() !== slugOriginal
    if (slugCambio && slugPersonalizado) {
      setError('El enlace público ya fue personalizado y no puede volver a modificarse.')
      return
    }
    if (slugCambio && !slugConfirmationAcceptedRef.current) {
      pendingSubmitFormRef.current = e.currentTarget
      setShowSlugConfirmation(true)
      return
    }
    slugConfirmationAcceptedRef.current = false

    setLoading(true)

    try {
      await apiRequest<BotConfigResponse>('/bot', {
        method: 'PUT',
        body: JSON.stringify({
          activo: true,
          nombreNegocio: form.nombre,
          mensajeBienvenida: form.mensajeBienvenida || undefined,
          rubroId: form.rubroId || undefined,
          descripcionBreve: form.descripcion || undefined,
          horarioAtencion: form.horario || undefined,
          telefono: form.telefono || undefined,
          respuestaDerivacion: form.respuestaDerivacion || undefined,
          logoUrl: selectedLogo ? undefined : form.logo,
          colorPrimario: form.colorPrimario.toUpperCase(),
          colorSecundario: form.colorSecundario.toUpperCase(),
        }),
      })

      if (slugCambio) {
        const slugActualizado = await apiRequest<UpdateSlugResponse>('/bot/slug', {
          method: 'PATCH',
          body: JSON.stringify({ slug: form.slug }),
        })
        setForm(prev => ({ ...prev, slug: slugActualizado.slug }))
        setSlugOriginal(slugActualizado.slug)
        setSlugPersonalizado(true)
      }

      if (selectedLogo) {
        const logoData = new FormData()
        logoData.append('imagenLogo', selectedLogo)
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), LOGO_UPLOAD_TIMEOUT_MS)

        try {
          await apiRequest('/bot/config', {
            method: 'PATCH',
            body: logoData,
            signal: controller.signal,
          })
        } catch (uploadError) {
          if (controller.signal.aborted) {
            void uploadError
            throw new UserFacingError('La carga de la imagen tardó demasiado. Intentá nuevamente.')
          }
          throw uploadError
        } finally {
          window.clearTimeout(timeoutId)
        }
      }

      const confirmedResponse = await apiRequest<BotConfigResponse>('/bot')
      const confirmedConfig = confirmedResponse.configuracion
      const syncedBusiness = await loadBusiness(user.id)
      if (!syncedBusiness) {
        throw new UserFacingError('Guardamos los cambios, pero no pudimos actualizar la información en pantalla. Volvé a intentarlo.')
      }
      const confirmedPrimary = confirmedConfig.colorPrimario ?? DEFAULT_CHAT_APPEARANCE.primary
      const confirmedSecondary = confirmedConfig.colorSecundario ?? DEFAULT_CHAT_APPEARANCE.secondary
      updateBusiness({
        colorPrimario: confirmedPrimary,
        colorSecundario: confirmedSecondary,
      })
      const savedLogo = confirmedConfig.logoUrl ?? ''
      const savedSlug = confirmedConfig.slug ?? syncedBusiness.slug
      setPersistedLogo(savedLogo)
      setForm(prev => ({
        ...prev,
        logo: savedLogo,
        slug: savedSlug,
        colorPrimario: confirmedPrimary,
        colorSecundario: confirmedSecondary,
      }))
      setSlugOriginal(savedSlug)

      setSelectedLogo(null)
      setLogoValidationError('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowSlugConfirmation(false)
      pendingSubmitFormRef.current = null
      setShowSuccessModal(true)
    } catch (err) {
      setError(getUserFacingErrorMessage(err, { fallback: 'No pudimos guardar la configuración. Intentá nuevamente.' }))
    } finally {
      setLoading(false)
    }
  }

  if (businessExists === null) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-text-secondary)',
          background: 'var(--color-bg)',
          fontFamily: 'var(--font-family)',
          fontSize: '14px',
        }}
      >
        Cargando configuración…
      </div>
    )
  }

  // ── SETUP MODE (primer ingreso: sin nombre de negocio) ─────────────────────
  if (!isEdit) {
    return (
      <AuthLayout
        title="Configura tu negocio"
        subtitle="Solo una vez. Luego podrás editar estos datos y personalizar tu negocio desde Configuración."
        onBack={() => navigate(-1)}
        illustrationSrc="/bot-negocio.png"
        illustrationAlt="Asistente virtual de EmprendeBot"
        compact
      >
        {showSuccessModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '88%', maxWidth: 360,
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 24px 28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '12px', textAlign: 'center',
            }}>
              <img src="/negocioCreado.jpeg" alt="Negocio creado" style={{ width: '80%', maxWidth: 200 }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.3, margin: 0 }}>¡Todo listo!</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Tu negocio y tu asistente virtual fueron configurados correctamente.
              </p>
              <button
                onClick={() => navigate('/dashboard', { replace: true })}
                style={{
                  marginTop: '8px', width: '100%', height: 52,
                  background: brand.primaryGradient,
                  color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-family)',
                }}
              >
                IR AL PANEL →
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Nombre del negocio *</label>
            <Input placeholder="Ej: Bella Luna" value={form.nombre} onChange={set('nombre')} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Rubro del negocio</label>
            <select
              value={form.rubroId}
              onChange={e => setForm(prev => ({ ...prev, rubroId: e.target.value }))}
              style={{ ...selectStyle, color: form.rubroId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
            >
              <option value="">Selecciona</option>
              {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Descripción breve</label>
            <textarea
              value={form.descripcion}
              onChange={set('descripcion')}
              placeholder="Ej: Peluquería unisex especializada en cortes modernos, coloración y tratamientos capilares."
              rows={3}
              style={textareaStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Horario de atención</label>
            <Input placeholder="Ej: Lun a Sáb de 9:00 a 20:00 hs" value={form.horario} onChange={set('horario')} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Teléfono</label>
            <Input type="tel" placeholder="Ej: +54 9 11 5555-1234" value={form.telefono} onChange={set('telefono')} />
          </div>

          {error && <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>{error}</p>}

          <Button
            type="submit"
            fullWidth
            size="lg"
        loading={loading}
            style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none', marginTop: '4px' }}
          >
            Crear negocio
          </Button>
        </form>
      </AuthLayout>
    )
  }

  // ── EDIT MODE ───────────────────────────────────────────────────────────────
  return (
    <div className={`business-config-page${isEdit ? ' business-config-page--editing' : ''}`} style={{
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

      <ConfirmationDialog
        open={showSlugConfirmation}
        title="¿Confirmar enlace público?"
        description="Este enlace no podrá volver a modificarse."
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        loading={loading}
        onOpenChange={open => {
          setShowSlugConfirmation(open)
          if (!open) pendingSubmitFormRef.current = null
        }}
        onConfirm={() => {
          slugConfirmationAcceptedRef.current = true
          pendingSubmitFormRef.current?.requestSubmit()
        }}
      />

      {/* Header — distinto según modo */}
      {isEdit ? (
        <>
          <Drawer
            business={business}
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            activeItem="configuracion"
            desktopPersistent
            showBusinessAvatar
          />
          <header className="business-config-page__header" style={{
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
            <strong className="business-config-page__header-title">Configuración</strong>
            {user && <Avatar name={user.nombre} src={business?.logo} size={38} />}
          </header>
        </>
      ) : (
        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Crear cuenta</span>
        </div>
      )}

      <div className="business-config-page__content" style={{ flex: 1, padding: '0 24px 40px', overflowY: 'auto' }}>
        {isEdit && <PageBackButton onClick={() => navigate('/dashboard')} />}

        {/* Título y subtítulo según modo */}
        {isEdit && <span className="business-config__eyebrow">PERSONALIZACIÓN</span>}
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
          {isEdit ? 'Configuración' : 'Configura tu negocio'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
          {isEdit
            ? 'Configura la información de tu negocio y personalizá tu chatbot.'
            : 'Solo una vez. Luego podrás editar estos datos y personalizar tu negocio desde Configuración.'}
        </p>

        <form className="business-config__form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="business-config__data-card">
            <div className="business-config__section-heading">
              <span className="business-config__section-icon" aria-hidden="true">
                <AppIcon name="business" size={20} />
              </span>
              <div>
                <h2>Datos del negocio</h2>
                <p>Información visible para tus clientes y tu asistente.</p>
              </div>
            </div>

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

          {/* Logo — amplio como en la referencia de EmprendeBot */}
          {isEdit && (
            <div className="business-config__logo-field">
              <label style={labelStyle}>Logo del negocio</label>
              <button
                type="button"
                className={`business-config__logo-upload${form.logo ? ' business-config__logo-upload--filled' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {form.logo ? (
                  <>
                    <img src={form.logo} alt={`Logo de ${form.nombre || 'tu negocio'}`} />
                    <span>Cambiar logo</span>
                  </>
                ) : (
                  <>
                    <span className="business-config__logo-placeholder" aria-hidden="true">
                      <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <circle cx="9" cy="10" r="2" />
                        <path d="m21 15-4.5-4.5L7 20" />
                      </svg>
                    </span>
                    <strong>Subir logo</strong>
                    <small>PNG, JPG o WEBP · Máx. 2 MB</small>
                  </>
                )}
              </button>

              {form.logo && (
                <button
                  type="button"
                  className="business-config__logo-remove"
                  onClick={() => {
                    setSelectedLogo(null)
                    setForm(prev => ({ ...prev, logo: '' }))
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  Eliminar logo
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                hidden
              />
            </div>
          )}

          <Button
            type="submit"
            className="business-config__save-button business-config__save-button--desktop"
            fullWidth
            size="lg"
            loading={loading}
            style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none' }}
          >
            {isEdit ? 'GUARDAR CAMBIOS' : 'CREAR NEGOCIO'}
          </Button>

          </section>

          <div className="business-config__right-column">
            <section className="business-config__personalization-card">
              <div className="business-config__section-heading">
                <span className="business-config__section-icon" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                    <path d="M12 3a9 9 0 1 0 9 9c0-1.1-.9-2-2-2h-1.2a2 2 0 0 1-1.7-3l.3-.5A2.3 2.3 0 0 0 14.4 3H12Z" />
                  </svg>
                </span>
                <div>
                  <h2>Personalización del chatbot</h2>
                  <p>Mensaje, identidad visual y colores del chat público.</p>
                </div>
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
                    mensajeBienvenida: getDefaultWelcomeMessage(prev.nombre),
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

          {/* Colores del chatbot — persistencia local por negocio */}
          <div className="business-config__color-fields">
              <div className="business-config__color-grid">
                {([
                  ['colorPrimario', 'Color primario'],
                  ['colorSecundario', 'Color secundario'],
                ] as const).map(([field, label]) => (
                  <div key={field} className="business-config__color-field">
                    <label htmlFor={field}>{label}</label>
                    <div>
                      <input
                        id={`${field}-picker`}
                        type="color"
                        aria-label={`Selector de ${label.toLowerCase()}`}
                        value={isValidHexColor(form[field]) ? form[field] : DEFAULT_CHAT_APPEARANCE[field === 'colorPrimario' ? 'primary' : 'secondary']}
                        onChange={event => setForm(prev => ({ ...prev, [field]: event.target.value.toUpperCase() }))}
                      />
                      <input
                        id={field}
                        type="text"
                        value={form[field]}
                        maxLength={7}
                        spellCheck={false}
                        aria-describedby={`${field}-hint`}
                        onChange={event => setForm(prev => ({ ...prev, [field]: event.target.value }))}
                      />
                    </div>
                    <small id={`${field}-hint`}>Formato hexadecimal: #RRGGBB</small>
                  </div>
                ))}
              </div>

              <div
                className="business-config__chat-preview"
                style={{
                  background: `linear-gradient(90deg, ${isValidHexColor(form.colorPrimario) ? form.colorPrimario : DEFAULT_CHAT_APPEARANCE.primary}, ${isValidHexColor(form.colorSecundario) ? form.colorSecundario : DEFAULT_CHAT_APPEARANCE.secondary})`,
                }}
              >
                <img src={form.logo || '/isoBot-transparente.png'} alt="" aria-hidden="true" />
                <div>
                  <strong>{form.nombre || 'Tu negocio'}</strong>
                  <span>Vista previa del encabezado</span>
                </div>
              </div>
          </div>
            </section>

          {/* Apariencia — solo en modo edición */}
          {isEdit && (
            <div className="business-config__appearance-card" style={{
              padding: '16px',
              borderRadius: 12,
              border: `1px solid ${isDark ? '#DCE3EC' : '#31435C'}`,
              background: isDark ? '#F7F9FC' : '#1D2A3D',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                marginBottom: 15,
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#1CB8BF',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isDark ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
                    </svg>
                  )}
                </div>
                <span style={{
                  color: isDark ? '#111B27' : '#F2F7FA',
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                  Apariencia
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    color: isDark ? '#111B27' : '#F2F7FA',
                    fontSize: 13,
                    fontWeight: 600,
                    margin: '0 0 3px',
                  }}>
                    {isDark ? 'Modo claro' : 'Modo oscuro'}
                  </p>
                  <p style={{
                    color: isDark ? '#6C738E' : '#A8B5C3',
                    fontSize: 11,
                    lineHeight: 1.4,
                    margin: 0,
                  }}>
                    Cambia entre modo claro y oscuro
                  </p>
                </div>
                <Switch
                  checked={isDark}
                  label=""
                  aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  onChange={checked => setTheme(checked ? 'dark' : 'light')}
                  style={{ flexShrink: 0 }}
                />
              </div>
            </div>
          )}

          {isEdit && (
            <Button
              type="submit"
              className="business-config__save-button business-config__save-button--mobile"
              fullWidth
              size="lg"
              loading={loading}
              style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none' }}
            >
              GUARDAR CAMBIOS
            </Button>
          )}

          {/* Enlace público — solo en modo edición */}
          {isEdit && (
            <div className="business-config__link-card" style={{
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
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}>
                <span style={{
                  padding: '0 0 0 14px',
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  maxWidth: '60%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {window.location.origin}/
                </span>
                <input
                  type="text"
                  aria-label="Identificador del enlace público"
                  value={form.slug}
                  maxLength={100}
                  disabled={slugPersonalizado !== false}
                  onChange={event => {
                    setLinkCopied(false)
                    setForm(prev => ({ ...prev, slug: event.target.value }))
                  }}
                  placeholder="mi-negocio"
                  style={{
                    minWidth: 0,
                    flex: 1,
                    height: 42,
                    padding: '0 14px 0 2px',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-family)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {!form.slug
                  ? 'Guardá tu negocio y regresá para ver tu chatbot configurado.'
                  : slugPersonalizado
                    ? 'Este enlace ya fue personalizado y no puede volver a modificarse.'
                    : slugPersonalizado === false
                      ? 'Podés personalizar este enlace una sola vez. Después de confirmarlo no podrás volver a cambiarlo.'
                      : 'Comprobando si el enlace puede editarse...'}
              </p>

              {/* Botón copiar */}
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!form.slug}
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: linkCopied ? '#22c55e' : brand.primaryGradient,
                  color: '#fff',
                  fontSize: '14px', fontWeight: 700,
                  cursor: !form.slug ? 'not-allowed' : 'pointer',
                  opacity: !form.slug ? 0.5 : 1,
                  fontFamily: 'var(--font-family)',
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
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--color-error)' }}>{error}</p>
          )}
        </form>
      </div>

      {isEdit && (
        <button
          type="button"
          className="business-config__public-chat-bot"
          disabled={!business?.slug}
          aria-label="Abrir modo de prueba del chatbot"
          onClick={() => business?.slug && openChatPreview(business.slug, navigate)}
        >
          <span className="business-config__public-chat-label">
            <i aria-hidden="true" />
            Probá tu chat
          </span>
          <span className="business-config__public-chat-avatar" aria-hidden="true">
            <img src="/isoBot-transparente.png" alt="" />
          </span>
        </button>
      )}

      <style>{`
        .business-config-page {
          --business-config-canvas: #F7F9FB;
          position: fixed;
          inset: 0;
          z-index: 10;
          overflow-y: auto;
          background:
            radial-gradient(circle at 8% 12%, rgba(19, 168, 162, .08), transparent 26%),
            var(--business-config-canvas) !important;
        }

        :root[data-theme='dark'] .business-config-page {
          --business-config-canvas: #0F172A;
        }

        .business-config-page__header {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 64px;
          padding: 10px clamp(20px, 4vw, 44px) !important;
          border-bottom: 1px solid var(--color-border);
          background: color-mix(in srgb, var(--color-bg) 92%, transparent) !important;
          backdrop-filter: blur(14px);
        }

        .business-config-page__header-title {
          font-size: 14px;
        }

        .business-config-page__content {
          width: min(100%, 1280px);
          margin: 0 auto;
          padding: 32px clamp(20px, 4vw, 40px) 56px !important;
          overflow: visible !important;
        }

        .business-config-page__content > h1 {
          font-size: clamp(28px, 4vw, 34px) !important;
          letter-spacing: -.7px;
        }

        .business-config__eyebrow {
          display: block;
          margin-bottom: 7px;
          color: #13A8A2;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .business-config__form {
          display: grid !important;
          grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr);
          align-items: stretch;
          gap: 24px !important;
        }

        .business-config__form input,
        .business-config__form textarea,
        .business-config__form select {
          border-radius: 12px !important;
        }

        .business-config__form input:focus,
        .business-config__form textarea:focus,
        .business-config__form select:focus {
          border-color: #13A8A2 !important;
          box-shadow: 0 0 0 3px rgba(19, 168, 162, .14);
        }

        .business-config__data-card,
        .business-config__personalization-card,
        .business-config__appearance-card,
        .business-config__link-card {
          padding: clamp(20px, 3vw, 28px) !important;
          border: 1px solid var(--color-border);
          border-radius: 18px !important;
          background: var(--color-bg) !important;
          box-shadow: 0 8px 22px rgba(15, 23, 42, .08) !important;
        }

        .business-config__data-card,
        .business-config__right-column {
          min-width: 0;
        }

        .business-config__data-card,
        .business-config__right-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .business-config__right-column {
          gap: 24px;
        }

        .business-config__personalization-card {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .business-config__appearance-card {
          color: var(--color-text-primary) !important;
        }

        .business-config__appearance-card p,
        .business-config__appearance-card span {
          color: var(--color-text-primary) !important;
        }

        .business-config__appearance-card p + p {
          color: var(--color-text-secondary) !important;
        }

        .business-config__appearance-card > div:first-child > div {
          color: #FFFFFF !important;
        }

        .business-config__link-card {
          flex: 1;
          background: var(--color-bg) !important;
        }

        .business-config__save-button--mobile {
          display: none !important;
        }

        .business-config__form > [role='alert'],
        .business-config__form > p,
        .business-config__form > button {
          grid-column: 1 / -1;
        }

        .business-config__section-heading {
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .business-config__section-heading h2 {
          margin: 0 0 3px;
          font-size: 17px;
        }

        .business-config__section-heading p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 12px;
        }

        .business-config__section-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          color: #FFFFFF;
          border-radius: 12px;
          background: linear-gradient(135deg, #13A8A2, #1372A8);
        }

        .business-config__logo-field {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .business-config__logo-upload {
          width: 100%;
          min-height: 184px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--color-text-primary);
          border: 2px dashed var(--color-border);
          border-radius: 16px;
          background: color-mix(in srgb, var(--color-bg) 94%, #13A8A2 6%);
          cursor: pointer;
          transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
        }

        .business-config__logo-upload:hover {
          border-color: #13A8A2;
          background: color-mix(in srgb, var(--color-bg) 88%, #13A8A2 12%);
          transform: translateY(-1px);
        }

        .business-config__logo-placeholder {
          width: 56px;
          height: 56px;
          margin-bottom: 2px;
          display: grid;
          place-items: center;
          color: var(--color-text-secondary);
          border-radius: 14px;
          background: var(--color-surface-muted);
        }

        .business-config__logo-upload strong {
          font-size: 14px;
        }

        .business-config__logo-upload small {
          color: var(--color-text-secondary);
          font-size: 12px;
        }

        .business-config__logo-upload--filled {
          min-height: 220px;
        }

        .business-config__logo-upload--filled img {
          width: min(180px, 70%);
          height: 140px;
          object-fit: contain;
          border-radius: 12px;
          background: #FFFFFF;
        }

        .business-config__logo-upload--filled span {
          color: #13A8A2;
          font-size: 13px;
          font-weight: 700;
        }

        .business-config__logo-remove {
          align-self: flex-end;
          padding: 2px 0;
          color: var(--color-error);
          border: 0;
          background: transparent;
          font-family: var(--font-family);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .business-config__public-chat-bot {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 25;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          color: var(--color-text-primary);
        }

        .business-config__public-chat-bot:disabled {
          opacity: .48;
          cursor: not-allowed;
        }

        .business-config__public-chat-label {
          min-height: 38px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--color-border);
          border-radius: 999px;
          background: var(--color-bg);
          box-shadow: 0 8px 20px rgba(15, 23, 42, .16);
          font-size: 12px;
          font-weight: 700;
        }

        .business-config__public-chat-label i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #65E6A5;
        }

        .business-config__public-chat-avatar {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 2px solid #13A8A2;
          border-radius: 50%;
          background: var(--color-bg);
          box-shadow: 0 8px 20px rgba(15, 23, 42, .16);
        }

        .business-config__public-chat-avatar img {
          width: 54px;
          height: 54px;
          object-fit: contain;
        }

        .business-config__color-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .business-config__color-fields {
          padding-top: 2px;
        }

        .business-config__color-field > label {
          display: block;
          margin-bottom: 8px;
          color: var(--color-text-primary);
          font-size: 13px;
          font-weight: 700;
        }

        .business-config__color-field > div {
          display: flex;
          gap: 10px;
        }

        .business-config__color-field input[type='color'] {
          width: 52px;
          height: 52px;
          flex: 0 0 auto;
          padding: 3px;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          cursor: pointer;
        }

        .business-config__color-field input[type='text'] {
          width: 100%;
          min-width: 0;
          height: 52px;
          padding: 0 14px;
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          font-family: var(--font-family);
          font-size: 15px;
        }

        .business-config__color-field small {
          display: block;
          margin-top: 5px;
          color: var(--color-text-secondary);
          font-size: 10px;
        }

        .business-config__chat-preview {
          min-height: 66px;
          margin-top: 18px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 11px;
          color: #FFFFFF;
          border-radius: 14px;
          box-shadow: 0 10px 22px rgba(15, 23, 42, .14);
        }

        .business-config__chat-preview img {
          width: 42px;
          height: 42px;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, .7);
          border-radius: 50%;
          background: #FFFFFF;
        }

        .business-config__chat-preview strong,
        .business-config__chat-preview span {
          display: block;
        }

        .business-config__chat-preview strong {
          font-size: 14px;
        }

        .business-config__chat-preview span {
          margin-top: 2px;
          color: rgba(255, 255, 255, .8);
          font-size: 11px;
        }

        @media (max-width: 620px) {
          .business-config-page__content {
            padding-top: 22px !important;
          }

          .business-config__color-grid {
            grid-template-columns: 1fr;
          }

          .business-config-page--editing .business-config__save-button--desktop {
            display: none !important;
          }

          .business-config-page--editing .business-config__save-button--mobile {
            display: inline-flex !important;
          }

          .business-config__public-chat-bot {
            right: 14px;
            bottom: 14px;
          }
        }

        @media (min-width: 1000px) {
          .business-config-page--editing {
            padding-left: 280px;
          }

          .business-config-page--editing .business-config-page__header {
            display: none !important;
          }

          .business-config-page--editing .business-config-page__content {
            padding-top: 40px !important;
          }

        }

        @media (max-width: 900px) {
          .business-config__form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
