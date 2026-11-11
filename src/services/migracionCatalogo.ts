// src/services/migracionCatalogo.ts
// Lleva el catálogo guardado en el navegador al modelo cerrado de SCRUM-245.
// Lo guardado antes tiene campos duplicados (`mainImage` / `image`, `availableSides` / `availableSideDishes`,
// `hasSelectableSides` además de `sideMode`), la comida del plato como texto libre ('Almuerzo') y no tiene
// `isActive`. Cada función devuelve el elemento ya normalizado y es idempotente.

import type { Cabin, CabinFeature, CampingSite, CampingSiteModality, Dish, MealType, SideDishMode } from '../types/domain'

const COMIDAS: readonly MealType[] = ['desayuno', 'almuerzo', 'once']
const MODALIDADES: readonly CampingSiteModality[] = ['diario', 'pernoctar', 'ambos']

/** Texto libre ('Almuerzo', ' once ') → comida válida. Lo que no se reconoce queda como almuerzo. */
export function normalizarComida(valor: unknown): MealType {
  const texto = typeof valor === 'string' ? valor.trim().toLowerCase() : ''
  return COMIDAS.find(c => c === texto) ?? 'almuerzo'
}

/** Texto libre → modalidad válida de un espacio. Lo que no se reconoce queda como `pernoctar`. */
export function normalizarModalidadSitio(valor: unknown): CampingSiteModality {
  const texto = typeof valor === 'string' ? valor.trim().toLowerCase() : ''
  return MODALIDADES.find(m => m === texto) ?? 'pernoctar'
}

/** Una característica antigua (texto u objeto `{ text, name, icon }`) → su texto. */
export function textoCaracteristica(f: CabinFeature | null | undefined): string {
  if (typeof f === 'string') return f.trim()
  return (f?.text || f?.name || '').trim()
}

function textos(lista: unknown): string[] {
  return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []
}

export function normalizarCabana(c: any): Cabin {
  const principal: string = c.mainImage || c.images?.[0] || ''
  return {
    id: c.id,
    name: c.name,
    capacity: c.capacity,
    pricePerNight: c.pricePerNight,
    bedsDescription: c.bedsDescription ?? '',
    description: c.description ?? '',
    mainImage: principal,
    images: Array.isArray(c.images) && c.images.length > 0 ? c.images : principal ? [principal] : [],
    features: (Array.isArray(c.features) ? c.features : []).map(textoCaracteristica).filter(Boolean),
    enMantencion: c.enMantencion === true,
    isActive: c.isActive !== false
  }
}

export function normalizarSitio(s: any): CampingSite {
  const principal: string = s.image || s.images?.[0] || ''
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? '',
    pricePerPerson: s.pricePerPerson,
    minCapacity: s.minCapacity,
    maxCapacity: s.maxCapacity,
    isSpecial: s.isSpecial === true,
    modality: normalizarModalidadSitio(s.modality),
    image: principal,
    images: Array.isArray(s.images) && s.images.length > 0 ? s.images : principal ? [principal] : [],
    features: textos(s.features),
    isActive: s.isActive !== false
  }
}

/** Modo de acompañamiento de un plato antiguo: `sideMode` si existe; si no, se deduce de los campos viejos. */
function modoAcompanamiento(p: any, opciones: string[]): SideDishMode {
  if (p.sideMode === 'none' || p.sideMode === 'fixed' || p.sideMode === 'choice') return p.sideMode
  if (p.hasSelectableSides !== false && opciones.length > 0) return 'choice'
  return p.fixedSide ? 'fixed' : 'none'
}

export function normalizarPlato(p: any): Dish {
  const opciones = textos(p.availableSides).length > 0 ? textos(p.availableSides) : textos(p.availableSideDishes)
  const modo = modoAcompanamiento(p, opciones)
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description ?? '',
    // `mealCategory` es el nombre antiguo del campo
    mealType: normalizarComida(p.mealType ?? p.mealCategory),
    sideMode: modo,
    availableSides: modo === 'choice' ? opciones : [],
    ...(modo === 'fixed' ? { fixedSide: p.fixedSide || '' } : {}),
    image: p.image || p.mainImage || '',
    isActive: p.isActive !== false
  }
}

/**
 * Normaliza una lista guardada. Si ya estaba normalizada devuelve la misma lista (misma referencia),
 * así quien llama sabe si hay que volver a guardar.
 */
export function normalizarLista<T>(lista: T[], normalizar: (x: any) => T): T[] {
  const nueva = lista.map(normalizar)
  return JSON.stringify(nueva) === JSON.stringify(lista) ? lista : nueva
}
