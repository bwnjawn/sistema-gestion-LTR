// Cerrar sesión debe funcionar con la red caída (SCRUM-274): solo cierra la sesión de este dispositivo.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { estado, cierre, pedirCliente } = vi.hoisted(() => {
  const estado = { caida: false }
  const cierre = vi.fn().mockResolvedValue({ error: null })
  const pedirCliente = vi.fn(() => ({ auth: { signOut: cierre } }))
  return { estado, cierre, pedirCliente }
})
vi.mock('../src/lib/supabase', () => ({ supabase: pedirCliente }))
vi.mock('../src/lib/red', () => ({ redCaida: () => estado.caida }))

import { SupabaseAuthRepository } from '../src/lib/repositories/supabase/autenticacion'

beforeEach(() => {
  cierre.mockClear()
  pedirCliente.mockClear()
})

describe('SupabaseAuthRepository.cerrarSesion', () => {
  it('con red cierra la sesión también en el servidor', async () => {
    estado.caida = false
    await new SupabaseAuthRepository().cerrarSesion()
    expect(pedirCliente).toHaveBeenCalledWith({ permitirSinInternet: true })
    expect(cierre).toHaveBeenCalledWith(undefined)
  })

  it('con la red caída cierra solo la sesión local, sin pedir nada a la red', async () => {
    estado.caida = true
    await new SupabaseAuthRepository().cerrarSesion()
    expect(pedirCliente).toHaveBeenCalledWith({ permitirSinInternet: true })
    expect(cierre).toHaveBeenCalledWith({ scope: 'local' })
  })
})
