import React from 'react'
import type { InjectType, ResourceItem, ResourceKind, ResourceStatus } from '../components/shared/types'
import { iconMode as defaultIconMode } from './iconConfig'

export type IconMode = 'ascii' | 'svg'

const svg = (paths: React.ReactNode, viewBox = '0 0 24 24') => (
  <svg width="18" height="18" viewBox={viewBox} fill="currentColor" aria-hidden>
    {paths}
  </svg>
)

export const getInjectTypeGlyph = (type: InjectType, mode: IconMode = defaultIconMode): React.ReactNode => {
  if (mode === 'ascii') {
    switch (type) {
      case 'in person': return '[IP]'
      case 'radio/phone': return '[RP]'
      case 'electronic': return '[E]'
      case 'map inject': return '[M]'
      default: return '[O]'
    }
  }
  switch (type) {
    case 'in person':
      return svg(<path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5Z" />)
    case 'radio/phone':
      return svg(<path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.05 11.05 0 003.46.55 1 1 0 011 1v3.25a1 1 0 01-1 1C10.2 21.75 2.25 13.8 2.25 3.75a1 1 0 011-1H6.5a1 1 0 011 1 11.05 11.05 0 00.55 3.46 1 1 0 01-.24 1.02l-2.2 2.2Z" />)
    case 'electronic':
      return svg(<path d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1Zm9 7L4 7h16l-9 5Zm0 2l9-5v9H3V9l9 5Z" />)
    case 'map inject':
      return svg(<path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7Zm0 9.5A2.5 2.5 0 119.5 9 2.5 2.5 0 0112 11.5Z" />)
    default:
      return svg(<circle cx="12" cy="12" r="6" />)
  }
}

export const getResourceStatusGlyph = (status: ResourceStatus, mode: IconMode = defaultIconMode): React.ReactNode => {
  if (mode === 'ascii') {
    switch (status) {
      case 'requested': return '[REQ]'
      case 'tasked': return '[TASK]'
      case 'enroute': return '[ENR]'
      case 'arrived': return '[ARR]'
      case 'cancelled': return '[CXL]'
      default: return '[REQ]'
    }
  }
  switch (status) {
    case 'requested':
      return svg(<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />)
    case 'tasked':
      return svg(<path d="M12 3l10 18H2L12 3Zm0 6v6m0 4h.01" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />)
    case 'enroute':
      return svg(<path d="M4 12h12M12 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />)
    case 'arrived':
      return svg(<><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 12l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>)
    case 'cancelled':
      return svg(<><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>)
    default:
      return svg(<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />)
  }
}

// Heuristic mapping from label to ResourceKind
export const inferResourceKind = (label: string): ResourceKind => {
  const l = label.toLowerCase()
  if (/(fire\s?truck|pumper|engine|fire\b)/.test(l)) return 'fire'
  if (/(ambulance|medic|paramedic|ems)/.test(l)) return 'ambulance'
  if (/(helicopter|helo|air\s?med|airlift|rotor)/.test(l)) return 'helicopter'
  if (/(police|officer|patrol|unit\b)/.test(l)) return 'police'
  if (/(truck|tanker|utility|ute|vehicle)/.test(l)) return 'truck'
  if (/(medical|clinic|doctor|nurse)/.test(l)) return 'medical'
  return 'unknown'
}

// Resource type icons
export const getResourceTypeGlyph = (
  resource: Pick<ResourceItem, 'label' | 'kind'> | ResourceKind | string,
  mode: IconMode = defaultIconMode
): React.ReactNode => {
  const kinds: ReadonlyArray<ResourceKind> = ['truck','ambulance','helicopter','police','fire','medical','other','unknown']
  const isResourceKind = (v: string): v is ResourceKind => (kinds as ReadonlyArray<string>).includes(v)
  if (mode === 'ascii') {
    const k: ResourceKind = typeof resource === 'string'
      ? (isResourceKind(resource) ? resource : inferResourceKind(resource))
      : (resource.kind ?? inferResourceKind(resource.label))
    switch (k) {
      case 'truck': return '[TRK]'
      case 'ambulance': return '[AMB]'
      case 'helicopter': return '[HEL]'
      case 'police': return '[POL]'
      case 'fire': return '[FIR]'
      case 'medical': return '[MED]'
      default: return '[RES]'
    }
  }
  const kind: ResourceKind = typeof resource === 'string'
    ? (isResourceKind(resource) ? resource : inferResourceKind(resource))
    : (resource.kind ?? inferResourceKind(resource.label))

  switch (kind) {
    case 'truck':
      // Simple truck profile
      return svg(<path d="M3 13h9v-3h4l3 3v4h-1a2 2 0 11-4 0H9a2 2 0 11-4 0H3v-4Zm13 0h3l-2-2h-1v2Z" />)
    case 'ambulance':
      // Ambulance with cross
      return svg(<><path d="M3 13h9v-3h4l3 3v4h-1a2 2 0 11-4 0H9a2 2 0 11-4 0H3v-4Zm13 0h3l-2-2h-1v2Z" /><path d="M7 9h2v-2h2v2h2v2h-2v2H9v-2H7V9Z"/></>)
    case 'helicopter':
      // Helicopter side view
      return svg(<><path d="M3 13h8a3 3 0 005.196 2H21v2h-2v1h-2v-1h-3a5 5 0 01-4.472-2.776L3 14v-1Z" /><path d="M2 7h20v2H2z"/></>)
    case 'police':
      // Badge
      return svg(<path d="M12 2l4 2 4-2v8c0 6-8 12-8 12S4 16 4 10V2l4 2 4-2Z" />)
    case 'fire':
      // Flame
      return svg(<path d="M12 2s4 4 4 8-4 6-4 8-4-2-4-6 4-6 4-10Z" />)
    case 'medical':
      // Medical cross
      return svg(<path d="M10 2h4v6h6v4h-6v6h-4v-6H4V8h6V2Z" />)
    default:
      // Generic cube
      return svg(<path d="M4 7l8-5 8 5v10l-8 5-8-5V7Zm8-3l-6 3.5L12 11l6-3.5L12 4Z" />)
  }
}
