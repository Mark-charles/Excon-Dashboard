import type { InjectItem, InjectType } from './types'

export function mapInjectType(input: string): InjectType {
  const normalized = input.toLowerCase().trim()
  if (normalized.includes('person') || normalized === 'ip' || normalized === '1') return 'in person'
  if (normalized.includes('radio') || normalized.includes('phone') || normalized === 'rp' || normalized === '2') return 'radio/phone'
  if (normalized.includes('electronic') || normalized === 'e' || normalized === '3') return 'electronic'
  if (normalized.includes('map') || normalized === 'm' || normalized === '4') return 'map inject'
  if (normalized.includes('other') || normalized === 'o' || normalized === '5') return 'other'
  return 'other'
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function renumberInjects(injectsList: InjectItem[]): InjectItem[] {
  return [...injectsList]
    .sort((a, b) => a.dueSeconds - b.dueSeconds)
    .map((inject, index) => ({ ...inject, number: index + 1 }))
}

