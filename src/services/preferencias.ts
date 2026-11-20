// src/services/preferencias.ts
// Preferencias de pantalla de cada dispositivo (SCRUM-276). Hoy: el tamaño de la letra del administrador.

export type TamanoLetra = 'normal' | 'grande'

export const TAMANOS_DE_LETRA: readonly TamanoLetra[] = ['normal', 'grande']
export const TAMANO_DE_LETRA_INICIAL: TamanoLetra = 'normal'

/** "Letra grande" agranda toda la interfaz un 12,5 %: 16 px pasan a 18 px y 14 px a 16 px (la escala B que se probó). */
export const ESCALA_LETRA_GRANDE = '112.5%'

/** Cualquier valor guardado que no sea uno de los dos tamaños vuelve al inicial. */
export function normalizarTamanoLetra(valor: unknown): TamanoLetra {
  return TAMANOS_DE_LETRA.find(t => t === valor) ?? TAMANO_DE_LETRA_INICIAL
}

/**
 * Tamaño de letra base de la página (`font-size` de `<html>`). Solo el administrador con sesión puede agrandarla:
 * el cliente siempre ve el tamaño normal. Devuelve '' para dejar el tamaño del navegador.
 */
export function escalaDeLetra(tamano: TamanoLetra, esAdministrador: boolean): string {
  return esAdministrador && tamano === 'grande' ? ESCALA_LETRA_GRANDE : ''
}
