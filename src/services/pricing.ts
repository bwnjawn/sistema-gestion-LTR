// src/services/pricing.ts

import type { Cabin, CampingSite } from '../types/domain'
import { calculateNights } from '../lib/format'

export interface PriceBreakdown {
  subtotal: number
  ivaAmount: number
  totalWithIva: number
  depositAmount: number
  nights: number
}

export interface SelectedMealItem {
  id: string
  name: string
  price: number
  quantity: number
  sideSelection?: string
}

/**
 * Tarifa para reserva de Cabaña.
 */
export function calculateCabinPrice(
  cabin: Cabin | undefined | null,
  checkInDate: string,
  checkOutDate: string,
  depositPercentage: number = 30,
  ivaPercentage: number = 19
): PriceBreakdown {
  if (!cabin) {
    throw new Error('[PricingService] No se encontró la cabaña solicitada para calcular la tarifa.')
  }
  const nights = calculateNights(checkInDate, checkOutDate)
  const subtotal = (cabin.pricePerNight || 0) * nights
  const ivaAmount = Math.round((subtotal * ivaPercentage) / 100)
  const totalWithIva = subtotal + ivaAmount
  const depositAmount = Math.round((totalWithIva * depositPercentage) / 100)
  return { subtotal, ivaAmount, totalWithIva, depositAmount, nights }
}

/**
 * Tarifa para reserva de Camping.
 */
export function calculateCampingPrice(
  site: CampingSite | undefined | null,
  checkInDate: string,
  checkOutDate: string,
  guestsCount: number,
  campingType: 'diario' | 'pernoctar' = 'pernoctar',
  depositPercentage: number = 30,
  ivaPercentage: number = 19
): PriceBreakdown {
  if (!site) {
    throw new Error('[PricingService] No se encontró el sitio de camping solicitado para calcular la tarifa.')
  }
  const isDiario = campingType === 'diario'
  const nights = isDiario ? 1 : calculateNights(checkInDate, checkOutDate)
  const subtotal = (site.pricePerPerson || 0) * Math.max(1, guestsCount) * nights
  const ivaAmount = Math.round((subtotal * ivaPercentage) / 100)
  const totalWithIva = subtotal + ivaAmount
  const depositAmount = Math.round((totalWithIva * depositPercentage) / 100)
  return { subtotal, ivaAmount, totalWithIva, depositAmount, nights }
}

/**
 * Tarifa para orden de Restaurante.
 */
export function calculateRestaurantPrice(
  selectedMeals: SelectedMealItem[],
  depositPercentage: number = 30,
  ivaPercentage: number = 19
): PriceBreakdown {
  const subtotal = selectedMeals.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const ivaAmount = Math.round((subtotal * ivaPercentage) / 100)
  const totalWithIva = subtotal + ivaAmount
  const depositAmount = Math.round((totalWithIva * depositPercentage) / 100)
  return { subtotal, ivaAmount, totalWithIva, depositAmount, nights: 1 }
}