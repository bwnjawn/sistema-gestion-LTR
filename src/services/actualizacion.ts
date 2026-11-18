// src/services/actualizacion.ts
// Texto de "última actualización" del panel del administrador (SCRUM-273). Función pura: recibe el instante de
// la última actualización y el de ahora (en milisegundos).

const SEGUNDOS_PARA_DECIR_AHORA = 45

/** "Actualizado ahora", "Actualizado hace 3 min", "Actualizado hace 2 h" o "Sin actualizar" si nunca se hizo. */
export function textoHaceCuanto(ultimaVez: number | null, ahora: number): string {
  if (ultimaVez === null) return 'Sin actualizar'
  const segundos = Math.max(0, Math.floor((ahora - ultimaVez) / 1000))
  if (segundos < SEGUNDOS_PARA_DECIR_AHORA) return 'Actualizado ahora'
  const minutos = Math.max(1, Math.floor(segundos / 60))
  if (minutos < 60) return `Actualizado hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Actualizado hace ${horas} h`
  return 'Actualizado hace más de un día'
}
