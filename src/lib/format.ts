export function formatCLP(amount: number): string {
 return new Intl.NumberFormat('es-CL', {
   style: 'currency',
   currency: 'CLP',
   maximumFractionDigits: 0
 }).format(amount)
}

export function formatPhoneClean(phone: string): string {
 return phone.replace(/\s+/g, '')
}