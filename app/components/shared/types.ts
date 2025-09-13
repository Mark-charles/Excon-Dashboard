export type InjectType = "in person" | "radio/phone" | "electronic" | "map inject" | "other"
export type InjectStatus = "pending" | "completed" | "missed" | "skipped"
export type ResourceStatus = "requested" | "tasked" | "enroute" | "arrived" | "cancelled"
export type ResourceKind = "truck" | "ambulance" | "helicopter" | "police" | "fire" | "medical" | "other" | "unknown"

export interface InjectItem {
  id: string
  number: number
  title: string
  dueSeconds: number
  type: InjectType
  status: InjectStatus
  to: string
  from: string
}

export interface ResourceItem {
  id: string
  label: string
  etaSeconds: number
  status: ResourceStatus
  kind?: ResourceKind
}

export interface ExerciseInfo {
  name: string
  controllerName: string
  finishTime: string
}

export interface TimerState {
  currentSeconds: number
  isRunning: boolean
}

export interface FilterState {
  showInjects: boolean
  showResources: boolean
  showInPerson: boolean
  showRadioPhone: boolean
  showElectronic: boolean
  showMapInject: boolean
  showOther: boolean
  showRequestedStatus: boolean
  showTaskedStatus: boolean
  showEnrouteStatus: boolean
  showArrivedStatus: boolean
  showCancelledStatus: boolean
}

export interface ImportModalState {
  showImportModal: boolean
  importMode: 'append' | 'replace'
  importFile: File | null
  previewInjects: InjectItem[]
  validationErrors: string[]
  isProcessing: boolean
}

export interface ResourceImportModalState {
  showResourceImportModal: boolean
  resourceImportMode: 'append' | 'replace'
  resourceImportFile: File | null
  previewResources: ResourceItem[]
  resourceValidationErrors: string[]
  isResourceProcessing: boolean
}

export interface EditingState {
  editingField: {id: string, field: string} | null
  editingValue: string
}

export interface TimelineStack {
  timeSeconds: number
  items: (InjectItem | ResourceItem)[]
}
