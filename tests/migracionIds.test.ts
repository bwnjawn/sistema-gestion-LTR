import { describe, expect, it } from 'vitest'
import { DEFAULT_CABINS, DEFAULT_CAMPING, DEFAULT_DISHES } from '../src/data/catalogoInicial'
import {
  IDS_PLATOS_ANTIGUOS,
  esUUIDValido,
  idPlatoVigente,
  migrarIdsPlatos,
  migrarIdsPlatosElegidos
} from '../src/services/migracionIds'
import { normalizeRequest } from '../src/services/requests'

const ANTIGUO = 'g6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77'
const NUEVO = IDS_PLATOS_ANTIGUOS[ANTIGUO]

describe('id de los datos semilla (SCRUM-247)', () => {
  it('todos los id semilla son UUID válidos', () => {
    const ids = [...DEFAULT_CABINS, ...DEFAULT_CAMPING, ...DEFAULT_DISHES].map(x => x.id)
    const invalidos = ids.filter(id => !esUUIDValido(id))
    expect(invalidos).toEqual([])
  })

  it('no hay id repetidos entre las semillas', () => {
    const ids = [...DEFAULT_CABINS, ...DEFAULT_CAMPING, ...DEFAULT_DISHES].map(x => x.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('los id antiguos no eran UUID y los nuevos sí', () => {
    for (const [antiguo, nuevo] of Object.entries(IDS_PLATOS_ANTIGUOS)) {
      expect(esUUIDValido(antiguo)).toBe(false)
      expect(esUUIDValido(nuevo)).toBe(true)
    }
  })

  it('reconoce UUID de Postgres y rechaza texto que no lo es', () => {
    expect(esUUIDValido(crypto.randomUUID())).toBe(true)
    expect(esUUIDValido('no-es-un-uuid')).toBe(false)
    expect(esUUIDValido('')).toBe(false)
  })
})

describe('migración de id de platos (SCRUM-247)', () => {
  it('idPlatoVigente cambia solo los id antiguos', () => {
    expect(idPlatoVigente(ANTIGUO)).toBe(NUEVO)
    expect(idPlatoVigente('otro-id')).toBe('otro-id')
  })

  it('migra el catálogo guardado sin perder platos ni datos', () => {
    const guardado = [
      { id: ANTIGUO, name: 'Salmón', price: 21000 },
      { id: 'e4fecb99-9c0b-4ef8-bb6d-6bb9bd380a55', name: 'Asado', price: 20000 }
    ]
    const r = migrarIdsPlatos(guardado)
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({ id: NUEVO, name: 'Salmón', price: 21000 })
    expect(r[1]).toBe(guardado[1])
    expect(guardado[0].id).toBe(ANTIGUO) // no modifica la lista original
  })

  it('sin nada que migrar devuelve la misma lista y es idempotente', () => {
    const limpio = [{ id: NUEVO, name: 'Salmón' }]
    expect(migrarIdsPlatos(limpio)).toBe(limpio)
    const una = migrarIdsPlatos([{ id: ANTIGUO, name: 'Salmón' }])
    expect(migrarIdsPlatos(una)).toBe(una)
  })

  it('los platos elegidos en una solicitud siguen apuntando al plato del catálogo', () => {
    const solicitud = normalizeRequest({
      id: 's1',
      type: 'restaurante',
      status: 'pending',
      details: { selectedMeals: [{ id: ANTIGUO, name: 'Salmón', price: 21000, quantity: 3 }] },
      payments: []
    })
    expect(solicitud.details?.selectedMeals?.[0]).toEqual({ id: NUEVO, name: 'Salmón', price: 21000, quantity: 3 })
  })

  it('una solicitud sin platos (cabaña, camping) no se altera', () => {
    const solicitud = normalizeRequest({ id: 's2', type: 'cabana', status: 'pending', details: {}, payments: [] })
    expect(solicitud.details?.selectedMeals).toBeUndefined()
  })

  it('migrarIdsPlatosElegidos acepta una lista ausente', () => {
    expect(migrarIdsPlatosElegidos(undefined)).toBeUndefined()
  })
})
