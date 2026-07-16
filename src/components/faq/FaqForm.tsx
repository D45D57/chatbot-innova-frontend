import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import type { FAQ, FAQCategory, FAQFormData } from '../../types'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Input } from '../ui/Input'
import { Switch } from '../ui/Switch'
import { Textarea } from '../ui/Textarea'
import { brand } from '../../styles/brand'

interface FaqFormProps {
  faq?: FAQ
  categories: FAQCategory[]
  loading?: boolean
  onSubmit: (data: FAQFormData) => Promise<void>
  onCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
}

const labelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6C738E',
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
}

const FAQ_PRIMARY = brand.primary
const FAQ_TEXT = brand.text
const FAQ_MUTED = brand.muted
const FAQ_BORDER = brand.border
const FAQ_FIELD_BG = brand.field

export function FaqForm({ faq, categories, loading = false, onSubmit, onCancel, onDirtyChange }: FaqFormProps) {
  const initialCategoryMode: 'existing' | 'new' = faq?.categoriaId || categories.length > 0 ? 'existing' : 'new'
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>(initialCategoryMode)
  const [form, setForm] = useState<FAQFormData>({
    pregunta: faq?.pregunta ?? '',
    respuesta: faq?.respuesta ?? '',
    categoriaId: faq?.categoriaId ?? '',
    categoria: faq?.categoria ?? '',
    nuevaCategoriaNombre: '',
    activa: faq?.activa ?? true,
    sourceSuggestionId: faq?.sourceSuggestionId,
  })
  const [errors, setErrors] = useState<{ pregunta?: string; respuesta?: string; categoria?: string }>({})
  const initialSnapshot = useMemo(() => JSON.stringify({
    pregunta: faq?.pregunta ?? '',
    respuesta: faq?.respuesta ?? '',
    categoriaId: initialCategoryMode === 'existing' ? faq?.categoriaId ?? '' : '',
    nuevaCategoriaNombre: '',
    activa: faq?.activa ?? true,
    categoryMode: initialCategoryMode,
  }), [faq, initialCategoryMode])
  const currentSnapshot = JSON.stringify({
    pregunta: form.pregunta,
    respuesta: form.respuesta,
    categoriaId: categoryMode === 'existing' ? form.categoriaId ?? '' : '',
    nuevaCategoriaNombre: categoryMode === 'new' ? form.nuevaCategoriaNombre ?? '' : '',
    activa: form.activa,
    categoryMode,
  })
  const isDirty = currentSnapshot !== initialSnapshot

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const hasCategory = categoryMode === 'existing'
      ? Boolean(form.categoriaId)
      : Boolean(form.nuevaCategoriaNombre?.trim())
    const nextErrors = {
      pregunta: form.pregunta.trim() ? undefined : 'La pregunta es obligatoria.',
      respuesta: form.respuesta.trim() ? undefined : 'La respuesta es obligatoria.',
      categoria: hasCategory ? undefined : 'Selecciona o crea una categoria.',
    }
    setErrors(nextErrors)
    if (nextErrors.pregunta || nextErrors.respuesta || nextErrors.categoria) return

    await onSubmit({
      ...form,
      categoriaId: categoryMode === 'existing' ? form.categoriaId : undefined,
      categoria: categoryMode === 'existing'
        ? categories.find(category => category.id === form.categoriaId)?.nombre
        : form.nuevaCategoriaNombre,
      nuevaCategoriaNombre: categoryMode === 'new' ? form.nuevaCategoriaNombre : undefined,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px',
        background: brand.surface,
        border: `1px solid ${FAQ_PRIMARY}`,
        borderRadius: '10px',
        boxShadow: brand.shadowCard,
      }}
    >
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '10px', color: FAQ_TEXT }}>
          {faq ? 'Editar pregunta' : 'Nueva pregunta'}
        </h2>
      </div>

      <Input
        label="Pregunta *"
        placeholder="Ej: Cuales son los medios de pago?"
        value={form.pregunta}
        error={errors.pregunta}
        style={{
          height: '44px',
          borderRadius: '10px',
          border: 'none',
          background: FAQ_FIELD_BG,
          fontSize: '12px',
          color: FAQ_TEXT,
        }}
        onChange={event => {
          setForm(current => ({ ...current, pregunta: event.target.value }))
          if (errors.pregunta) setErrors(current => ({ ...current, pregunta: undefined }))
        }}
      />

      <Textarea
        label="Respuesta *"
        placeholder="Escribi una respuesta clara y breve para tus clientes."
        value={form.respuesta}
        error={errors.respuesta}
        style={{
          minHeight: '82px',
          borderRadius: '10px',
          border: 'none',
          background: FAQ_FIELD_BG,
          fontSize: '12px',
          color: FAQ_TEXT,
          resize: 'vertical',
        }}
        onChange={event => {
          setForm(current => ({ ...current, respuesta: event.target.value }))
          if (errors.respuesta) setErrors(current => ({ ...current, respuesta: undefined }))
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={labelStyle}>Categoria *</label>

        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Chip
              type="button"
              selected={categoryMode === 'existing'}
              onClick={() => setCategoryMode('existing')}
            >
              Existente
            </Chip>
            <Chip
              type="button"
              selected={categoryMode === 'new'}
              onClick={() => setCategoryMode('new')}
            >
              Nueva
            </Chip>
          </div>
        )}

        {categoryMode === 'existing' && categories.length > 0 ? (
          <>
            <select
              aria-label="Categoria de la FAQ"
              value={form.categoriaId ?? ''}
              onChange={event => {
                const category = categories.find(item => item.id === event.target.value)
                setForm(current => ({
                  ...current,
                  categoriaId: category?.id ?? '',
                  categoria: category?.nombre ?? '',
                }))
                if (errors.categoria) setErrors(current => ({ ...current, categoria: undefined }))
              }}
              style={{
                height: '52px',
                padding: '0 16px',
                borderRadius: '10px',
                border: `1px solid ${errors.categoria ? 'var(--color-error)' : FAQ_BORDER}`,
                fontSize: '12px',
                fontFamily: 'var(--font-family)',
                color: form.categoriaId ? FAQ_TEXT : FAQ_MUTED,
                background: FAQ_FIELD_BG,
                outline: 'none',
                width: '100%',
              }}
            >
              <option value="">Selecciona una categoria</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.nombre}</option>
              ))}
            </select>
            {errors.categoria && (
              <span style={{ color: 'var(--color-error)', fontSize: '12px' }}>{errors.categoria}</span>
            )}
          </>
        ) : (
          <Input
            placeholder="Ej: Pagos, envios o productos"
            value={form.nuevaCategoriaNombre}
            error={errors.categoria}
            hint="Se creara como categoria real antes de enviar la FAQ al backend."
            style={{
              height: '44px',
              borderRadius: '10px',
              border: 'none',
              background: FAQ_FIELD_BG,
              fontSize: '12px',
              color: FAQ_TEXT,
            }}
            onChange={event => {
              setForm(current => ({ ...current, nuevaCategoriaNombre: event.target.value }))
              if (errors.categoria) setErrors(current => ({ ...current, categoria: undefined }))
            }}
          />
        )}
      </div>

      <div style={{
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'rgba(19, 168, 162, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
      }}>
        <Switch
          checked={form.activa}
          label="Mostrar en el chatbot"
          disabled={loading}
          onChange={checked => setForm(current => ({ ...current, activa: checked }))}
        />
        <p style={{
          color: FAQ_MUTED,
          fontSize: '12px',
          lineHeight: 1.5,
        }}>
          Cuando está activada, esta pregunta estará disponible para que el chatbot la use en las conversaciones con clientes.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={onCancel}
          disabled={loading}
          style={{
            height: '42px',
            borderRadius: '11px',
            borderColor: FAQ_PRIMARY,
            color: FAQ_PRIMARY,
            background: brand.surface,
            fontSize: '11px',
            letterSpacing: 0,
          }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          fullWidth
          loading={loading}
          style={{
            height: '42px',
            borderRadius: '11px',
            background: brand.primaryGradient,
            border: 'none',
            boxShadow: brand.shadowAction,
            fontSize: '11px',
            letterSpacing: 0,
          }}
        >
          {faq ? 'Guardar' : 'Agregar'}
        </Button>
      </div>
    </form>
  )
}
