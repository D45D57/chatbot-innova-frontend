import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { brand } from '../styles/brand'

interface ProductForm {
  nombre: string
  descripcion: string
  precio: string
  precioConsultar: boolean | undefined   // undefined = sin selección todavía
  imagen: string
}

export function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const locationPrecioConsultar = (location.state as { precioConsultar?: boolean } | null)?.precioConsultar
  const { user } = useAuth()
  const { business, isBusinessLoading, updateBusiness, loadBusiness, saveBusiness } = useBusiness()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) loadBusiness(user.id)
  }, [user, loadBusiness])

  const isEditing = !!id
  const productos = business?.productos ?? []
  const existing = isEditing ? productos.find(p => p.id === id) : undefined

  const [form, setForm] = useState<ProductForm>({
    nombre: existing?.nombre ?? '',
    descripcion: existing?.descripcion ?? '',
    precio: existing?.precio != null ? String(existing.precio) : '',
    precioConsultar: existing?.precioConsultar ? true : existing?.precio != null ? false : locationPrecioConsultar ?? false,
    imagen: existing?.imagen ?? '',
  })

  const set = (field: keyof ProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 400
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        setForm(prev => ({ ...prev, imagen: canvas.toDataURL('image/jpeg', 0.7) }))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const hasValidPrice = form.precioConsultar === true
    || (form.precio.trim() !== '' && Number.isFinite(Number(form.precio)) && Number(form.precio) > 0)
  const canSave = !!form.nombre.trim() && hasValidPrice && !isBusinessLoading

  const handleSave = () => {
    console.log('handleSave clicked', { form, user, business, isBusinessLoading })
    if (!canSave || !user) return

    const nuevo = {
      id: crypto.randomUUID(),
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: form.precioConsultar === false && form.precio ? Number(form.precio) : undefined,
      precioConsultar: form.precioConsultar === true || undefined,
      imagen: form.imagen || undefined,
      disponible: true,
    }

    if (!business) {
      // Si no hay negocio configurado aún, creamos uno básico y le agregamos el producto
      saveBusiness({ userId: user.id, nombre: user.nombre, productos: [nuevo] })
      navigate('/catalogo')
      return
    }

    if (isEditing && existing) {
      const updated = productos.map(p =>
        p.id === id
          ? {
              ...p,
              nombre: form.nombre,
              descripcion: form.descripcion,
              precio: form.precioConsultar === false && form.precio ? Number(form.precio) : undefined,
              precioConsultar: form.precioConsultar === true || undefined,
              imagen: form.imagen || undefined,
            }
          : p
      )
      updateBusiness({ productos: updated })
    } else {
      updateBusiness({ productos: [...productos, nuevo] })
    }

    navigate('/catalogo')
  }

  const inputStyle: React.CSSProperties = {
    height: 48,
    padding: '0 14px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 15,
    fontFamily: 'var(--font-family)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    background: 'var(--color-bg)',
    width: '100%',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        background: 'var(--color-bg)',
        zIndex: 10,
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {isEditing ? 'Editar producto' : 'Agregar al catálogo'}
        </h2>
      </div>

      {/* Formulario */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

        <button
          type="button"
          onClick={() => navigate('/catalogo')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: 8,
            padding: 0,
            color: 'var(--color-text-primary)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span aria-hidden="true" style={{
            width: 20,
            height: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'var(--color-surface-muted)',
            fontSize: 14,
            lineHeight: 1,
          }}>
            {'<'}
          </span>
          Volver
        </button>

        {/* Tipo de precio */}
        <div style={{
          minHeight: 34,
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          border: '1px solid rgba(19, 168, 162, 0.22)',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(19, 168, 162, 0.08)',
          color: 'var(--color-primary)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.59 13.41 11 23l-9-9V2h12l6.59 6.59a3.41 3.41 0 0 1 0 4.82Z" />
              <path d="M7 7h.01" />
            </svg>
            {form.precioConsultar ? 'Precio a convenir' : 'Precio fijo'}
          </span>
          <button
            type="button"
            onClick={() => setForm(prev => ({
              ...prev,
              precioConsultar: !prev.precioConsultar,
              precio: prev.precioConsultar ? prev.precio : '',
            }))}
            style={{
              padding: 0,
              color: 'var(--color-primary)',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            Cambiar
          </button>
        </div>

        {/* Imagen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle}>Imagen</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '1.5px dashed var(--color-border)',
              borderRadius: 12,
              height: 140,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, cursor: 'pointer',
              background: 'var(--color-bg-subtle)',
              overflow: 'hidden',
            }}
          >
            {form.imagen
              ? <img src={form.imagen} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                    Haz clic para subir una imagen<br />JPG, PNG o GIF (Opcional)
                  </p>
                </>
            }
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
        </div>

        {/* Nombre */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Nombre del producto o  servicio</label>
          <input
            value={form.nombre}
            onChange={set('nombre')}
            placeholder="Corte y peinado"
            style={inputStyle}
          />
        </div>

        {/* Descripción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={set('descripcion')}
            placeholder="Incluye lavado, corte personalizado y peinado final."
            rows={3}
            style={{
              padding: '12px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 15,
              fontFamily: 'var(--font-family)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              resize: 'vertical',
              background: 'var(--color-bg)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Precio fijo */}
        {form.precioConsultar === false ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={labelStyle}>Precio</label>
            <input
              value={form.precio}
              onChange={set('precio')}
              onBlur={e => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val)) setForm(prev => ({ ...prev, precio: val.toFixed(2) }))
              }}
              placeholder="0.00"
              type="number"
              min={0}
              step="0.01"
              style={inputStyle}
            />
          </div>
        ) : (
          <div style={{
            minHeight: 70,
            padding: '13px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 7,
            border: '1px solid rgba(108, 115, 142, 0.12)',
            borderRadius: 18,
            background: '#E7EDF5',
            color: 'var(--color-text-secondary)',
            fontSize: 15,
            lineHeight: 1.5,
          }}>
            <span aria-hidden="true" style={{
              width: 18,
              height: 18,
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
              color: 'var(--color-secondary)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.6-.8L4 20l1.5-4A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
                <path d="M9 12h.01M12 12h.01M15 12h.01" />
              </svg>
            </span>
            <span>
              En el catálogo del chatbot se mostrará como <strong>Precio a convenir.</strong>
            </span>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 4, marginTop: 'auto' }}>
          <button
            onClick={() => navigate('/catalogo')}
            style={{
              flex: 1, height: 48,
              background: 'var(--color-bg)', color: 'var(--color-primary)',
              border: '1.5px solid #13A8A2', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-family)',
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 1, height: 48,
              background: canSave ? brand.primaryGradient : '#ccc',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-family)',
            }}
          >
            GUARDAR
          </button>
        </div>
      </div>
    </div>
  )
}
