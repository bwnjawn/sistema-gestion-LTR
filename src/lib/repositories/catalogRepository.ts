// src/lib/repositories/catalogRepository.ts

import type { Cabin, CampingSite, Dish } from '../../types/domain'
import { getStorageItem, setStorageItem } from '../persistence'

export interface CatalogRepository {
  getCabins(): Promise<Cabin[]>
  saveCabins(cabins: Cabin[]): Promise<void>
  getCampingSites(): Promise<CampingSite[]>
  saveCampingSites(sites: CampingSite[]): Promise<void>
  getDishes(): Promise<Dish[]>
  saveDishes(dishes: Dish[]): Promise<void>
  getGlobalSideDishes(): Promise<string[]>
  saveGlobalSideDishes(sides: string[]): Promise<void>
}

export class LocalCatalogRepository implements CatalogRepository {
  async getCabins(): Promise<Cabin[]> {
    return getStorageItem('cabins', [])
  }

  async saveCabins(cabins: Cabin[]): Promise<void> {
    setStorageItem('cabins', cabins)
  }

  async getCampingSites(): Promise<CampingSite[]> {
    return getStorageItem('camping_sites', [])
  }

  async saveCampingSites(sites: CampingSite[]): Promise<void> {
    setStorageItem('camping_sites', sites)
  }

  async getDishes(): Promise<Dish[]> {
    return getStorageItem('dishes', [])
  }

  async saveDishes(dishes: Dish[]): Promise<void> {
    setStorageItem('dishes', dishes)
  }

  async getGlobalSideDishes(): Promise<string[]> {
    return getStorageItem('global_side_dishes', [])
  }

  async saveGlobalSideDishes(sides: string[]): Promise<void> {
    setStorageItem('global_side_dishes', sides)
  }
}

export const catalogRepository: CatalogRepository = new LocalCatalogRepository()