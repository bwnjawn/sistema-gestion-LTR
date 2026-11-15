import { describe, expect, it } from 'vitest'
import { DEFAULT_CABINS, DEFAULT_CAMPING, DEFAULT_DISHES } from '../src/data/seed'
import {
  normalizarCabana,
  normalizarComida,
  normalizarLista,
  normalizarModalidadSitio,
  normalizarPlato,
  normalizarSitio
} from '../src/services/migracionCatalogo'

describe('normalizarComida (SCRUM-245)', () => {
  it('pasa a minúscula el texto libre de antes', () => {
    expect(normalizarComida('Desayuno')).toBe('desayuno')
    expect(normalizarComida(' ONCE ')).toBe('once')
    expect(normalizarComida('almuerzo')).toBe('almuerzo')
  })

  it('lo que no se reconoce queda como almuerzo', () => {
    expect(normalizarComida('cena')).toBe('almuerzo')
    expect(normalizarComida(undefined)).toBe('almuerzo')
  })
})

describe('normalizarModalidadSitio', () => {
  it('acepta solo diario, pernoctar o ambos', () => {
    expect(normalizarModalidadSitio('ambos')).toBe('ambos')
    expect(normalizarModalidadSitio('Diario')).toBe('diario')
    expect(normalizarModalidadSitio('cualquier cosa')).toBe('pernoctar')
  })
})

describe('normalizarPlato', () => {
  const antiguoConOpciones = {
    id: 'p1',
    name: 'Asado',
    price: 20000,
    mealCategory: 'Almuerzo',
    hasSelectableSides: true,
    availableSideDishes: ['Papas', 'Ensalada'],
    mainImage: 'a.jpg'
  }

  it('unifica los campos duplicados y deduce el modo de acompañamiento', () => {
    const p = normalizarPlato(antiguoConOpciones)
    expect(p).toMatchObject({
      mealType: 'almuerzo',
      sideMode: 'choice',
      availableSides: ['Papas', 'Ensalada'],
      image: 'a.jpg',
      isActive: true
    })
    expect(p).not.toHaveProperty('mealCategory')
    expect(p).not.toHaveProperty('hasSelectableSides')
    expect(p).not.toHaveProperty('availableSideDishes')
    expect(p).not.toHaveProperty('mainImage')
  })

  it('un plato con acompañamiento fijo y sin sideMode queda en modo fixed', () => {
    const p = normalizarPlato({ id: 'p2', name: 'Once', price: 1, mealCategory: 'Once', hasSelectableSides: false, fixedSide: 'Kuchen' })
    expect(p.sideMode).toBe('fixed')
    expect(p.fixedSide).toBe('Kuchen')
    expect(p.availableSides).toEqual([])
  })

  it('un plato sin acompañamiento queda en modo none', () => {
    expect(normalizarPlato({ id: 'p3', name: 'Té', price: 1, hasSelectableSides: false }).sideMode).toBe('none')
  })

  it('respeta isActive: false y un sideMode ya definido', () => {
    const p = normalizarPlato({ id: 'p4', name: 'X', price: 1, sideMode: 'none', isActive: false, availableSides: ['sobra'] })
    expect(p.isActive).toBe(false)
    expect(p.sideMode).toBe('none')
    expect(p.availableSides).toEqual([])
  })
})

describe('normalizarCabana', () => {
  it('deja las características como texto y marca la cabaña como activa', () => {
    const c = normalizarCabana({
      id: 'c1',
      name: 'Cabaña 6',
      capacity: 6,
      pricePerNight: 1,
      features: ['Cocina', { text: 'Terraza' }, { name: 'Estufa', icon: 'x' }]
    })
    expect(c.features).toEqual(['Cocina', 'Terraza', 'Estufa'])
    expect(c.isActive).toBe(true)
    expect(c.enMantencion).toBe(false)
  })

  it('completa la galería con la foto principal', () => {
    const c = normalizarCabana({ id: 'c1', name: 'x', capacity: 1, pricePerNight: 1, mainImage: 'a.jpg' })
    expect(c.images).toEqual(['a.jpg'])
  })
})

describe('normalizarSitio', () => {
  it('cierra la modalidad y marca el espacio como activo', () => {
    const s = normalizarSitio({ id: 's1', name: 'x', pricePerPerson: 1, minCapacity: 1, maxCapacity: 9, modality: 'otra' })
    expect(s.modality).toBe('pernoctar')
    expect(s.isActive).toBe(true)
  })
})

describe('normalizarLista', () => {
  it('con los datos semilla actuales no cambia nada (misma referencia)', () => {
    expect(normalizarLista(DEFAULT_CABINS, normalizarCabana)).toBe(DEFAULT_CABINS)
    expect(normalizarLista(DEFAULT_CAMPING, normalizarSitio)).toBe(DEFAULT_CAMPING)
    expect(normalizarLista(DEFAULT_DISHES, normalizarPlato)).toBe(DEFAULT_DISHES)
  })

  it('es idempotente: normalizar dos veces da lo mismo que una', () => {
    const antiguos = [{ id: 'p1', name: 'A', price: 1, mealCategory: 'Once', mainImage: 'a.jpg' }]
    const una = normalizarLista(antiguos, normalizarPlato)
    expect(una).not.toBe(antiguos)
    expect(normalizarLista(una, normalizarPlato)).toBe(una)
  })
})
