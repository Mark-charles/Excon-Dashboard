import type { InjectStatus, InjectType, ResourceStatus } from '../components/shared/types'

export const getInjectStatusColor = (status: InjectStatus): string => {
  switch (status) {
    case 'pending': return 'bg-gray-500 text-white'
    case 'completed': return 'bg-green-500 text-white'
    case 'missed': return 'bg-red-500 text-white'
    case 'skipped': return 'bg-orange-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

export const getInjectTypeColor = (type: InjectType): string => {
  switch (type) {
    case 'in person': return 'bg-blue-500'
    case 'radio/phone': return 'bg-green-500'
    case 'electronic': return 'bg-purple-500'
    case 'map inject': return 'bg-red-500'
    case 'other': return 'bg-orange-500'
    default: return 'bg-gray-500'
  }
}

export const getInjectTypeTextColor = (type: InjectType): string => {
  switch (type) {
    case 'in person': return 'text-blue-400'
    case 'radio/phone': return 'text-green-400'
    case 'electronic': return 'text-purple-400'
    case 'map inject': return 'text-red-400'
    case 'other': return 'text-orange-400'
    default: return 'text-gray-400'
  }
}

export const getResourceStatusTextColor = (status: ResourceStatus): string => {
  switch (status) {
    case 'requested': return 'text-gray-400'
    case 'tasked': return 'text-amber-400'
    case 'enroute': return 'text-blue-400'
    case 'arrived': return 'text-green-400'
    case 'cancelled': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

export const getResourceStatusColor = (status: ResourceStatus): string => {
  switch (status) {
    case 'requested': return 'bg-gray-500 text-white'
    case 'tasked': return 'bg-amber-500 text-white'
    case 'enroute': return 'bg-blue-600 text-white'
    case 'arrived': return 'bg-green-500 text-white'
    case 'cancelled': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

export const getResourceStatusRingClass = (status: ResourceStatus): string => {
  switch (status) {
    case 'requested': return 'ring-gray-400'
    case 'tasked': return 'ring-amber-400'
    case 'enroute': return 'ring-blue-400'
    case 'arrived': return 'ring-green-400'
    case 'cancelled': return 'ring-red-400'
    default: return 'ring-gray-400'
  }
}
