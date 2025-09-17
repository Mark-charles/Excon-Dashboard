import type { InjectStatus, InjectType, ResourceStatus } from '../components/shared/types'

// Enhanced inject status styling with modern emergency colors
export const getInjectStatusColor = (status: InjectStatus): string => {
  switch (status) {
    case 'pending': return 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md border border-gray-400'
    case 'completed': return 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400'
    case 'missed': return 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20 border border-red-400 animate-pulse'
    case 'skipped': return 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20 border border-amber-400'
    default: return 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md border border-gray-400'
  }
}

// Modern inject type colors with professional emergency styling
export const getInjectTypeColor = (type: InjectType): string => {
  switch (type) {
    case 'in person': return 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25'
    case 'radio/phone': return 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/25'
    case 'electronic': return 'bg-gradient-to-r from-violet-600 to-violet-500 shadow-lg shadow-violet-500/25'
    case 'map inject': return 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/25'
    case 'other': return 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-lg shadow-amber-500/25'
    default: return 'bg-gradient-to-r from-gray-600 to-gray-500 shadow-lg shadow-gray-500/25'
  }
}

export const getInjectTypeTextColor = (type: InjectType): string => {
  switch (type) {
    case 'in person': return 'text-blue-400 font-medium'
    case 'radio/phone': return 'text-emerald-400 font-medium'
    case 'electronic': return 'text-violet-400 font-medium'
    case 'map inject': return 'text-red-400 font-medium'
    case 'other': return 'text-amber-400 font-medium'
    default: return 'text-gray-400 font-medium'
  }
}

// Enhanced resource status with professional emergency styling
export const getResourceStatusTextColor = (status: ResourceStatus): string => {
  switch (status) {
    case 'requested': return 'text-gray-300 font-medium'
    case 'tasked': return 'text-amber-300 font-medium'
    case 'enroute': return 'text-blue-300 font-medium'
    case 'arrived': return 'text-emerald-300 font-medium'
    case 'cancelled': return 'text-red-300 font-medium'
    default: return 'text-gray-300 font-medium'
  }
}

export const getResourceStatusColor = (status: ResourceStatus): string => {
  switch (status) {
    case 'requested': return 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md border border-gray-400'
    case 'tasked': return 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20 border border-amber-400'
    case 'enroute': return 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-400'
    case 'arrived': return 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400'
    case 'cancelled': return 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20 border border-red-400'
    default: return 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md border border-gray-400'
  }
}

export const getResourceStatusRingClass = (status: ResourceStatus): string => {
  switch (status) {
    case 'requested': return 'ring-2 ring-gray-400 ring-opacity-60'
    case 'tasked': return 'ring-2 ring-amber-400 ring-opacity-60 animate-pulse'
    case 'enroute': return 'ring-2 ring-blue-400 ring-opacity-60 animate-pulse'
    case 'arrived': return 'ring-2 ring-emerald-400 ring-opacity-80'
    case 'cancelled': return 'ring-2 ring-red-400 ring-opacity-60'
    default: return 'ring-2 ring-gray-400 ring-opacity-60'
  }
}

// New utility functions for enhanced UI
export const getCardShadowClass = (status?: string, isActive = false): string => {
  const base = 'shadow-lg transition-shadow duration-300'
  if (isActive) {
    return `${base} shadow-xl shadow-blue-500/20 ring-1 ring-blue-400`
  }
  if (status === 'critical' || status === 'missed') {
    return `${base} shadow-red-500/10`
  }
  return `${base} shadow-black/10`
}

export const getStatusIndicatorClass = (status: string): string => {
  switch (status) {
    case 'critical':
    case 'missed':
      return 'bg-red-500 animate-pulse'
    case 'warning':
    case 'pending':
      return 'bg-amber-500'
    case 'success':
    case 'completed':
    case 'arrived':
      return 'bg-emerald-500'
    case 'info':
    case 'enroute':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

// Professional emergency management button styles with animations
export const getButtonVariant = (variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary'): string => {
  const base = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-105 active:scale-95'
  
  switch (variant) {
    case 'primary':
      return `${base} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg hover:shadow-blue-500/25`
    case 'secondary':
      return `${base} bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-md hover:shadow-lg`
    case 'danger':
      return `${base} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md hover:shadow-lg hover:shadow-red-500/25`
    case 'success':
      return `${base} bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-md hover:shadow-lg hover:shadow-emerald-500/25`
    default:
      return `${base} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg hover:shadow-blue-500/25`
  }
}

// Animated loading states
export const getLoadingClass = (isLoading: boolean): string => {
  return isLoading ? 'animate-pulse opacity-75' : ''
}

// Status transition animations
export const getStatusTransition = (prevStatus: string, newStatus: string): string => {
  if (prevStatus !== newStatus) {
    return 'animate-in zoom-in duration-300 fill-mode-both'
  }
  return ''
}

// Emergency state animations
export const getEmergencyStateClass = (isEmergency: boolean): string => {
  return isEmergency ? 'animate-pulse ring-2 ring-red-400/60' : ''
}
