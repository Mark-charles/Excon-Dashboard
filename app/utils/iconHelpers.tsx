import React from 'react'
import type { InjectType, ResourceItem, ResourceKind, ResourceStatus } from '../components/shared/types'
import { iconMode as defaultIconMode } from './iconConfig'

export type IconMode = 'ascii' | 'svg'
export type IconSize = 'small' | 'medium' | 'large'

const getIconSize = (size: IconSize): number => {
  switch (size) {
    case 'small': return 12
    case 'medium': return 16
    case 'large': return 20
  }
}

const svg = (paths: React.ReactNode, viewBox = '0 0 24 24', size: IconSize = 'medium') => {
  const pixelSize = getIconSize(size)
  return (
    <svg 
      width={pixelSize} 
      height={pixelSize} 
      viewBox={viewBox} 
      fill="currentColor" 
      aria-hidden 
      className="flex-shrink-0"
      style={{ minWidth: pixelSize, minHeight: pixelSize }}
    >
      {paths}
    </svg>
  )
}

export const getInjectTypeGlyph = (type: InjectType, mode: IconMode = defaultIconMode, size: IconSize = 'medium'): React.ReactNode => {
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
      // Simple person silhouette - circle head + body
      return svg(
        <>
          <circle cx="12" cy="8" r="3" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M6 20v-4a6 6 0 0112 0v4" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'radio/phone':
      // Simple radio tower - vertical line + signal waves
      return svg(
        <>
          <path d="M12 3v18" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M8 7l8-4" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M16 7l-8-4" strokeWidth="1.5" stroke="currentColor"/>
          <circle cx="9" cy="9" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="15" cy="9" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'electronic':
      // Simple monitor - rectangle + power indicator
      return svg(
        <>
          <rect x="4" y="5" width="16" height="11" rx="1" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M8 21h8" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M12 16v5" strokeWidth="1.5" stroke="currentColor"/>
          <circle cx="18" cy="7" r="1.5" fill="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'map inject':
      // Simple location pin - teardrop + crosshairs
      return svg(
        <>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="12" cy="9" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M12 7v4" strokeWidth="1" stroke="currentColor"/>
          <path d="M10 9h4" strokeWidth="1" stroke="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    default:
      // Simple alert - triangle + exclamation
      return svg(
        <>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M12 9v4" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M12 17h.01" strokeWidth="1.5" stroke="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
  }
}

export const getResourceStatusGlyph = (status: ResourceStatus, mode: IconMode = defaultIconMode, size: IconSize = 'medium'): React.ReactNode => {
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
      // Simple clock - circle + clock hands
      return svg(
        <>
          <circle cx="12" cy="12" r="9" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M12 7v5l3 3" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'tasked':
      // Simple assignment - clipboard + checkmark
      return svg(
        <>
          <path d="M8 2v4h8V2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M9 12l2 2 4-4" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'enroute':
      // Simple arrow - directional movement
      return svg(
        <>
          <path d="M5 12h14" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M12 5l7 7-7 7" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'arrived':
      // Simple location pin - solid pin shape
      return svg(
        <>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
          <circle cx="12" cy="9" r="2" fill="white"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'cancelled':
      // Simple X - crossed lines
      return svg(
        <>
          <circle cx="12" cy="12" r="9" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M15 9l-6 6" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M9 9l6 6" strokeWidth="1.5" stroke="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    default:
      return svg(
        <circle cx="12" cy="12" r="9" strokeWidth="1.5" stroke="currentColor" fill="none"/>,
        '0 0 24 24',
        size
      )
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

// Simple, professional resource type icons
export const getResourceTypeGlyph = (
  resource: Pick<ResourceItem, 'label' | 'kind'> | ResourceKind | string,
  mode: IconMode = defaultIconMode,
  size: IconSize = 'medium'
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
      // Simple truck silhouette - rectangle + wheels
      return svg(
        <>
          <rect x="4" y="10" width="16" height="6" rx="1" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="8" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="16" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M4 10V8a2 2 0 012-2h4" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <rect x="10" y="8" width="2" height="2" fill="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'ambulance':
      // Simple ambulance - truck + medical cross
      return svg(
        <>
          <rect x="4" y="10" width="16" height="6" rx="1" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="8" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="16" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M4 10V8a2 2 0 012-2h4" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M12 9v2" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M11 10h2" strokeWidth="1.5" stroke="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'helicopter':
      // Simple helicopter - rotor + body
      return svg(
        <>
          <path d="M6 12h12" strokeWidth="1.5" stroke="currentColor"/>
          <rect x="8" y="11" width="8" height="4" rx="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M12 11V8" strokeWidth="1.5" stroke="currentColor"/>
          <circle cx="12" cy="8" r="1" fill="currentColor"/>
          <path d="M12 15v2" strokeWidth="1.5" stroke="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'police':
      // Simple police car - truck + badge
      return svg(
        <>
          <rect x="4" y="10" width="16" height="6" rx="1" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="8" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="16" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M4 10V8a2 2 0 012-2h4" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M12 6l1 2h2l-1 2-1-2-1 2z" fill="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'fire':
      // Simple fire truck - truck + ladder
      return svg(
        <>
          <rect x="4" y="10" width="16" height="6" rx="1" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="8" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="16" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M4 10V8a2 2 0 012-2h4" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M10 6h4" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M12 6v4" strokeWidth="1.5" stroke="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    case 'medical':
      // Simple medical - circle + medical cross
      return svg(
        <>
          <circle cx="12" cy="12" r="9" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M12 8v8" strokeWidth="1.5" stroke="currentColor"/>
          <path d="M8 12h8" strokeWidth="1.5" stroke="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
      
    default:
      // Simple vehicle - generic rectangle + wheels
      return svg(
        <>
          <rect x="4" y="10" width="16" height="6" rx="1" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="8" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="16" cy="18" r="2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <path d="M4 10V8a2 2 0 012-2h4" strokeWidth="1.5" stroke="currentColor" fill="none"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
        </>,
        '0 0 24 24',
        size
      )
  }
}