// Shared domain types for Excon Dashboard
export type InjectType = "in person" | "radio/phone" | "electronic" | "map inject" | "other"
export type InjectStatus = "pending" | "completed" | "missed" | "skipped"

export type InjectItem = {
  id: string
  number: number
  title: string
  dueSeconds: number
  type: InjectType
  status: InjectStatus
  to: string
  from: string
  acked?: boolean
  audioDataUrl?: string
  audioName?: string
  autoPlayAudio?: boolean
}

export type ResourceStatus = "requested" | "tasked" | "enroute" | "arrived" | "cancelled"
export type ResourceKind = 'person' | 'vehicle' | 'group' | 'air' | 'capability' | 'supply'

export type ResourceItem = {
  id: string
  label: string
  etaSeconds: number
  status: ResourceStatus
  kind?: ResourceKind
  createdAtSeconds?: number
}

export type DashboardState = {
  exerciseName: string
  controllerName: string
  exerciseFinishTime: string
  currentSeconds: number
  injects: InjectItem[]
  resources: ResourceItem[]
}

