// Traducción entre los datos de la app y las filas de Supabase (SCRUM-248). Son funciones puras: no tocan la red.

import { describe, expect, it } from 'vitest'
import { DEFAULT_CABINS, DEFAULT_CAMPING, DEFAULT_DISHES } from '../src/data/seed'
import { ErrorDeAlmacenamiento } from '../src/lib/errores'
import { codigoDeLaBase, MENSAJE_SIN_CONEXION, traducirError } from '../src/lib/repositories/supabase/errores'
import {
  CLAVE_DE_AJUSTE,
  bookingDeFila,
  cabinAFila,
  cabinDeFila,
  pagoAFila,
  pagoDeFila,
  payloadCrearSolicitud,
  payloadGuardarReserva,
  platoAFila,
  platoDeFila,
  sitioAFila,
  sitioDeFila,
  solicitudConRespuesta,
  solicitudDeFila,
  type FilaReserva
} from '../src/lib/repositories/supabase/mapeos'
import type { ReservationRequest } from '../src/types/domain'

const ID_CABANA = DEFAULT_CABINS[0].id
const ID_PLATO = DEFAULT_DISHES[0].id

function filaCabana(sobre: Partial<FilaReserva> = {}): FilaReserva {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    codigo: 'SOL-00007',
    origen: 'cliente',
    tipo: 'cabana',
    estado: 'pending',
    cliente_nombre: 'Ana Pérez',
    cliente_telefono: '+56 9 1234 5678',
    cliente_correo: 'ana@correo.cl',
    tipo_cliente: null,
    cabana_id: ID_CABANA,
    sitio_id: null,
    modalidad_camping: null,
    fecha_inicio: '2027-02-10',
    fecha_fin: '2027-02-12',
    personas: 4,
    hora_entrada: '15:00:00',
    hora_salida: '11:00:00',
    comentarios: 'Llegamos tarde',
    subtotal: 130000,
    iva_porcentaje: '19.00',
    iva_monto: 24700,
    total: 154700,
    abono_porcentaje: '30.00',
    abono_exigido: 46410,
    abono_vence_en: '2027-02-08T12:00:00+00:00',
    evento_especial: false,
    grupo_id: null,
    en_conflicto: false,
    creada_en: '2027-02-06T12:00:00+00:00',
    actualizada_en: '2027-02-06T12:00:00+00:00',
    reserva_comidas: [],
    reserva_items: [],
    pagos: [],
    cabanas: { nombre: 'Cabaña 6' },
    sitios_camping: null,
    ...sobre
  }
}

function filaRestaurante(): FilaReserva {
  return filaCabana({
    id: '22222222-2222-4222-8222-222222222222',
    codigo: 'ADM-00002',
    origen: 'admin',
    tipo: 'restaurante',
    estado: 'confirmed',
    tipo_cliente: 'Institución',
    cabana_id: null,
    cabanas: null,
    fecha_fin: '2027-02-10',
    hora_entrada: null,
    hora_salida: null,
    subtotal: 40000,
    iva_monto: 7600,
    total: 47600,
    abono_exigido: 0,
    abono_vence_en: null,
    evento_especial: true,
    // Los ítems llegan anidados dentro de su comida, como los entrega la API
    reserva_comidas: [
      {
        comida: 'once',
        hora: '17:30:00',
        reserva_items: [
          { comida: 'once', plato_id: null, nombre: 'Once suelta', precio_unitario: 5000, cantidad: 3, acompanamiento_fijo: 'Sopaipillas', acompanamientos: {} }
        ]
      },
      {
        comida: 'almuerzo',
        hora: '13:00:00',
        reserva_items: [
          { comida: 'almuerzo', plato_id: ID_PLATO, nombre: 'Asado', precio_unitario: 20000, cantidad: 2, acompanamiento_fijo: null, acompanamientos: { 'Papas al vapor': 2 } }
        ]
      }
    ],
    pagos: [
      { id: 'p2', monto: 5000, medio: 'efectivo', pagado_el: '2027-02-02', notas: null, creado_en: '2027-02-02T10:00:00+00:00' },
      { id: 'p1', monto: 10000, medio: 'transferencia', pagado_el: '2027-02-01', notas: 'Abono', creado_en: '2027-02-01T10:00:00+00:00' }
    ]
  })
}

describe('catálogo: filas y datos de la app', () => {
  it('una cabaña va y vuelve sin perder nada', () => {
    const cabana = DEFAULT_CABINS[0]
    const fila = { ...cabinAFila(cabana), id: cabana.id } as Parameters<typeof cabinDeFila>[0]
    expect(fila).toMatchObject({ nombre: 'Cabaña 6', capacidad: 6, precio_noche: 65000, en_mantencion: false, activo: true })
    expect(cabinDeFila(fila)).toEqual(cabana)
  })

  it('un cambio parcial de cabaña solo lleva las columnas que cambian', () => {
    expect(cabinAFila({ enMantencion: true })).toEqual({ en_mantencion: true })
    expect(cabinAFila({ isActive: false, pricePerNight: 70000 })).toEqual({ activo: false, precio_noche: 70000 })
    expect(cabinAFila({ description: undefined })).toEqual({ descripcion: null })
  })

  it('un espacio de camping traduce la modalidad "ambos" a las dos modalidades y de vuelta', () => {
    const sitio = DEFAULT_CAMPING[0]
    expect(sitioAFila(sitio).modalidades).toEqual(['diario', 'pernoctar'])
    expect(sitioAFila({ modality: 'diario' }).modalidades).toEqual(['diario'])
    const fila = { ...sitioAFila(sitio) } as Parameters<typeof sitioDeFila>[0]
    expect(sitioDeFila(fila)).toEqual(sitio)
    expect(sitioDeFila({ ...fila, modalidades: ['pernoctar'] }).modality).toBe('pernoctar')
  })

  it('un plato con acompañamientos a elegir los toma de la tabla de vínculos', () => {
    const plato = DEFAULT_DISHES[0]
    const fila = {
      ...platoAFila(plato),
      plato_acompanamientos: plato.availableSides.map(nombre => ({ acompanamientos: { nombre } }))
    } as Parameters<typeof platoDeFila>[0]
    expect(platoDeFila(fila)).toEqual(plato)
  })

  it('un plato de acompañamiento fijo solo guarda el fijo y los vínculos no cuentan', () => {
    const fijo = DEFAULT_DISHES.find(d => d.sideMode === 'fixed')!
    expect(platoAFila(fijo).acompanamiento_fijo).toBe(fijo.fixedSide)
    // Al pasar a "sin acompañamiento" el fijo se borra
    expect(platoAFila({ sideMode: 'none' }).acompanamiento_fijo).toBeNull()
    const fila = { ...platoAFila(fijo), plato_acompanamientos: [{ acompanamientos: { nombre: 'Papas' } }] } as Parameters<typeof platoDeFila>[0]
    expect(platoDeFila(fila).availableSides).toEqual([])
  })

  it('cada ajuste de la app tiene su clave en la tabla', () => {
    expect(CLAVE_DE_AJUSTE).toEqual({
      contact_info: 'contacto',
      transfer_info: 'transferencia',
      parameters: 'parametros',
      restaurant_schedules: 'horarios_restaurante',
      camping_schedules: 'horarios_camping',
      cabin_schedules: 'horarios_cabana',
      camping_rules: 'reglamento_camping',
      fotos_inicio: 'fotos_inicio'
    })
  })
})

describe('pagos', () => {
  it('un pago va y vuelve', () => {
    const pago = { id: 'p1', amount: 10000, method: 'transferencia' as const, paidOn: '2027-02-01', notes: 'Abono', createdAt: '2027-02-01T10:00:00+00:00' }
    const fila = pagoAFila(pago, 'reserva-1', 'usuario-1')
    expect(fila).toMatchObject({ id: 'p1', reserva_id: 'reserva-1', monto: 10000, medio: 'transferencia', pagado_el: '2027-02-01', registrado_por: 'usuario-1' })
    expect(pagoDeFila({ ...fila, creado_en: pago.createdAt } as Parameters<typeof pagoDeFila>[0])).toEqual(pago)
  })
})

describe('reservas: de la fila a lo que ve la app', () => {
  it('una cabaña recupera su nombre, sus horarios sin segundos y los números como números', () => {
    const r = solicitudDeFila(filaCabana())
    expect(r).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      requestCode: 'SOL-00007',
      type: 'cabana',
      resourceName: 'Cabaña 6',
      status: 'pending',
      guestsCount: 4,
      totalAmount: 154700,
      depositRequired: 46410,
      depositDueAt: '2027-02-08T12:00:00+00:00',
      clientEmail: 'ana@correo.cl'
    })
    expect(r.details).toMatchObject({
      resourceId: ID_CABANA,
      startDate: '2027-02-10',
      endDate: '2027-02-12',
      comments: 'Llegamos tarde',
      schedule: { checkIn: '15:00', checkOut: '11:00' },
      origin: 'cliente'
    })
    expect(r.details?.pricing).toMatchObject({ subtotal: 130000, ivaAmount: 24700, ivaPercentage: 19, depositPercentage: 30, nights: 2 })
    expect(r.details?.isSpecialEvent).toBeUndefined()
  })

  it('un restaurante ordena las comidas, reparte los platos y suma los pagos en orden', () => {
    const r = solicitudDeFila(filaRestaurante())
    expect(r.details?.selectedMealTypes).toEqual(['almuerzo', 'once'])
    expect(r.details?.mealTimes).toEqual({ almuerzo: '13:00', once: '17:30' })
    expect(r.details?.selectedMeals).toEqual([
      { id: ID_PLATO, name: 'Asado', price: 20000, quantity: 2, mealType: 'almuerzo', sides: { 'Papas al vapor': 2 } },
      { id: '', name: 'Once suelta', price: 5000, quantity: 3, mealType: 'once', fixedSide: 'Sopaipillas', sides: {} }
    ])
    expect(r.payments.map(p => p.id)).toEqual(['p1', 'p2'])
    expect(r.details?.clientType).toBe('Institución')
    expect(r.depositRequired).toBe(0)
    expect(r.depositDueAt).toBeUndefined()
    expect(r.details?.isSpecialEvent).toBe(true)
  })

  it('el Booking conserva el grupo y el conflicto', () => {
    const b = bookingDeFila(filaCabana({ grupo_id: 'grupo-1', en_conflicto: true }))
    expect(b).toMatchObject({ groupId: 'grupo-1', inConflict: true, origin: 'cliente' })
  })
})

describe('reservas: de la app a lo que se envía', () => {
  const solicitud = (): ReservationRequest => solicitudDeFila(filaRestaurante())

  it('guardar como administrador lleva todo y deja el código vacío si la reserva es nueva', () => {
    const p = payloadGuardarReserva(solicitud(), { conCodigo: false })
    expect(p).toMatchObject({
      codigo: '',
      origen: 'admin',
      tipo: 'restaurante',
      estado: 'confirmed',
      tipo_cliente: 'Institución',
      cabana_id: null,
      fecha_inicio: '2027-02-10',
      fecha_fin: '2027-02-10',
      personas: 4,
      subtotal: 40000,
      iva_porcentaje: 19,
      total: 47600,
      abono_exigido: 0,
      abono_vence_en: null,
      evento_especial: true
    })
    expect(p.comidas).toEqual([
      { comida: 'almuerzo', hora: '13:00' },
      { comida: 'once', hora: '17:30' }
    ])
    expect(p.items).toEqual([
      { comida: 'almuerzo', plato_id: ID_PLATO, nombre: 'Asado', precio_unitario: 20000, cantidad: 2, acompanamiento_fijo: null, acompanamientos: { 'Papas al vapor': 2 } },
      { comida: 'once', plato_id: null, nombre: 'Once suelta', precio_unitario: 5000, cantidad: 3, acompanamiento_fijo: 'Sopaipillas', acompanamientos: {} }
    ])
    expect(payloadGuardarReserva(solicitud(), { conCodigo: true }).codigo).toBe('ADM-00002')
  })

  it('una reserva guardada y leída de nuevo queda igual (ida y vuelta)', () => {
    const original = solicitud()
    const payload = payloadGuardarReserva(original, { conCodigo: true }) as Record<string, any>
    const fila: FilaReserva = {
      ...filaRestaurante(),
      ...payload,
      reserva_comidas: payload.comidas.map((c: { comida: string }) => ({
        ...c,
        reserva_items: payload.items.filter((i: { comida: string }) => i.comida === c.comida)
      })),
      pagos: [],
      actualizada_en: original.createdAt
    }
    const vuelta = solicitudDeFila(fila)
    expect(vuelta).toEqual({ ...original, payments: [] })
  })

  it('una comida antigua sin hora no rompe el guardado: lleva una hora de respaldo', () => {
    const r = solicitud()
    r.details = { ...r.details, mealTimes: {} }
    const p = payloadGuardarReserva(r, { conCodigo: true }) as { comidas: { comida: string; hora: string }[] }
    expect(p.comidas.map(c => c.hora)).toEqual(['13:00', '17:00'])
  })

  it('enviar como cliente lleva solo lo que elige: ni precios, ni estado, ni código', () => {
    const p = payloadCrearSolicitud(solicitudDeFila(filaCabana()))
    expect(p).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      tipo: 'cabana',
      cliente_nombre: 'Ana Pérez',
      cliente_telefono: '+56 9 1234 5678',
      cliente_correo: 'ana@correo.cl',
      tipo_cliente: null,
      fecha_inicio: '2027-02-10',
      fecha_fin: '2027-02-12',
      personas: 4,
      comentarios: 'Llegamos tarde',
      cabana_id: ID_CABANA,
      sitio_id: null,
      modalidad_camping: null,
      comidas: [],
      items: []
    })
    expect(Object.keys(p).some(k => /total|subtotal|abono|iva|estado|codigo/.test(k))).toBe(false)
  })

  it('la respuesta del servidor manda sobre lo calculado en el navegador', () => {
    const local = { ...solicitudDeFila(filaCabana()), requestCode: 'SOL-LOCAL', status: 'pending' as const, totalAmount: 1, depositRequired: 1, depositDueAt: '2000-01-01T00:00:00Z' }
    const r = solicitudConRespuesta(local, { id: local.id, codigo: 'SOL-00042', estado: 'confirmed', total: 154700, abono_exigido: 0, abono_vence_en: null })
    expect(r).toMatchObject({ requestCode: 'SOL-00042', status: 'confirmed', totalAmount: 154700, depositRequired: 0 })
    expect(r.depositDueAt).toBeUndefined()
    const con = solicitudConRespuesta(local, { id: local.id, codigo: 'SOL-00043', estado: 'pending', total: 10, abono_exigido: 3, abono_vence_en: '2027-02-08T12:00:00+00:00' })
    expect(con.depositDueAt).toBe('2027-02-08T12:00:00+00:00')
  })
})

describe('errores de Supabase en español', () => {
  it('reconoce el código de la base y muestra solo la parte legible', () => {
    expect(codigoDeLaBase('sin_cupo: el camping no tiene cupo')).toBe('sin_cupo')
    expect(codigoDeLaBase('algo_raro: no es de la base')).toBeUndefined()
    const e = traducirError({ code: 'P0001', message: 'fecha_no_disponible: la cabaña ya está reservada en esas fechas' }, 'respaldo')
    expect(e).toBeInstanceOf(ErrorDeAlmacenamiento)
    expect(e.message).toBe('la cabaña ya está reservada en esas fechas')
  })

  it('traduce el cruce de confirmadas, los permisos, las claves foráneas y la falta de red', () => {
    expect(traducirError({ code: '23P01', message: 'conflicting key value violates exclusion constraint' }, 'x').message)
      .toBe('Ya hay una reserva confirmada en esas fechas o cupos.')
    expect(traducirError({ code: '42501', message: 'permission denied for table reservas' }, 'x').message)
      .toContain('No tienes permiso')
    expect(traducirError({ code: '23503', message: 'violates foreign key' }, 'x').message).toContain('No se puede eliminar')
    expect(traducirError(new TypeError('Failed to fetch'), 'x').message).toBe(MENSAJE_SIN_CONEXION)
  })

  it('lo desconocido usa el mensaje de respaldo y nunca expone el texto técnico', () => {
    expect(traducirError({ code: 'XX000', message: 'internal error at line 42' }, 'No se pudo guardar.').message).toBe('No se pudo guardar.')
  })
})
