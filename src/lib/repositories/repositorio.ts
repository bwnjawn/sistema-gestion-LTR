// src/lib/repositories/repositorio.ts
// Contrato común de los repositorios por entidad (SCRUM-246). Las vistas nunca los llaman: los usan los
// stores de Pinia. Hoy los implementa el almacenamiento local; con Supabase (SCRUM-248) hay otra
// implementación de las mismas interfaces y los stores no cambian.
//
// Toda operación puede lanzar `ErrorDeAlmacenamiento` (src/lib/errores.ts). Los stores aplican el cambio en
// pantalla, llaman al repositorio y, si falla, lo revierten y muestran el aviso.

export interface Repositorio<T extends { id: string }> {
  list(): Promise<T[]>
  getById(id: string): Promise<T | undefined>
  /** Guarda un elemento nuevo y lo devuelve tal como quedó. */
  create(item: T): Promise<T>
  /** Cambia solo los campos indicados y devuelve el elemento completo. Lanza `ErrorNoEncontrado` si no existe. */
  update(id: string, cambios: Partial<T>): Promise<T>
  remove(id: string): Promise<void>
}
