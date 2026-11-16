// Datos de apoyo de las pruebas de integración.

import { DEFAULT_CABINS } from '../../src/data/seed'
import type { BusinessInfo } from '../../src/types/domain'

export { DEFAULT_CABINS }

/** Valor "por defecto" que se pasa a los repositorios: la prueba comprueba que se lea el valor guardado, no este. */
export const DEFAULT_CONTACT_PLACEHOLDER: BusinessInfo = {
  phone1: 'por-defecto',
  phone2: '',
  email: '',
  websiteDisplay: '',
  websiteUrl: '',
  instagramUser: '',
  instagramUrl: '',
  address: '',
  mapsUrl: '',
  iframeMapUrl: ''
}
