// src/lib/repositories/supabase/catalogo.ts
// Catálogo en Supabase: cabañas, espacios de camping, platos y acompañamientos globales. El público ve solo lo
// activo (reglas RLS); el administrador ve todo, también lo dado de baja.

import type { Cabin, CampingSite, Dish } from '../../../types/domain'
import { ErrorNoEncontrado } from '../../errores'
import { supabase } from '../../supabase'
import type { GlobalSideRepository } from '../catalogRepository'
import type { Repositorio } from '../repositorio'
import { datosOLanzar, traducirError } from './errores'
import {
  cabinAFila,
  cabinDeFila,
  platoAFila,
  platoDeFila,
  sitioAFila,
  sitioDeFila,
  type FilaCabana,
  type FilaPlato,
  type FilaSitio
} from './mapeos'

interface OpcionesColeccion<T, F> {
  tabla: string
  entidad: string
  select?: string
  deFila: (fila: F) => T
  aFila: (item: Partial<T>) => Record<string, unknown>
}

/** Una tabla del catálogo como `Repositorio<T>`. */
class ColeccionSupabase<T extends { id: string }, F> implements Repositorio<T> {
  protected readonly o: OpcionesColeccion<T, F>

  constructor(opciones: OpcionesColeccion<T, F>) {
    this.o = opciones
  }

  protected get select() {
    return this.o.select ?? '*'
  }

  async list(): Promise<T[]> {
    const filas = datosOLanzar(
      await supabase().from(this.o.tabla).select(this.select).order('nombre'),
      `No se pudo cargar ${this.o.entidad}.`
    ) as unknown as F[]
    return filas.map(this.o.deFila)
  }

  async getById(id: string): Promise<T | undefined> {
    const fila = datosOLanzar(
      await supabase().from(this.o.tabla).select(this.select).eq('id', id).maybeSingle(),
      `No se pudo cargar ${this.o.entidad}.`
    ) as unknown as F | null
    return fila ? this.o.deFila(fila) : undefined
  }

  async create(item: T): Promise<T> {
    const resultado = await supabase().from(this.o.tabla).insert(this.o.aFila(item)).select('id').single()
    const { id } = datosOLanzar(resultado, `No se pudo guardar ${this.o.entidad}.`) as { id: string }
    return (await this.getById(id)) ?? item
  }

  async update(id: string, cambios: Partial<T>): Promise<T> {
    const fila = this.o.aFila(cambios)
    if (Object.keys(fila).length > 0) {
      const resultado = await supabase().from(this.o.tabla).update(fila).eq('id', id).select('id')
      const filas = datosOLanzar(resultado, `No se pudo guardar ${this.o.entidad}.`) as { id: string }[]
      if (filas.length === 0) throw new ErrorNoEncontrado(this.o.entidad, id)
    }
    const actual = await this.getById(id)
    if (!actual) throw new ErrorNoEncontrado(this.o.entidad, id)
    return actual
  }

  async remove(id: string): Promise<void> {
    const resultado = await supabase().from(this.o.tabla).delete().eq('id', id)
    if (resultado.error) throw traducirError(resultado.error, `No se pudo eliminar ${this.o.entidad}.`)
  }
}

/** Los platos guardan sus acompañamientos disponibles en una tabla aparte (`plato_acompanamientos`). */
class PlatosSupabase extends ColeccionSupabase<Dish, FilaPlato> {
  constructor() {
    super({
      tabla: 'platos',
      entidad: 'el plato',
      select: '*, plato_acompanamientos(acompanamientos(nombre))',
      deFila: platoDeFila,
      aFila: platoAFila
    })
  }

  private async sincronizarLados(platoId: string, nombres: string[]): Promise<void> {
    const unicos = [...new Set(nombres.map(n => n.trim()).filter(Boolean))]
    const db = supabase()
    if (unicos.length > 0) {
      const alta = await db.from('acompanamientos').upsert(unicos.map(nombre => ({ nombre })), { onConflict: 'nombre', ignoreDuplicates: true })
      if (alta.error) throw traducirError(alta.error, 'No se pudieron guardar los acompañamientos.')
    }
    const quitar = await db.from('plato_acompanamientos').delete().eq('plato_id', platoId)
    if (quitar.error) throw traducirError(quitar.error, 'No se pudieron guardar los acompañamientos.')
    if (unicos.length === 0) return
    const ids = datosOLanzar(
      await db.from('acompanamientos').select('id').in('nombre', unicos),
      'No se pudieron guardar los acompañamientos.'
    ) as { id: string }[]
    const vincular = await db.from('plato_acompanamientos').insert(ids.map(a => ({ plato_id: platoId, acompanamiento_id: a.id })))
    if (vincular.error) throw traducirError(vincular.error, 'No se pudieron guardar los acompañamientos.')
  }

  override async create(item: Dish): Promise<Dish> {
    const creado = await super.create(item)
    if (item.availableSides?.length) {
      await this.sincronizarLados(item.id, item.availableSides)
      return (await this.getById(item.id)) ?? creado
    }
    return creado
  }

  override async update(id: string, cambios: Partial<Dish>): Promise<Dish> {
    const actualizado = await super.update(id, cambios)
    if (cambios.availableSides !== undefined) {
      await this.sincronizarLados(id, cambios.availableSides)
      return (await this.getById(id)) ?? actualizado
    }
    return actualizado
  }
}

/** Acompañamientos globales: la lista de nombres activos. Quitar uno lo desactiva (los platos que lo usan lo conservan). */
export class SupabaseGlobalSideRepository implements GlobalSideRepository {
  async list(): Promise<string[]> {
    const filas = datosOLanzar(
      await supabase().from('acompanamientos').select('nombre').eq('activo', true).order('nombre'),
      'No se pudieron cargar los acompañamientos.'
    ) as { nombre: string }[]
    return filas.map(f => f.nombre)
  }

  async add(nombre: string): Promise<string[]> {
    const resultado = await supabase().from('acompanamientos').upsert({ nombre, activo: true }, { onConflict: 'nombre' })
    if (resultado.error) throw traducirError(resultado.error, 'No se pudo agregar el acompañamiento.')
    return this.list()
  }

  async remove(nombre: string): Promise<string[]> {
    const resultado = await supabase().from('acompanamientos').update({ activo: false }).eq('nombre', nombre)
    if (resultado.error) throw traducirError(resultado.error, 'No se pudo quitar el acompañamiento.')
    return this.list()
  }
}

export function crearRepositoriosCatalogoSupabase() {
  return {
    cabins: new ColeccionSupabase<Cabin, FilaCabana>({ tabla: 'cabanas', entidad: 'la cabaña', deFila: cabinDeFila, aFila: cabinAFila }),
    campingSites: new ColeccionSupabase<CampingSite, FilaSitio>({
      tabla: 'sitios_camping',
      entidad: 'el espacio de camping',
      deFila: sitioDeFila,
      aFila: sitioAFila
    }),
    dishes: new PlatosSupabase(),
    globalSides: new SupabaseGlobalSideRepository()
  }
}
