import type { InjectType, ResourceStatus, InjectItem } from '../components/shared/types'

export const normalizeHeader = (name: string): string => {
  return name.toLowerCase().trim().replace(/[\s_-]+/g, '').replace(/[^\w]/g, '')
}

export const mapInjectType = (input: string): InjectType => {
  const normalized = input.toLowerCase().trim()

  // Enhanced mapping for real-world MSE terminology
  if (normalized.includes('person') || normalized.includes('face') || normalized === 'f2f' ||
      normalized === 'ip' || normalized === '1' || normalized.includes('verbal') ||
      normalized.includes('briefing') || normalized.includes('meeting')) return 'in person'

  if (normalized.includes('radio') || normalized.includes('phone') || normalized === 'rp' ||
      normalized === '2' || normalized.includes('uhf') || normalized.includes('vhf') ||
      normalized.includes('comms') || normalized.includes('channel') ||
      normalized.includes('frequency')) return 'radio/phone'

  if (normalized.includes('electronic') || normalized === 'e' || normalized === '3' ||
      normalized.includes('email') || normalized.includes('sms') || normalized.includes('digital') ||
      normalized.includes('system') || normalized.includes('computer')) return 'electronic'

  if (normalized.includes('map') || normalized === 'm' || normalized === '4' ||
      normalized.includes('visual') || normalized.includes('display') ||
      normalized.includes('board') || normalized.includes('chart')) return 'map inject'

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

// Enhanced validation for MSE data quality
export interface MSEValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
}

export const validateMSEData = (injects: InjectItem[]): MSEValidationResult => {
  const warnings: string[] = []
  const errors: string[] = []
  let isValid = true

  // Check for sequential inject numbering
  const numbers = injects.map(inject => inject.number).filter(n => !isNaN(n)).sort((a, b) => a - b)
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] - numbers[i-1] > 1) {
      warnings.push(`Gap in inject numbering between ${numbers[i-1]} and ${numbers[i]}`)
    }
  }

  // Check for duplicated inject numbers
  const numberCounts = new Map()
  injects.forEach(inject => {
    const count = numberCounts.get(inject.number) || 0
    numberCounts.set(inject.number, count + 1)
  })
  numberCounts.forEach((count, number) => {
    if (count > 1) {
      errors.push(`Duplicate inject number: ${number} (appears ${count} times)`)
      isValid = false
    }
  })

  // Check for reasonable time progression
  const times = injects.map(inject => inject.dueSeconds).sort((a, b) => a - b)
  for (let i = 1; i < times.length; i++) {
    if (times[i] === times[i-1]) {
      warnings.push(`Multiple injects scheduled at same time: ${formatTime(times[i])}`)
    }
  }

  // Check for very short intervals (potential data entry errors)
  for (let i = 1; i < times.length; i++) {
    const interval = times[i] - times[i-1]
    if (interval > 0 && interval < 60) { // Less than 1 minute
      warnings.push(`Very short interval (${interval}s) between injects at ${formatTime(times[i-1])} and ${formatTime(times[i])}`)
    }
  }

  // Check for very long exercise duration
  if (times.length > 0) {
    const duration = times[times.length - 1] - times[0]
    if (duration > 8 * 3600) { // More than 8 hours
      warnings.push(`Exercise duration is very long: ${Math.round(duration / 3600)} hours`)
    }
  }

  // Check for missing critical information
  injects.forEach((inject, index) => {
    if (!inject.title || inject.title.trim().length < 5) {
      errors.push(`Inject ${inject.number || index + 1}: Title is too short or missing`)
      isValid = false
    }

    if (!inject.from || inject.from.trim().length === 0) {
      warnings.push(`Inject ${inject.number || index + 1}: Missing 'From' field`)
    }

    if (!inject.to || inject.to.trim().length === 0) {
      warnings.push(`Inject ${inject.number || index + 1}: Missing 'To' field - defaults to 'All Units'`)
    }
  })

  return { isValid, warnings, errors }
}

// Helper function for time formatting in validation
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
