export interface BusinessInfo {
 phone1: string
 phone2: string
 email: string
 websiteDisplay: string
 websiteUrl: string
 instagramUser: string
 instagramUrl: string
 address: string
 mapsUrl: string
 iframeMapUrl: string
}

export interface ServiceSchedule {
 start: string
 end: string
 times?: string[]
}

export interface RestaurantSchedules {
 desayuno: ServiceSchedule
 almuerzo: ServiceSchedule
 once: ServiceSchedule
}

export interface CampingScheduleItem {
 checkIn: string
 checkOut: string
 display: string
}

export interface CampingSchedules {
 diario: CampingScheduleItem
 pernoctar: CampingScheduleItem
}

export interface CabinSchedules {
 checkIn: string
 checkOut: string
 display: string
}

export interface BusinessParameters {
 defaultDepositPercentage: number
 marginPercentage: number
 currentDate: string
 isConnected: boolean
}