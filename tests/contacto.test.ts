import { describe, expect, it } from 'vitest'
import {
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsappUrl,
  hasUsablePhone,
  normalizePhoneDigits
} from '../src/lib/contactLinks'
import { isClientContactValid, isClientPhoneIncomplete } from '../src/services/wizard'

describe('contacto', () => {
  it('normaliza teléfonos chilenos', () => {
    expect(normalizePhoneDigits('+56 9 1234 5678')).toBe('56912345678')
    expect(normalizePhoneDigits('912345678')).toBe('56912345678')
    expect(normalizePhoneDigits('')).toBe('')
  })

  it('solo el prefijo no es un teléfono útil', () => {
    expect(hasUsablePhone('+56 9')).toBe(false)
    expect(hasUsablePhone('+56 9 1234 5678')).toBe(true)
  })

  it('arma los enlaces de llamada, WhatsApp y correo', () => {
    expect(buildTelUrl('+56 9 1234 5678')).toBe('tel:+56912345678')
    expect(buildWhatsappUrl('912345678', 'Hola ñ')).toBe('https://wa.me/56912345678?text=Hola%20%C3%B1')
    expect(buildMailtoUrl(' a@b.cl ')).toBe('mailto:a@b.cl')
    expect(buildMailtoUrl('')).toBe('')
  })

  it('valida el contacto del cliente', () => {
    expect(isClientContactValid('Ana', '+56 9 1234 5678')).toBe(true)
    expect(isClientContactValid('  ', '+56 9 1234 5678')).toBe(false)
    expect(isClientContactValid('Ana', '+56 9')).toBe(false)
    expect(isClientPhoneIncomplete('+56 9 12')).toBe(true)
  })
})
