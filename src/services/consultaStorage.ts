import type { Consulta, ConsultaCerradaPor, ConsultaEstado, Mensaje } from '../types'
import { apiRequest } from './apiClient'

const STORAGE_PREFIX = 'emprendebot:consultas'

type StoredConsultaEstado = ConsultaEstado | 'pendiente' | 'atendida' | 'respondida' | 'derivada'

const ESTADOS_VALIDOS: ConsultaEstado[] = ['nueva', 'en_proceso', 'cerrada']

function storageKey(userId?: string) {
  return `${STORAGE_PREFIX}:${userId ?? 'demo'}`
}

function createMessage(
  id: string,
  consultaId: string,
  emisor: Mensaje['emisor'],
  contenido: string,
  fechaCreacion: string,
): Mensaje {
  return {
    id,
    consultaId,
    emisor,
    contenido,
    tipoMensaje: 'texto',
    fechaCreacion,
    fechaActualizacion: fechaCreacion,
    leido: emisor !== 'cliente',
  }
}

function createMockConsultas(userId?: string): Consulta[] {
  return [
    {
      id: '101',
      usuarioId: userId ?? null,
      sessionAnonimaId: 'web-ana-101',
      clienteNombre: 'Ana Martinez',
      clienteTelefono: '5491123456789',
      estado: 'nueva',
      derivada: false,
      cerradaPor: null,
      tipoConsulta: 'presupuesto',
      prioridad: 'alta',
      canal: 'whatsapp',
      asunto: 'Consulta por presupuesto',
      descripcion: 'Quiere cotizar un pedido para el viernes.',
      derivadaA: null,
      fechaCreacion: '2026-06-18T13:15:00.000Z',
      fechaActualizacion: '2026-06-19T12:38:00.000Z',
      fechaCierre: null,
      mensajes: [
        createMessage('m-101-1', '101', 'cliente', 'Hola, queria saber si hacen pedidos grandes.', '2026-06-19T12:31:00.000Z'),
        createMessage('m-101-2', '101', 'bot', 'Hola! Si, podemos ayudarte con pedidos grandes. Que cantidad necesitarias?', '2026-06-19T12:31:10.000Z'),
        createMessage('m-101-3', '101', 'cliente', 'Serian unas 40 unidades para el viernes.', '2026-06-19T12:38:00.000Z'),
      ],
    },
    {
      id: '102',
      usuarioId: userId ?? null,
      sessionAnonimaId: 'web-visitante-102',
      clienteNombre: null,
      clienteTelefono: null,
      estado: 'en_proceso',
      derivada: false,
      cerradaPor: null,
      tipoConsulta: 'catalogo',
      prioridad: 'normal',
      canal: 'web',
      asunto: null,
      descripcion: 'Cliente navego productos desde el chat.',
      derivadaA: null,
      fechaCreacion: '2026-06-19T10:05:00.000Z',
      fechaActualizacion: '2026-06-19T10:22:00.000Z',
      fechaCierre: null,
      mensajes: [
        createMessage('m-102-1', '102', 'cliente', 'Quiero ver catalogo', '2026-06-19T10:05:00.000Z'),
        createMessage('m-102-2', '102', 'bot', 'Claro, te muestro los productos disponibles.', '2026-06-19T10:05:05.000Z'),
        createMessage('m-102-3', '102', 'cliente', 'Me interesa el producto destacado.', '2026-06-19T10:22:00.000Z'),
      ],
    },
    {
      id: '103',
      usuarioId: userId ?? null,
      sessionAnonimaId: 'wa-luis-103',
      clienteNombre: 'Luis Gomez',
      clienteTelefono: '5491198765432',
      estado: 'cerrada',
      derivada: false,
      cerradaPor: 'bot',
      tipoConsulta: 'general',
      prioridad: 'baja',
      canal: 'whatsapp',
      asunto: 'Horarios de atencion',
      descripcion: 'Pregunta simple respondida por el bot.',
      derivadaA: null,
      fechaCreacion: '2026-06-18T16:40:00.000Z',
      fechaActualizacion: '2026-06-18T16:42:00.000Z',
      fechaCierre: '2026-06-18T16:42:00.000Z',
      mensajes: [
        createMessage('m-103-1', '103', 'cliente', 'Hola, que horarios tienen?', '2026-06-18T16:40:00.000Z'),
        createMessage('m-103-2', '103', 'bot', 'Atendemos de lunes a viernes de 9 a 18 hs.', '2026-06-18T16:40:06.000Z'),
        createMessage('m-103-3', '103', 'cliente', 'Perfecto, gracias.', '2026-06-18T16:42:00.000Z'),
      ],
    },
    {
      id: '104',
      usuarioId: userId ?? null,
      sessionAnonimaId: 'web-sofia-104',
      clienteNombre: 'Sofia Rios',
      clienteTelefono: '5491133344455',
      estado: 'en_proceso',
      derivada: true,
      cerradaPor: null,
      tipoConsulta: 'derivacion',
      prioridad: 'urgente',
      canal: 'web',
      asunto: 'Necesita hablar con una persona',
      descripcion: 'El bot sugirio derivacion por falta de respuesta exacta.',
      derivadaA: 'ventas@negocio.com',
      fechaCreacion: '2026-06-17T18:12:00.000Z',
      fechaActualizacion: '2026-06-17T18:20:00.000Z',
      fechaCierre: null,
      mensajes: [
        createMessage('m-104-1', '104', 'cliente', 'Necesito una respuesta mas especifica.', '2026-06-17T18:12:00.000Z'),
        createMessage('m-104-2', '104', 'bot', 'Te comunico con alguien del equipo para ayudarte mejor.', '2026-06-17T18:12:08.000Z'),
        createMessage('m-104-3', '104', 'usuario', 'Hola Sofia, soy del equipo. Contame un poco mas.', '2026-06-17T18:20:00.000Z'),
      ],
    },
    {
      id: '105',
      usuarioId: userId ?? null,
      sessionAnonimaId: 'web-marcos-105',
      clienteNombre: 'Marcos Diaz',
      clienteTelefono: null,
      estado: 'cerrada',
      derivada: false,
      cerradaPor: 'emprendedor',
      tipoConsulta: 'soporte',
      prioridad: 'normal',
      canal: 'web',
      asunto: 'Consulta resuelta',
      descripcion: 'Se respondio la duda y se cerro la interaccion.',
      derivadaA: null,
      fechaCreacion: '2026-06-16T11:00:00.000Z',
      fechaActualizacion: '2026-06-16T11:18:00.000Z',
      fechaCierre: '2026-06-16T11:18:00.000Z',
      mensajes: [
        createMessage('m-105-1', '105', 'cliente', 'Hacen envios a domicilio?', '2026-06-16T11:00:00.000Z'),
        createMessage('m-105-2', '105', 'bot', 'Si, hacemos envios dentro de la zona.', '2026-06-16T11:00:04.000Z'),
        createMessage('m-105-3', '105', 'cliente', 'Listo, muchas gracias.', '2026-06-16T11:17:00.000Z'),
      ],
    },
  ]
}

function mapLegacyEstado(
  estadoNombre?: StoredConsultaEstado,
): { estado: ConsultaEstado; derivada: boolean; cerradaPor: ConsultaCerradaPor | null } {
  if (estadoNombre === 'en_proceso' || estadoNombre === 'atendida') {
    return { estado: 'en_proceso', derivada: false, cerradaPor: null }
  }

  if (estadoNombre === 'respondida') {
    return { estado: 'cerrada', derivada: false, cerradaPor: 'bot' }
  }

  if (estadoNombre === 'derivada') {
    return { estado: 'en_proceso', derivada: true, cerradaPor: null }
  }

  if (estadoNombre === 'cerrada') {
    return { estado: 'cerrada', derivada: false, cerradaPor: null }
  }

  return { estado: 'nueva', derivada: false, cerradaPor: null }
}

function normalizeConsulta(raw: Omit<Consulta, 'estado'> & {
  estado?: StoredConsultaEstado
  estadoConsulta?: { nombre?: StoredConsultaEstado }
  estadoConsultaId?: string
}): Consulta {
  const storedEstado = raw.estado ?? raw.estadoConsulta?.nombre
  const legacy = mapLegacyEstado(storedEstado)
  const estado = storedEstado && ESTADOS_VALIDOS.includes(storedEstado as ConsultaEstado)
    ? storedEstado as ConsultaEstado
    : legacy.estado
  const derivada = raw.derivada === true || legacy.derivada
  const cerradaPor = estado === 'cerrada'
    ? raw.cerradaPor ?? legacy.cerradaPor
    : null

  const {
    estadoConsulta,
    estadoConsultaId,
    ...consulta
  } = raw
  void estadoConsulta
  void estadoConsultaId

  return {
    ...consulta,
    estado,
    derivada,
    cerradaPor,
    fechaCierre: estado === 'cerrada' ? consulta.fechaCierre ?? consulta.fechaActualizacion : null,
  }
}

function readConsultas(userId?: string): Consulta[] {
  if (typeof window === 'undefined') return createMockConsultas(userId)

  const key = storageKey(userId)
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    const initial = createMockConsultas(userId)
    window.localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }

  try {
    const parsed = JSON.parse(raw) as Array<Omit<Consulta, 'estado'> & {
      estado?: StoredConsultaEstado
      estadoConsulta?: { nombre?: StoredConsultaEstado }
      estadoConsultaId?: string
    }>
    const normalized = parsed.map(normalizeConsulta)
    window.localStorage.setItem(key, JSON.stringify(normalized))
    return normalized
  } catch {
    const initial = createMockConsultas(userId)
    window.localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }
}

function writeConsultas(consultas: Consulta[], userId?: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(userId), JSON.stringify(consultas))
}

export async function getConsultas(userId?: string): Promise<Consulta[]> {
  try {
    const response = await apiRequest<{ success: boolean; consultas: Consulta[] }>('/consultations')
    if (response.consultas.length > 0) {
      return response.consultas.map(normalizeConsulta).sort((left, right) => (
        new Date(right.fechaActualizacion).getTime() - new Date(left.fechaActualizacion).getTime()
      ))
    }
  } catch {
    // La vista conserva su modo demo cuando la API todavía no está disponible.
  }

  return readConsultas(userId).sort((left, right) => (
    new Date(right.fechaActualizacion).getTime() - new Date(left.fechaActualizacion).getTime()
  ))
}

export async function getConsultaById(consultaId: string, userId?: string): Promise<Consulta | null> {
  return readConsultas(userId).find(consulta => consulta.id === consultaId) ?? null
}

export async function saveConsulta(consulta: Consulta, userId?: string): Promise<Consulta> {
  const consultas = readConsultas(userId)
  const index = consultas.findIndex(item => item.id === consulta.id)
  const next = index >= 0
    ? consultas.map(item => (item.id === consulta.id ? consulta : item))
    : [consulta, ...consultas]
  writeConsultas(next, userId)
  return consulta
}

export async function updateConsultaEstado(
  consultaId: string,
  estado: ConsultaEstado,
  userId?: string,
): Promise<Consulta | null> {
  const isBackendConsultation = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(consultaId)

  if (!isBackendConsultation) {
    const consultas = readConsultas(userId)
    const now = new Date().toISOString()
    let updated: Consulta | null = null
    const next = consultas.map(consulta => {
      if (consulta.id !== consultaId) return consulta
      updated = {
        ...consulta,
        estado,
        cerradaPor: estado === 'cerrada' ? 'emprendedor' : null,
        fechaActualizacion: now,
        fechaCierre: estado === 'cerrada' ? now : null,
      }
      return updated
    })
    writeConsultas(next, userId)
    return updated
  }

  const response = await apiRequest<{ success: boolean; consulta: Consulta }>(
    `/consultations/${consultaId}/estado`,
    { method: 'PATCH', body: JSON.stringify({ estado }) },
  )
  return normalizeConsulta(response.consulta)
}
