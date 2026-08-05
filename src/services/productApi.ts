import type {
  CreateProductPayload,
  Product,
  ProductApi,
  ProductFilters,
  ProductPage,
  UpdateProductPayload,
} from '../types'
import { apiRequest } from './apiClient'

interface ProductListResponse {
  success: boolean
  productos: ProductPage
}

interface ProductMutationResponse {
  success: boolean
  message: string
  producto: ProductApi
}

function appendFormValue(formData: FormData, key: string, value: string | number | boolean) {
  formData.append(key, String(value))
}

function buildCreateFormData(payload: CreateProductPayload): FormData {
  const formData = new FormData()
  appendFormValue(formData, 'nombre', payload.nombre)
  if (payload.descripcion !== undefined) appendFormValue(formData, 'descripcion', payload.descripcion)
  if (payload.precio !== undefined) appendFormValue(formData, 'precio', payload.precio)
  appendFormValue(formData, 'activo', payload.activo)
  appendFormValue(formData, 'requiereCotizacion', payload.requiereCotizacion)
  if (payload.imagen) formData.append('imagen', payload.imagen)
  return formData
}

function buildUpdateFormData(payload: UpdateProductPayload): FormData {
  const formData = new FormData()
  if (payload.nombre !== undefined) appendFormValue(formData, 'nombre', payload.nombre)
  if (payload.descripcion !== undefined) appendFormValue(formData, 'descripcion', payload.descripcion ?? '')
  if (payload.precio !== undefined) appendFormValue(formData, 'precio', payload.precio)
  if (payload.activo !== undefined) appendFormValue(formData, 'activo', payload.activo)
  if (payload.requiereCotizacion !== undefined) appendFormValue(formData, 'requiereCotizacion', payload.requiereCotizacion)
  if (payload.urlImagen !== undefined) appendFormValue(formData, 'urlImagen', payload.urlImagen ?? '')
  if (payload.imagen) formData.append('imagen', payload.imagen)
  return formData
}

export function mapProductApi(product: ProductApi): Product {
  return {
    id: product.id,
    nombre: product.nombre,
    descripcion: product.descripcion ?? undefined,
    precio: Number(product.precio),
    precioConsultar: product.requiereCotizacion || undefined,
    imagen: product.urlImagen ?? undefined,
    disponible: product.activo,
    stock: product.stock,
  }
}

export async function getProductsApi(filters: ProductFilters = {}): Promise<ProductPage> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 10),
  })
  if (filters.buscar?.trim()) params.set('buscar', filters.buscar.trim())
  if (filters.activo !== undefined) params.set('activo', String(filters.activo))

  const response = await apiRequest<ProductListResponse>(`/products?${params.toString()}`)
  return response.productos
}

export async function getProductByIdApi(id: string): Promise<ProductApi | null> {
  const response = await apiRequest<ProductMutationResponse>(`/products/${encodeURIComponent(id)}`)
  return response.producto
}

export async function createProductApi(payload: CreateProductPayload): Promise<ProductApi> {
  const response = await apiRequest<ProductMutationResponse>('/products', {
    method: 'POST',
    body: buildCreateFormData(payload),
  })
  return response.producto
}

export async function updateProductApi(id: string, payload: UpdateProductPayload): Promise<ProductApi> {
  const response = await apiRequest<ProductMutationResponse>(`/products/${id}`, {
    method: 'PUT',
    body: buildUpdateFormData(payload),
  })
  return response.producto
}

export async function deleteProductApi(id: string): Promise<void> {
  await apiRequest<{ success: boolean; message: string }>(`/products/${id}`, {
    method: 'DELETE',
  })
}
