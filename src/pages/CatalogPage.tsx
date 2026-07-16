import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { brand } from '../styles/brand'
import { Drawer } from '../components/layout/Drawer'
import { Avatar } from '../components/ui/Avatar'
import type { Product } from '../types'

export function CatalogPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business, updateBusiness, loadBusiness } = useBusiness()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [showPricingModal, setShowPricingModal] = useState(false)

  const openAddProduct = () => setShowPricingModal(true)

  const handlePricingChoice = (precioConsultar: boolean) => {
    setShowPricingModal(false)
    navigate('/catalogo/agregar', { state: { precioConsultar } })
  }

  useEffect(() => {
    if (user) loadBusiness(user.id)
  }, [user, loadBusiness])

  const productos = business?.productos ?? []

  const handleDelete = () => {
    if (!deleteTarget || !business) return
    updateBusiness({ productos: productos.filter(p => p.id !== deleteTarget.id) })
    setDeleteTarget(null)
  }

  return (
    <>
    <Drawer
      business={business}
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      activeItem="catalogo"
    />

    <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-subtle)',
        minHeight: '100svh',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          type="button"
          aria-label="Abrir navegacion"
          onClick={() => setDrawerOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '4px' }}
        >
          ☰
        </button>
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-primary)' }}>
          EmprendeBot
        </span>
        <Avatar name={user?.nombre ?? ''} size={36} />
      </div>

      <div style={{ padding: '18px 20px 0' }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
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
      </div>

      {/* Título */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Catálogo</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>Gestiona tus productos y servicios</p>
        </div>
        {productos.length > 0 && (
          <button
            onClick={() => openAddProduct()}
            style={{
              background: brand.primaryGradient,
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.5,
              fontFamily: 'var(--font-family)',
              whiteSpace: 'nowrap',
              marginTop: 4,
            }}
          >
            + AGREGAR
          </button>
        )}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, padding: '16px 20px 100px' }}>
        {productos.length === 0 ? (
          /* Empty state */
          <div style={{
            background: 'var(--color-bg)',
            borderRadius: 16,
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '48px 24px',
            margin: '8px 0 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            textAlign: 'center',
          }}>
            <img src="/cajaVacia.png" alt="Catálogo vacío" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 20 }} />
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', padding: 10 ,color: 'var(--color-text-primary)' }}>
                Tu catálogo está vacío
              </h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, padding: 8,maxWidth: 260 }}>
                Agrega tu primer producto o servicio para comenzar a recibir consultas y presupuestos.
              </p>
            </div>
            <button
              onClick={() => openAddProduct()}
              style={{
                margin: 12,
                background: brand.primaryGradient,
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '14px 40px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 1,
                fontFamily: 'var(--font-family)',
              }}
            >
              AGREGAR
            </button>
          </div>
        ) : (
          /* Lista de productos */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {productos.map(p => (
              <div key={p.id} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}>
                {/* Imagen */}
                <div style={{
                  width: 70, height: 70, borderRadius: 10,
                  background: 'rgba(19,168,162,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {p.imagen
                    ? <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 26 }}>📦</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>{p.nombre}</p>
                  {p.descripcion && (
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.descripcion}
                    </p>
                  )}
                  {p.precio && (
                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#13A8A2' }}>
                      $ {p.precio.toLocaleString('es-AR')}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => navigate(`/catalogo/editar/${p.id}`)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#6C738E' }}
                    title="Editar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#EF4444' }}
                    title="Eliminar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal selección de tipo de precio */}
      {showPricingModal && (
        <div
          onClick={() => setShowPricingModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '0 24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 400,
              background: 'var(--color-bg)', borderRadius: 20,
              padding: '28px 20px 24px',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}
          >
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.35 }}>
                Configurá cómo querés ofrecer este producto o servicio.
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                La elección en cada producto determinará cómo se mostrará en tu catálogo.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {/* Precio fijo */}
              <button
                onClick={() => handlePricingChoice(false)}
                style={{
                  flex: 1, padding: '18px 12px',
                  border: '1.5px solid var(--color-border)', borderRadius: 14,
                  background: 'var(--color-bg)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  textAlign: 'left', fontFamily: 'var(--font-family)',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#13A8A2')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(19,171,162,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#13A8A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Precio fijo</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#13A8A2', lineHeight: 1.4 }}>
                    El cliente ve el precio directamente
                  </p>
                </div>
              </button>

              {/* Requiere cotización */}
              <button
                onClick={() => handlePricingChoice(true)}
                style={{
                  flex: 1, padding: '18px 12px',
                  border: '1.5px solid var(--color-border)', borderRadius: 14,
                  background: 'var(--color-bg)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  textAlign: 'left', fontFamily: 'var(--font-family)',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#13A8A2')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(19,171,162,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#13A8A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 15h.01M12 12a2 2 0 0 1 0 3.5" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Requiere cotización</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#13A8A2', lineHeight: 1.4 }}>
                    Se muestra como "Precio a convenir"
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo confirmación eliminar */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{
            width: '75%', maxWidth: 340,
            background: 'var(--color-bg)',
            borderRadius: 16,
            padding: '28px 20px 20px',
          }}>
            <p style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'center' }}>
              ¿Estás seguro de que deseas eliminarlo?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1, height: 44,
                  background: 'var(--color-bg)', color: 'var(--color-primary)',
                  border: '1.5px solid #13A8A2', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, height: 44,
                  background: '#EF4444', color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                }}
              >
                ELIMINAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
