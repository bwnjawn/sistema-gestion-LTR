/** Punto de color de una fila de disponibilidad: solo el lleno y los que se topan llevan color; el resto, un aro vacío. */
export function puntoDeEstado(estado: string): string {
  if (estado === 'completo') return 'bg-status-danger'
  if (estado === 'sobrecupo') return 'bg-amber-500'
  return 'bg-white border-2 border-gray-400'
}
