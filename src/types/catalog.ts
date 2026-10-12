export interface CabinFeatureObj {
 text?: string
 name?: string
 icon?: string
}

export type CabinFeature = string | CabinFeatureObj

export interface Cabin {
 id: string
 name: string
 capacity: number
 pricePerNight: number
 bedsDescription?: string
 description?: string
 mainImage?: string
 images?: string[]
 features?: CabinFeature[]
}

export interface CampingSite {
 id: string
 name: string
 description?: string
 pricePerPerson: number
 minCapacity: number
 maxCapacity: number
 isSpecial: boolean
 modality: 'diario' | 'pernoctar' | string
 image?: string
 images?: string[]
 features?: string[]
}

export type SideDishMode = 'none' | 'fixed' | 'choice'

export interface Dish {
 id: string
 name: string
 price: number
 description?: string
 mealCategory?: 'Desayuno' | 'Almuerzo' | 'Once' | string
 hasSelectableSides?: boolean
 sideMode?: SideDishMode
 availableSides?: string[]
 availableSideDishes?: string[]
 fixedSide?: string
 image?: string
 mainImage?: string
}

export interface GlobalSideDish {
 id: string
 name: string
}