import { describe, expect, it } from 'vitest'
import { TAMANO_MAXIMO_PDF, formatearTamano, rutaDeReglamentoCamping, validarPdf } from '../src/services/documentos'

const pdf = (extra: Partial<{ name: string; type: string; size: number }> = {}) => ({
  name: 'reglamento.pdf',
  type: 'application/pdf',
  size: 500_000,
  ...extra
})

describe('documentos que sube el administrador (SCRUM-51)', () => {
  it('acepta un PDF de tamaño normal', () => {
    expect(validarPdf(pdf())).toBeNull()
  })

  it('rechaza lo que no es PDF', () => {
    expect(validarPdf(pdf({ name: 'foto.png', type: 'image/png' }))).toBe('El archivo debe ser un PDF.')
  })

  it('si el navegador no informa el tipo, se mira la extensión', () => {
    expect(validarPdf(pdf({ type: '', name: 'Reglamento.PDF' }))).toBeNull()
    expect(validarPdf(pdf({ type: '', name: 'reglamento.docx' }))).toBeTruthy()
  })

  it('rechaza un archivo vacío o más grande que el máximo', () => {
    expect(validarPdf(pdf({ size: 0 }))).toContain('vacío')
    expect(validarPdf(pdf({ size: TAMANO_MAXIMO_PDF + 1 }))).toContain('máximo')
    expect(validarPdf(pdf({ size: TAMANO_MAXIMO_PDF }))).toBeNull()
  })

  it('el tamaño se escribe legible', () => {
    expect(formatearTamano(850 * 1024)).toBe('850 KB')
    expect(formatearTamano(2.34 * 1024 * 1024)).toBe('2,3 MB')
    expect(formatearTamano(10 * 1024 * 1024)).toBe('10,0 MB')
  })

  it('cada versión del reglamento tiene su propia ruta, sin usar el nombre del archivo', () => {
    expect(rutaDeReglamentoCamping(1000)).toBe('reglamento-camping/1000.pdf')
    expect(rutaDeReglamentoCamping(1000)).not.toBe(rutaDeReglamentoCamping(2000))
  })
})
