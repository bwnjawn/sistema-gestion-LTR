// src/services/pricing.ts
// Único lugar donde se calculan precios. Las vistas y el envío de la solicitud
// usan estas funciones, para que el monto que ve el cliente sea el que se guarda.

import type { Cabin, CampingModality, CampingSite, ServiceType } from '../types/domain'
import { nightsBetween } from '../lib/dates'

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
 * Porcentajes que se aplican al subtotal. Son obligatorios (sin valores por defecto)
 * para que siempre se tomen de la configuración del administrador.
 */
export interface PriceRates {
  depositPercentage: number
  ivaPercentage: number
}

function buildBreakdown(subtotal: number, nights: number, rates: PriceRates): PriceBreakdown {
  const ivaAmount = Math.round((subtotal * rates.ivaPercentage) / 100)
  const totalWithIva = subtotal + ivaAmount
  const depositAmount = Math.round((totalWithIva * rates.depositPercentage) / 100)
  return { subtotal, ivaAmount, totalWithIva, depositAmount, nights }
}

/**
 * Tarifa para reserva de Cabaña.
 */
export function calculateCabinPrice(
  cabin: Cabin | undefined | null,
  checkInDate: string,
  checkOutDate: string,
  rates: PriceRates
): PriceBreakdown {
  if (!cabin) {
    throw new Error('[PricingService] No se encontró la cabaña solicitada para calcular la tarifa.')
  }
  const nights = nightsBetween(checkInDate, checkOutDate)
  return buildBreakdown((cabin.pricePerNight || 0) * nights, nights, rates)
}

/**
 * Tarifa para reserva de Camping.
 */
export function calculateCampingPrice(
  site: CampingSite | undefined | null,
  checkInDate: string,
  checkOutDate: string,
  guestsCount: number,
  campingType: CampingModality,
  rates: PriceRates
): PriceBreakdown {
  if (!site) {
    throw new Error('[PricingService] No se encontró el sitio de camping solicitado para calcular la tarifa.')
  }
  const nights = campingType === 'diario' ? 1 : nightsBetween(checkInDate, checkOutDate)
  const subtotal = (site.pricePerPerson || 0) * Math.max(1, guestsCount) * nights
  return buildBreakdown(subtotal, nights, rates)
}

/**
 * Tarifa para orden de Restaurante.
 */
export function calculateRestaurantPrice(
  selectedMeals: SelectedMealItem[],
  rates: PriceRates
): PriceBreakdown {
  const subtotal = selectedMeals.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  return buildBreakdown(subtotal, 1, rates)
}

export interface BookingPriceInput extends PriceRates {
  service: ServiceType
  cabin?: Cabin | null
  campingSite?: CampingSite | null
  checkInDate: string
  checkOutDate: string
  guestsCount: number
  campingType: CampingModality
  meals: SelectedMealItem[]
}

/**
 * Calcula la tarifa según el servicio elegido en el borrador.
 * Devuelve null si falta el recurso (cabaña o sitio de camping): no se inventa un precio.
 */
export function calculateBookingPrice(input: BookingPriceInput): PriceBreakdown | null {
  const rates: PriceRates = {
    depositPercentage: input.depositPercentage,
    ivaPercentage: input.ivaPercentage
  }

  if (input.service === 'cabana') {
    if (!input.cabin) return null
    return calculateCabinPrice(input.cabin, input.checkInDate, input.checkOutDate, rates)
  }

  if (input.service === 'camping') {
    if (!input.campingSite) return null
    return calculateCampingPrice(
      input.campingSite,
      input.checkInDate,
      input.checkOutDate,
      input.guestsCount,
      input.campingType,
      rates
    )
  }

  return calculateRestaurantPrice(input.meals, rates)
}
