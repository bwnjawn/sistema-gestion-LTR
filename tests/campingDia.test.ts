import { describe, expect, it } from 'vitest'
import { findCampingSite } from '../src/services/wizard'
import { DEFAULT_CAMPING } from '../src/data/seed'
import type { CampingSite } from '../src/types/domain'

const sitio = (id: string, min: number, max: number, modality: CampingSite['modality'] = 'ambos'): CampingSite => ({
  id, name: id, description: '', pricePerPerson: 10000, minCapacity: min, maxCapacity: max, modality,
  image: '', images: [], features: [], isActive: true
})

describe('espacio de camping por el día (SCRUM-277)', () => {
  const general = sitio('general', 1, 9)
  const grande = sitio('grande', 10, 150)

  it('pernoctando se asigna por capacidad: el que cubre al grupo y es el más ajustado', () => {
    expect(findCampingSite([grande, general], 4, 'pernoctar')?.id).toBe('general')
    expect(findCampingSite([grande, general], 12, 'pernoctar')?.id).toBe('grande')
  })

  it('pernoctando, si ninguno cubre al grupo no se asigna uno cualquiera', () => {
    expect(findCampingSite([sitio('a', 5, 9)], 3, 'pernoctar')).toBeUndefined()
  })

  it('por el día se prefiere el que cubre al grupo, como siempre', () => {
    expect(findCampingSite([grande, general], 4, 'diario')?.id).toBe('general')
    expect(findCampingSite([grande, general], 12, 'diario')?.id).toBe('grande')
  })

  it('por el día sirve cualquier grupo aunque ningún espacio lo cubra: se usa el más grande', () => {
    const huecos = [sitio('a', 5, 9), sitio('b', 20, 40)]
    expect(findCampingSite(huecos, 3, 'diario')?.id).toBe('b')
    expect(findCampingSite(huecos, 15, 'diario')?.id).toBe('b')
  })

  it('por el día solo cuentan los espacios que admiten el día', () => {
    expect(findCampingSite([sitio('noche', 1, 150, 'pernoctar')], 5, 'diario')).toBeUndefined()
    expect(findCampingSite([sitio('noche', 1, 150, 'pernoctar'), sitio('dia', 1, 9, 'diario')], 40, 'diario')?.id).toBe('dia')
  })

  it('con los espacios de ejemplo cualquier grupo de 1 a 150 tiene espacio, de día y de noche', () => {
    for (const n of [1, 9, 10, 150]) {
      expect(findCampingSite(DEFAULT_CAMPING, n, 'diario')).toBeDefined()
      expect(findCampingSite(DEFAULT_CAMPING, n, 'pernoctar')).toBeDefined()
    }
  })
})
