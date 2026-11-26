import type { InjectionKey, Ref } from 'vue'

/** Contenedor de la barra inferior del marco (lo ofrece `MarcoApp`; lo usa `AnclaBarraInferior`). */
export const DESTINO_BARRA_INFERIOR: InjectionKey<Ref<HTMLElement | null>> = Symbol('destinoBarraInferior')
