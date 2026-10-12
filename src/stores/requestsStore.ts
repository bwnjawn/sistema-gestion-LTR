// src/stores/requestsStore.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getStorageItem, setStorageItem } from '../lib/persistence'

export interface ReservationRequest {
 id: string
 requestCode: string
 clientName: string
 clientPhone: string
 clientEmail?: string
 type: 'cabana' | 'camping' | 'restaurante' | 'cabaña' | 'restaurant'
 resourceName: string
 date: string
 timeOrDuration?: string
 guestsCount: number
 totalAmount: number
 depositAmount: number
 status: 'pending' | 'confirmed' | 'rejected'
 createdAt: string
 details?: {
 comments?: string
 selectedMeals?: any[]
 }
}

export const useRequestsStore = defineStore('requests', () => {
 // Carga inicial desde localStorage con clave 'requests' y tipado explícito
 const requests = ref<ReservationRequest[]>(
 getStorageItem('requests', [])
 )

 // Persistencia automática ante cualquier adición o cambio de estado
 watch(
 requests,
 (val) => setStorageItem('requests', val),
 { deep: true }
 )

 function addRequest(newReq: Omit<ReservationRequest, 'id' | 'status' | 'createdAt'>) {
 const req: ReservationRequest = {
 ...newReq,
 id: `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
 status: 'pending',
 createdAt: new Date().toISOString()
 }
 requests.value.unshift(req)
 return req
 }

 function updateRequestStatus(id: string, status: 'pending' | 'confirmed' | 'rejected') {
 const found = requests.value.find(r => r.id === id)
 if (found) {
 found.status = status
 }
 }

 function confirmRequest(id: string) {
 updateRequestStatus(id, 'confirmed')
 }

 function rejectRequest(id: string) {
 updateRequestStatus(id, 'rejected')
 }

 return {
 requests,
 addRequest,
 updateRequestStatus,
 confirmRequest,
 rejectRequest
 }
})  