import type { InjectType, ResourceStatus } from '../components/shared/types'

export const normalizeHeader = (name: string): string => {
  return name.toLowerCase().trim().replace(/[\s_-]+/g, '').replace(/[^\w]/g, '')
}

export const mapInjectType = (input: string): InjectType => {
  const normalized = input.toLowerCase().trim()
  if (normalized.includes('person') || normalized === 'ip' || normalized === '1') return 'in person'
  if (normalized.includes('radio') || normalized.includes('phone') || normalized === 'rp' || normalized === '2') return 'radio/phone'
  if (normalized.includes('electronic') || normalized === 'e' || normalized === '3') return 'electronic'
  if (normalized.includes('map') || normalized === 'm' || normalized === '4') return 'map inject'
  if (normalized.includes('other') || normalized === 'o' || normalized === '5') return 'other'
  return 'other' // default
}

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const isTerminalStatus = (status: ResourceStatus): boolean => {
  return status === "arrived" || status === "cancelled"
}

export const canTransitionTo = (currentStatus: ResourceStatus, targetStatus: ResourceStatus): boolean => {
  if (isTerminalStatus(currentStatus)) return false
  
  switch (currentStatus) {
    case "requested": return targetStatus === "tasked" || targetStatus === "cancelled"
    case "tasked": return targetStatus === "enroute" || targetStatus === "cancelled"
    case "enroute": return targetStatus === "arrived" || targetStatus === "cancelled"
    default: return false
  }
}