import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { FAQ, FAQCategory, FAQFormData } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

interface FaqFormProps {
  faq?: FAQ
  categories: FAQCategory[]
  loading?: boolean
  submitError?: string
  onSubmit: (data: FAQFormData) => Promise<void>
  onCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export function FaqForm({ faq, categories, loading = false, submitError, onSubmit, onCancel, onDirtyChange }: FaqFormProps) {
  const initialCategoryMode: 'existing' | 'new' = faq?.categoriaId || categories.length > 0 ? 'existing' : 'new'
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>(initialCategoryMode)
  const [form, setForm] = useState<FAQFormData>({
    pregunta: faq?.pregunta ?? '',
    respuesta: faq?.respuesta ?? '',
    categoriaId: faq?.categoriaId ?? '',
    categoria: faq?.categoria ?? '',
    nuevaCategoriaNombre: '',
  })
  const [errors, setErrors] = useState<{ pregunta?: string; respuesta?: string; categoria?: string }>({})
  const initialSnapshot = useMemo(() => JSON.stringify({
    pregunta: faq?.pregunta ?? '',
    respuesta: faq?.respuesta ?? '',
    categoriaId: initialCategoryMode === 'existing' ? faq?.categoriaId ?? '' : '',
    nuevaCategoriaNombre: '',
    categoryMode: initialCategoryMode,
  }), [faq, initialCategoryMode])
  const currentSnapshot = JSON.stringify({
    pregunta: form.pregunta,
    respuesta: form.respuesta,
    categoriaId: categoryMode === 'existing' ? form.categoriaId ?? '' : '',
    nuevaCategoriaNombre: categoryMode === 'new' ? form.nuevaCategoriaNombre ?? '' : '',
    categoryMode,
  })

  useEffect(() => {
    onDirtyChange?.(currentSnapshot !== initialSnapshot)
  }, [currentSnapshot, initialSnapshot, onDirtyChange])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return
    const hasCategory = categoryMode === 'existing' ? Boolean(form.categoriaId) : Boolean(form.nuevaCategoriaNombre?.trim())
    const nextErrors = {
      pregunta: form.pregunta.trim() ? undefined : 'La pregunta es obligatoria.',
      respuesta: form.respuesta.trim() ? undefined : 'La respuesta es obligatoria.',
      categoria: hasCategory ? undefined : 'Seleccioná o creá una categoría.',
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
    <form className="faq-form" onSubmit={handleSubmit}>
      <div className="faq-form__field">
        <Input
          autoFocus
          label="Pregunta *"
          placeholder="Escribí la pregunta frecuente"
          value={form.pregunta}
          error={errors.pregunta}
          onChange={event => {
            setForm(current => ({ ...current, pregunta: event.target.value }))
            if (errors.pregunta) setErrors(current => ({ ...current, pregunta: undefined }))
          }}
        />
      </div>

      <div className="faq-form__field">
        <Textarea
          label="Respuesta *"
          placeholder="Escribí una respuesta clara y breve para tus clientes."
          value={form.respuesta}
          error={errors.respuesta}
          onChange={event => {
            setForm(current => ({ ...current, respuesta: event.target.value }))
            if (errors.respuesta) setErrors(current => ({ ...current, respuesta: undefined }))
          }}
        />
      </div>

      <fieldset className="faq-form__category">
        <legend>Categoría *</legend>
        {categories.length > 0 && (
          <div className="faq-form__category-tabs">
            <button type="button" className={categoryMode === 'existing' ? 'is-active' : ''} onClick={() => setCategoryMode('existing')}>Existente</button>
            <button type="button" className={categoryMode === 'new' ? 'is-active' : ''} onClick={() => setCategoryMode('new')}>Nueva</button>
          </div>
        )}
        {categoryMode === 'existing' && categories.length > 0 ? (
          <select
            aria-label="Categoría de la FAQ"
            aria-invalid={Boolean(errors.categoria)}
            value={form.categoriaId ?? ''}
            onChange={event => {
              const category = categories.find(item => item.id === event.target.value)
              setForm(current => ({ ...current, categoriaId: category?.id ?? '', categoria: category?.nombre ?? '' }))
              setErrors(current => ({ ...current, categoria: undefined }))
            }}
          >
            <option value="">Seleccioná una categoría</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.nombre}</option>)}
          </select>
        ) : (
          <Input
            aria-label="Nombre de la nueva categoría"
            placeholder="Ej.: Pagos, envíos o productos"
            value={form.nuevaCategoriaNombre}
            error={errors.categoria}
            onChange={event => {
              setForm(current => ({ ...current, nuevaCategoriaNombre: event.target.value }))
              setErrors(current => ({ ...current, categoria: undefined }))
            }}
          />
        )}
        {categoryMode === 'existing' && errors.categoria && <span className="faq-form__error">{errors.categoria}</span>}
      </fieldset>

      {submitError && <div className="faq-form__submit-error" role="alert">{submitError}</div>}

      <div className="faq-form__actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" loading={loading}>{faq ? 'Guardar cambios' : 'Agregar pregunta'}</Button>
      </div>
    </form>
  )
}
