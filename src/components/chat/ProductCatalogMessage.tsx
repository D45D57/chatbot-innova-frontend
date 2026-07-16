import { useState } from 'react'
import type { Product } from '../../types'
import type { OrderItem } from '../../hooks/useChat'
import { brand } from '../../styles/brand'

interface ProductCatalogMessageProps {
  products: Product[]
  onConfirm: (items: OrderItem[]) => void
}

function PriceTag({ product }: { product: Product }) {
  if (product.precioConsultar) {
    return (
      <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
        Precio a convenir
      </span>
    )
  }
  if (product.precio != null) {
    return (
      <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>
        ${product.precio.toLocaleString('es-AR')}
      </span>
    )
  }
  return null
}

export function ProductCatalogMessage({ products, onConfirm }: ProductCatalogMessageProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const change = (id: string, delta: number) => {
    setQuantities(prev => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      return { ...prev, [id]: next }
    })
  }

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0)

  const handleConfirm = () => {
    const items: OrderItem[] = products
      .filter(p => (quantities[p.id] ?? 0) > 0)
      .map(p => ({ product: p, quantity: quantities[p.id] }))
    onConfirm(items)
  }

  return (
    <div style={{ paddingLeft: 44, paddingBottom: 8 }}>
      {/* Lista de productos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {products.map(product => {
          const qty = quantities[product.id] ?? 0
          const selected = qty > 0
          return (
            <div
              key={product.id}
              style={{
                border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 12,
                background: 'var(--color-bg)',
                boxShadow: selected ? '0 2px 8px rgba(19,171,162,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 10,
              }}
            >
              {/* Imagen pequeña */}
              <div style={{
                width: 72, height: 72, borderRadius: 8,
                background: 'var(--color-surface-muted)', flexShrink: 0, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {product.imagen
                  ? <img src={product.imagen} alt={product.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                  {product.nombre}
                </span>
                {product.descripcion && (
                  <span style={{
                    fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {product.descripcion}
                  </span>
                )}
                <PriceTag product={product} />
              </div>

              {/* Selector cantidad */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => change(product.id, -1)}
                  disabled={qty === 0}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1.5px solid',
                    borderColor: qty > 0 ? 'var(--color-primary)' : '#D1D5DB',
                    background: 'none', cursor: qty > 0 ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: qty > 0 ? 'var(--color-primary)' : '#D1D5DB',
                    fontSize: 18, lineHeight: 1, padding: 0,
                  }}
                >
                  −
                </button>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: qty > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  minWidth: 18, textAlign: 'center',
                }}>
                  {qty}
                </span>
                <button
                  onClick={() => change(product.id, 1)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none',
                    background: brand.primaryGradient,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 18, lineHeight: 1, padding: 0,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botón confirmar */}
      <button
        onClick={handleConfirm}
        disabled={totalItems === 0}
        style={{
          width: '100%',
          height: 44,
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: totalItems > 0 ? brand.primaryGradient : 'var(--color-surface-muted)',
          color: totalItems > 0 ? '#fff' : 'var(--color-text-secondary)',
          fontSize: 14,
          fontWeight: 700,
          cursor: totalItems > 0 ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-family)',
          transition: 'background 0.2s',
        }}
      >
        {totalItems > 0
          ? `Confirmar selección (${totalItems} ${totalItems === 1 ? 'item' : 'items'})`
          : 'Seleccioná al menos un producto'}
      </button>
    </div>
  )
}
