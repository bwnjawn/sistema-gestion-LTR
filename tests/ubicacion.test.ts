import { describe, expect, it } from 'vitest'
import {
  DIRECCION_POR_DEFECTO,
  UBICACION_POR_DEFECTO,
  coordenadasDeBusqueda,
  coordenadasDeContacto,
  coordenadasValidas,
  direccionParaMostrar,
  enlaceDeMapa,
  mapaIncrustado,
  redondearCoordenadas,
  textoCoordenadas,
  urlDeBusqueda
} from '../src/services/ubicacion'

describe('coordenadas (SCRUM-281)', () => {
  it('valida rangos de latitud y longitud, y rechaza lo que no es un número', () => {
    expect(coordenadasValidas({ lat: -41.06, lng: -73.64 })).toBe(true)
    expect(coordenadasValidas({ lat: 91, lng: 0 })).toBe(false)
    expect(coordenadasValidas({ lat: 0, lng: 181 })).toBe(false)
    expect(coordenadasValidas({ lat: NaN, lng: 0 })).toBe(false)
    expect(coordenadasValidas(null)).toBe(false)
    expect(coordenadasValidas({ lat: -41 })).toBe(false)
  })

  it('redondea a seis decimales', () => {
    expect(redondearCoordenadas({ lat: -41.061637512345, lng: -73.647016987 })).toEqual({ lat: -41.061638, lng: -73.647017 })
  })

  it('el punto por defecto es válido', () => {
    expect(coordenadasValidas(UBICACION_POR_DEFECTO)).toBe(true)
  })

  it('lee las coordenadas del contacto, o null si no se marcó el punto', () => {
    expect(coordenadasDeContacto({ latitude: -41.5, longitude: -73.2 })).toEqual({ lat: -41.5, lng: -73.2 })
    expect(coordenadasDeContacto({})).toBeNull()
    expect(coordenadasDeContacto({ latitude: -41.5 })).toBeNull()
  })

  it('muestra el punto con cinco decimales', () => {
    expect(textoCoordenadas({ lat: -41.0616375, lng: -73.647016 })).toBe('-41.06164, -73.64702')
  })
})

describe('enlaces del mapa', () => {
  const punto = { lat: -41.061638, lng: -73.647017 }

  it('el enlace abre el punto exacto', () => {
    expect(enlaceDeMapa(punto)).toBe('https://www.google.com/maps/search/?api=1&query=-41.061638,-73.647017')
  })

  it('el mapa incrustado se centra en el punto', () => {
    expect(mapaIncrustado(punto)).toBe('https://maps.google.com/maps?q=-41.061638,-73.647017&z=17&output=embed')
  })
})

describe('búsqueda de direcciones', () => {
  it('arma la consulta limitada a Chile y con el texto escapado', () => {
    const url = urlDeBusqueda('  Repil, Fresia  ')
    expect(url).toContain('countrycodes=cl')
    expect(url).toContain('q=Repil%2C%20Fresia')
    expect(url.endsWith('Fresia')).toBe(true)
  })

  it('toma la primera coincidencia y redondea', () => {
    expect(coordenadasDeBusqueda([{ lat: '-41.0616376', lon: '-73.647016' }, { lat: '1', lon: '1' }])).toEqual({ lat: -41.061638, lng: -73.647016 })
  })

  it('devuelve null si no hay coincidencias o la respuesta no sirve', () => {
    expect(coordenadasDeBusqueda([])).toBeNull()
    expect(coordenadasDeBusqueda({ error: 'x' })).toBeNull()
    expect(coordenadasDeBusqueda([{ lat: 'abc', lon: 'def' }])).toBeNull()
    expect(coordenadasDeBusqueda([{}])).toBeNull()
  })
})

describe('referencia de la dirección', () => {
  it('muestra la que escribió el administrador', () => {
    expect(direccionParaMostrar('  Camino a Repil, km 5  ')).toBe('Camino a Repil, km 5')
  })

  it('si la dejó vacía, muestra la de siempre', () => {
    expect(direccionParaMostrar('')).toBe(DIRECCION_POR_DEFECTO)
    expect(direccionParaMostrar('   ')).toBe(DIRECCION_POR_DEFECTO)
    expect(direccionParaMostrar(undefined)).toBe(DIRECCION_POR_DEFECTO)
    expect(DIRECCION_POR_DEFECTO).toContain('Repil')
  })
})
