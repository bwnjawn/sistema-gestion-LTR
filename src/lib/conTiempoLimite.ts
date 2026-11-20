// src/lib/conTiempoLimite.ts
// Corta una operación que no responde. En el campo la señal a veces no falla: se queda colgada. Pasado el tiempo se
// trata como un error de red, igual que si no hubiera señal. Eso es seguro porque enviar una solicitud es
// idempotente (el id lo genera el cliente): si en verdad llegó, reenviarla no la duplica.

import { ErrorDeAlmacenamiento } from './errores'

export const MENSAJE_SIN_RESPUESTA = 'El servidor no respondió a tiempo. Revisa tu internet e inténtalo de nuevo.'

export function conTiempoLimite<T>(operacion: Promise<T>, milisegundos: number): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const reloj = setTimeout(() => rechazar(new ErrorDeAlmacenamiento('red', MENSAJE_SIN_RESPUESTA)), milisegundos)
    operacion.then(
      valor => {
        clearTimeout(reloj)
        resolver(valor)
      },
      error => {
        clearTimeout(reloj)
        rechazar(error)
      }
    )
  })
}
