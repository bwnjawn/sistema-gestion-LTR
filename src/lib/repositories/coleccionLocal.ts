// src/lib/repositories/coleccionLocal.ts
// Repositorio local genérico: una colección completa guardada bajo una clave. Es la única implementación
// que usa semillas (src/data/seed.ts): mientras no se haya guardado nada, `list()` entrega la semilla.

import { ErrorNoEncontrado } from '../errores'
import type { Almacenamiento } from '../persistence'
import type { Repositorio } from './repositorio'

export interface OpcionesColeccionLocal<T> {
  /** Datos de partida mientras no haya nada guardado. Se copian: nadie modifica la semilla. */
  semilla?: () => T[]
  /** Dónde se inserta un elemento nuevo. Las solicitudes entran primero (la más reciente arriba). */
  insertar?: 'al-final' | 'al-principio'
  /** Nombre de la entidad para los mensajes de error. */
  entidad?: string
}

export class ColeccionLocal<T extends { id: string }> implements Repositorio<T> {
  protected readonly clave: string
  protected readonly almacenamiento: Almacenamiento
  protected readonly opciones: OpcionesColeccionLocal<T>
  protected readonly entidad: string

  constructor(clave: string, almacenamiento: Almacenamiento, opciones: OpcionesColeccionLocal<T> = {}) {
    this.clave = clave
    this.almacenamiento = almacenamiento
    this.opciones = opciones
    this.entidad = opciones.entidad ?? clave
  }

  protected leerTodo(): T[] {
    if (this.almacenamiento.existe(this.clave)) return this.almacenamiento.leer<T[]>(this.clave, [])
    // Se copia pasando por JSON, igual que lo guardado: la semilla nunca se comparte por referencia
    return JSON.parse(JSON.stringify(this.opciones.semilla?.() ?? [])) as T[]
  }

  protected guardarTodo(lista: T[]): void {
    this.almacenamiento.escribir(this.clave, lista)
  }

  async list(): Promise<T[]> {
    return this.leerTodo()
  }

  async getById(id: string): Promise<T | undefined> {
    return this.leerTodo().find(x => x.id === id)
  }

  async create(item: T): Promise<T> {
    const lista = this.leerTodo()
    if (lista.some(x => x.id === item.id)) {
      throw new Error(`Ya existe ${this.entidad} con el id ${item.id}.`)
    }
    if (this.opciones.insertar === 'al-principio') lista.unshift(item)
    else lista.push(item)
    this.guardarTodo(lista)
    return item
  }

  async update(id: string, cambios: Partial<T>): Promise<T> {
    const lista = this.leerTodo()
    const indice = lista.findIndex(x => x.id === id)
    if (indice === -1) throw new ErrorNoEncontrado(this.entidad, id)
    const actualizado = { ...lista[indice], ...cambios, id } as T
    lista[indice] = actualizado
    this.guardarTodo(lista)
    return actualizado
  }

  async remove(id: string): Promise<void> {
    const lista = this.leerTodo()
    const resto = lista.filter(x => x.id !== id)
    if (resto.length !== lista.length) this.guardarTodo(resto)
  }
}
