// Dice si la pantalla es de PC (desde 1024 px, el mismo punto donde Tailwind activa `lg:`).
// Sirve cuando una vista cambia de estructura (por ejemplo, mostrar el detalle del día al lado en vez de
// abrirlo en una hoja); los cambios solo de estilo se hacen con las clases `lg:` y no necesitan esto.
import { onBeforeUnmount, onMounted, ref } from 'vue'

export function usePantallaAncha() {
  const esAncha = ref(typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)
  let consulta: MediaQueryList | null = null
  const alCambiar = (e: MediaQueryListEvent) => { esAncha.value = e.matches }

  onMounted(() => {
    consulta = window.matchMedia('(min-width: 1024px)')
    esAncha.value = consulta.matches
    consulta.addEventListener('change', alCambiar)
  })
  onBeforeUnmount(() => consulta?.removeEventListener('change', alCambiar))

  return { esAncha }
}
