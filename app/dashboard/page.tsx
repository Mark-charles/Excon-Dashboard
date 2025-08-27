'use client'

import React, { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'

type InjectType = "in person" | "radio/phone" | "electronic" | "map inject" | "other"
type InjectStatus = "pending" | "completed" | "missed" | "skipped"
type ResourceStatus = "requested" | "tasked" | "enroute" | "arrived" | "cancelled"

type InjectItem = {
  id: string
  number: number
  title: string
  dueSeconds: number
  type: InjectType
  status: InjectStatus
  to: string
  from: string
}

type ResourceItem = {
  id: string
  label: string
  etaSeconds: number
  status: ResourceStatus
}

const initialInjects: InjectItem[] = []

// Exercise Header Component (moved outside to prevent re-creation)
const ExerciseHeader = React.memo<{
  exerciseName: string
  controllerName: string
  exerciseFinishTime: string
  onExerciseNameChange: (value: string) => void
  onControllerNameChange: (value: string) => void
  onFinishTimeChange: (value: string) => void
}>(({ exerciseName, controllerName, exerciseFinishTime, onExerciseNameChange, onControllerNameChange, onFinishTimeChange }) => {
  const handleExerciseNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onExerciseNameChange(e.target.value)
  }, [onExerciseNameChange])
  
  const handleControllerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onControllerNameChange(e.target.value)
  }, [onControllerNameChange])
  
  const handleFinishTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFinishTimeChange(e.target.value)
  }, [onFinishTimeChange])

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-300 mb-1">Exercise Name</label>
          <input
            type="text"
            value={exerciseName}
            onChange={handleExerciseNameChange}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Enter exercise name"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-300 mb-1">Controller Name</label>
          <input
            type="text"
            value={controllerName}
            onChange={handleControllerNameChange}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Enter controller name"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-300 mb-1">Exercise Finish Time</label>
          <input
            type="text"
            value={exerciseFinishTime}
            onChange={handleFinishTimeChange}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            placeholder="HH:MM:SS"
          />
        </div>
      </div>
    </div>
  )
})
ExerciseHeader.displayName = 'ExerciseHeader'

// Exercise Overview Component - displays exercise name and controller name prominently
const ExerciseOverview = React.memo<{
  exerciseName: string
  controllerName: string
}>(({ exerciseName, controllerName }) => {
  // Only show if at least one field has content
  if (!exerciseName.trim() && !controllerName.trim()) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 mb-6 border-l-4 border-blue-400">
      <div className="text-center">
        {exerciseName.trim() && (
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 tracking-wide">
            {exerciseName}
          </h1>
        )}
        {controllerName.trim() && (
          <div className="text-xl lg:text-2xl text-blue-200 font-semibold">
            Controller: <span className="text-white">{controllerName}</span>
          </div>
        )}
      </div>
    </div>
  )
})
ExerciseOverview.displayName = 'ExerciseOverview'

// Add Inject Form Component
const AddInjectForm = React.memo<{
  onAddInject: (title: string, dueTime: string, type: InjectType, to: string, from: string) => void
  onImportClick: () => void
}>(({ onAddInject, onImportClick }) => {
  const [title, setTitle] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [type, setType] = useState<InjectType>('radio/phone')
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && dueTime.trim() && to.trim() && from.trim()) {
      onAddInject(title, dueTime, type, to, from)
      setTitle('')
      setDueTime('')
      setType('radio/phone')
      setTo('')
      setFrom('')
    }
  }, [title, dueTime, type, to, from, onAddInject])

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white">Add Injects</h3>
        <p className="text-sm text-gray-400">Add single inject or import multiple</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="text"
          placeholder="Due Time (HH:MM:SS)"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono"
          required
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InjectType)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
        >
          <option value="in person">In Person</option>
          <option value="radio/phone">Radio/Phone</option>
          <option value="electronic">Electronic</option>
          <option value="map inject">Map Inject</option>
          <option value="other">Other</option>
        </select>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            required
          />
          <input
            type="text"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            Add Inject
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center justify-center"
            title="Import from CSV/Excel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
})
AddInjectForm.displayName = 'AddInjectForm'

// Add Resource Form Component  
const AddResourceForm = React.memo<{
  onAddResource: (label: string, minutes: number) => void
  onImportClick: () => void
}>(({ onAddResource, onImportClick }) => {
  const [label, setLabel] = useState('')
  const [etaMinutes, setEtaMinutes] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const minutes = parseInt(etaMinutes, 10)
    if (label.trim() && !isNaN(minutes) && minutes >= 0) {
      onAddResource(label, minutes)
      setLabel('')
      setEtaMinutes('')
    }
  }, [label, etaMinutes, onAddResource])

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white">Add Resources</h3>
        <p className="text-sm text-gray-400">Add single resource or import multiple</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Resource Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="number"
          placeholder="ETA (minutes)"
          value={etaMinutes}
          onChange={(e) => setEtaMinutes(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          min="0"
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
          >
            Add Resource
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center justify-center"
            title="Import from CSV/Excel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
})
AddResourceForm.displayName = 'AddResourceForm'

export default function Dashboard() {
  // Exercise info
  const [exerciseName, setExerciseName] = useState("Untitled Exercise")
  const [controllerName, setControllerName] = useState("")
  const [exerciseFinishTime, setExerciseFinishTime] = useState("")
  
  // Stable callback functions for ExerciseHeader
  const handleExerciseNameChange = useCallback((value: string) => {
    setExerciseName(value)
  }, [])
  
  const handleControllerNameChange = useCallback((value: string) => {
    setControllerName(value)
  }, [])
  
  const handleFinishTimeChange = useCallback((value: string) => {
    setExerciseFinishTime(value)
  }, [])
  
  // Stable callback functions for forms
  const handleAddInjectCallback = useCallback((title: string, dueTime: string, type: InjectType, to: string, from: string) => {
    handleAddInject(title, dueTime, type, to, from)
  }, [])
  
  const handleAddResourceCallback = useCallback((label: string, minutes: number) => {
    handleAddResource(label, minutes)
  }, [])
  
  const handleImportClickCallback = useCallback(() => {
    setShowImportModal(true)
  }, [])
  
  const handleResourceImportClickCallback = useCallback(() => {
    setShowResourceImportModal(true)
  }, [])
  
  // Timer and main state
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [injects, setInjects] = useState<InjectItem[]>(initialInjects)
  const [resources, setResources] = useState<ResourceItem[]>([])
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewInjects, setPreviewInjects] = useState<InjectItem[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Resource import modal state
  const [showResourceImportModal, setShowResourceImportModal] = useState(false)
  const [resourceImportMode, setResourceImportMode] = useState<'append' | 'replace'>('append')
  const [resourceImportFile, setResourceImportFile] = useState<File | null>(null)
  const [previewResources, setPreviewResources] = useState<ResourceItem[]>([])
  const [resourceValidationErrors, setResourceValidationErrors] = useState<string[]>([])
  const [isResourceProcessing, setIsResourceProcessing] = useState(false)

  // Inline editing state
  const [editingField, setEditingField] = useState<{id: string, field: string} | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')

  // Filter state
  const [showInjects, setShowInjects] = useState(true)
  const [showResources, setShowResources] = useState(true)
  const [showInPerson, setShowInPerson] = useState(true)
  const [showRadioPhone, setShowRadioPhone] = useState(true)
  const [showElectronic, setShowElectronic] = useState(true)
  const [showMapInject, setShowMapInject] = useState(true)
  const [showOther, setShowOther] = useState(true)
  const [showRequestedStatus, setShowRequestedStatus] = useState(true)
  const [showTaskedStatus, setShowTaskedStatus] = useState(true)
  const [showEnrouteStatus, setShowEnrouteStatus] = useState(true)
  const [showArrivedStatus, setShowArrivedStatus] = useState(true)
  const [showCancelledStatus, setShowCancelledStatus] = useState(true)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (isRunning) {
      intervalId = setInterval(() => {
        setCurrentSeconds(prevSeconds => prevSeconds + 1)
      }, 1000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isRunning])

  // Auto-check for missed injects
  useEffect(() => {
    setInjects(prevInjects => 
      prevInjects.map(inject => 
        inject.status === "pending" && currentSeconds > inject.dueSeconds
          ? { ...inject, status: "missed" as const }
          : inject
      )
    )
  }, [currentSeconds])

  // Auto-check for arrived resources
  useEffect(() => {
    setResources(prevResources => 
      prevResources.map(resource => 
        resource.status === "enroute" && currentSeconds >= resource.etaSeconds
          ? { ...resource, status: "arrived" as const }
          : resource
      )
    )
  }, [currentSeconds])

  // Helper functions
  const formatHMS = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const parseHMS = (input: string): number | null => {
    const regex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/
    const match = input.match(regex)
    
    if (!match) return null
    
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const seconds = parseInt(match[3], 10)
    
    if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
      return null
    }
    
    return hours * 3600 + minutes * 60 + seconds
  }



  const getInjectStatusColor = (status: InjectStatus): string => {
    switch (status) {
      case "pending": return "bg-gray-500 text-white"
      case "completed": return "bg-green-500 text-white"
      case "missed": return "bg-red-500 text-white"
      case "skipped": return "bg-orange-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }


  const getInjectTypeColor = (type: InjectType): string => {
    switch (type) {
      case "in person": return "bg-blue-500"
      case "radio/phone": return "bg-green-500"
      case "electronic": return "bg-purple-500"
      case "map inject": return "bg-red-500"
      case "other": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  const getInjectTypeEmoji = (type: InjectType): string => {
    switch (type) {
      case "in person": return "👤"
      case "radio/phone": return "📞"
      case "electronic": return "💻"
      case "map inject": return "🗺️"
      case "other": return "❓"
      default: return "❓"
    }
  }

  const getInjectTypeTextColor = (type: InjectType): string => {
    switch (type) {
      case "in person": return "text-blue-400"
      case "radio/phone": return "text-green-400"
      case "electronic": return "text-purple-400"
      case "map inject": return "text-red-400"
      case "other": return "text-orange-400"
      default: return "text-gray-400"
    }
  }

  const getResourceStatusEmoji = (status: ResourceStatus): string => {
    switch (status) {
      case "requested": return "❔"
      case "tasked": return "📋"
      case "enroute": return "🚗"
      case "arrived": return "✅"
      case "cancelled": return "❌"
      default: return "❔"
    }
  }

  const getResourceStatusTextColor = (status: ResourceStatus): string => {
    switch (status) {
      case "requested": return "text-gray-400"
      case "tasked": return "text-amber-400"
      case "enroute": return "text-blue-400"
      case "arrived": return "text-green-400"
      case "cancelled": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  const isCurrentInject = (inject: InjectItem): boolean => {
    const timeDiff = Math.abs(currentSeconds - inject.dueSeconds)
    return timeDiff <= 30
  }

  // Import helper functions
  const normalizeHeader = (name: string): string => {
    return name.toLowerCase().trim().replace(/[\s_-]+/g, '').replace(/[^\w]/g, '')
  }

  const mapInjectType = (input: string): InjectType => {
    const normalized = input.toLowerCase().trim()
    if (normalized.includes('person') || normalized === 'ip' || normalized === '1') return 'in person'
    if (normalized.includes('radio') || normalized.includes('phone') || normalized === 'rp' || normalized === '2') return 'radio/phone'
    if (normalized.includes('electronic') || normalized === 'e' || normalized === '3') return 'electronic'
    if (normalized.includes('map') || normalized === 'm' || normalized === '4') return 'map inject'
    if (normalized.includes('other') || normalized === 'o' || normalized === '5') return 'other'
    return 'other' // default
  }

  const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback for older browsers
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }



  // Resource helper functions
  const getResourceStatusColor = (status: ResourceStatus): string => {
    switch (status) {
      case "requested": return "bg-gray-500 text-white"
      case "tasked": return "bg-amber-500 text-white"
      case "enroute": return "bg-blue-600 text-white"
      case "arrived": return "bg-green-500 text-white"
      case "cancelled": return "bg-red-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }


  const isTerminalStatus = (status: ResourceStatus): boolean => {
    return status === "arrived" || status === "cancelled"
  }

  const canTransitionTo = (currentStatus: ResourceStatus, targetStatus: ResourceStatus): boolean => {
    if (isTerminalStatus(currentStatus)) return false
    
    switch (currentStatus) {
      case "requested": return targetStatus === "tasked" || targetStatus === "cancelled"
      case "tasked": return targetStatus === "enroute" || targetStatus === "cancelled"
      case "enroute": return targetStatus === "arrived" || targetStatus === "cancelled"
      default: return false
    }
  }

  // Timer handlers
  const handleStartStop = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setCurrentSeconds(0)
    setIsRunning(false)
  }

  const handleManualTimeSet = (timeInput: string) => {
    const parsedSeconds = parseHMS(timeInput)
    if (parsedSeconds !== null) {
      setCurrentSeconds(parsedSeconds)
    }
  }

  // Inject status handlers
  const handleToggleInjectStatus = (injectId: string) => {
    setInjects(prevInjects => 
      prevInjects.map(inject => 
        inject.id === injectId 
          ? { ...inject, status: inject.status === "completed" ? "pending" as const : "completed" as const }
          : inject
      )
    )
  }

  // Resource handlers
  const handleResourceStatusChange = (resourceId: string, newStatus: ResourceStatus) => {
    setResources(prevResources => 
      prevResources.map(resource => 
        resource.id === resourceId && canTransitionTo(resource.status, newStatus)
          ? { ...resource, status: newStatus }
          : resource
      )
    )
  }

  const handleResourceETAEdit = (resourceId: string, newETATime: string) => {
    const newETASeconds = parseHMS(newETATime)
    if (newETASeconds !== null) {
      setResources(prevResources => 
        prevResources.map(resource => 
          resource.id === resourceId 
            ? { ...resource, etaSeconds: newETASeconds }
            : resource
        )
      )
    }
  }




  // Form handlers
  // Helper function to renumber injects based on due time order
  const renumberInjects = useCallback((injectsList: InjectItem[]): InjectItem[] => {
    return injectsList
      .sort((a, b) => a.dueSeconds - b.dueSeconds)
      .map((inject, index) => ({ ...inject, number: index + 1 }))
  }, [])

  const handleAddInject = useCallback((title: string, dueTime: string, type: InjectType, to: string, from: string) => {
    const dueSeconds = parseHMS(dueTime)
    if (dueSeconds !== null && title.trim() && to.trim() && from.trim()) {
      const newInject: InjectItem = {
        id: `i${Date.now()}`,
        number: 1, // Temporary number, will be renumbered
        title: title.trim(),
        dueSeconds,
        type,
        status: "pending",
        to: to.trim(),
        from: from.trim()
      }
      setInjects(prev => renumberInjects([...prev, newInject]))
    }
  }, [renumberInjects])

  // Inject management functions
  const handleDeleteInject = (id: string) => {
    setInjects(prev => renumberInjects(prev.filter(inject => inject.id !== id)))
  }

  const handleSkipInject = (id: string) => {
    setInjects(prev => 
      prev.map(inject => 
        inject.id === id 
          ? { ...inject, status: "skipped" as const }
          : inject
      )
    )
  }

  const handleMoveInject = (id: string, direction: 'up' | 'down') => {
    setInjects(prev => {
      const sorted = [...prev].sort((a, b) => a.dueSeconds - b.dueSeconds)
      const index = sorted.findIndex(inject => inject.id === id)
      
      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === sorted.length - 1) return prev
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      const targetInject = sorted[newIndex]
      
      // Swap due times to maintain order
      const currentInject = sorted[index]
      const newDueSeconds = targetInject.dueSeconds
      const targetNewDueSeconds = currentInject.dueSeconds
      
      return renumberInjects(prev.map(inject => {
        if (inject.id === id) return { ...inject, dueSeconds: newDueSeconds }
        if (inject.id === targetInject.id) return { ...inject, dueSeconds: targetNewDueSeconds }
        return inject
      }))
    })
  }

  // Inline editing functions
  const handleStartEdit = (id: string, field: string, currentValue: string | number) => {
    setEditingField({ id, field })
    setEditingValue(String(currentValue))
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditingValue('')
  }

  const handleSaveEdit = () => {
    if (!editingField) return

    const { id, field } = editingField
    const value = editingValue.trim()

    setInjects(prev => {
      const updated = prev.map(inject => {
        if (inject.id !== id) return inject

        switch (field) {
          case 'number': {
            const newNumber = parseInt(value)
            if (isNaN(newNumber) || newNumber < 1) return inject
            return { ...inject, number: newNumber }
          }
          case 'dueTime': {
            const dueSeconds = parseHMS(value)
            if (dueSeconds === null) return inject
            return { ...inject, dueSeconds }
          }
          case 'title':
            if (!value) return inject
            return { ...inject, title: value }
          case 'type':
            if (!['in person', 'radio/phone', 'electronic', 'map inject', 'other'].includes(value)) return inject
            return { ...inject, type: value as InjectType }
          case 'to':
            return { ...inject, to: value }
          case 'from':
            return { ...inject, from: value }
          default:
            return inject
        }
      })

      // Re-number based on due time order if time or number was changed
      if (field === 'dueTime') {
        return renumberInjects(updated)
      }
      return updated
    })

    setEditingField(null)
    setEditingValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleAddResource = useCallback((label: string, etaMinutes: number) => {
    if (label.trim() && etaMinutes >= 0) {
      const newResource: ResourceItem = {
        id: `r${Date.now()}`,
        label: label.trim(),
        etaSeconds: currentSeconds + (etaMinutes * 60),
        status: "requested"
      }
      setResources(prev => [...prev, newResource])
    }
  }, [currentSeconds])

  // Import handlers
  const handleFileSelect = async (file: File) => {
    setImportFile(file)
    setIsProcessing(true)
    setValidationErrors([])
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
      
      if (jsonData.length < 2) {
        setValidationErrors(['File must contain at least one header row and one data row'])
        setIsProcessing(false)
        return
      }
      
      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)
      
      // Normalize headers for matching
      const normalizedHeaders = headers.map(h => normalizeHeader(String(h)))
      
      // Find column indices
      const titleIdx = normalizedHeaders.findIndex(h => 
        h.includes('title') || h.includes('name') || h.includes('description')
      )
      const dueTimeIdx = normalizedHeaders.findIndex(h => 
        h.includes('duetime') || h.includes('time') || h.includes('due')
      )
      const typeIdx = normalizedHeaders.findIndex(h => 
        h.includes('type') || h.includes('category')
      )
      const toIdx = normalizedHeaders.findIndex(h => 
        h.includes('to') || h.includes('recipient')
      )
      const fromIdx = normalizedHeaders.findIndex(h => 
        h.includes('from') || h.includes('sender')
      )
      
      if (titleIdx === -1 || dueTimeIdx === -1) {
        setValidationErrors(['Required columns not found. Please ensure you have Title and DueTime columns.'])
        setIsProcessing(false)
        return
      }
      
      // Process rows and validate
      const errors: string[] = []
      const validInjects = [] as InjectItem[]
      
      (dataRows as unknown[][]).forEach((row: unknown[], rowIndex) => {
        const rowNum = rowIndex + 2 // +2 because we start from row 1 and skip header
        
        const title = String(row[titleIdx] || '').trim()
        const dueTimeStr = String(row[dueTimeIdx] || '').trim()
        const typeStr = String(row[typeIdx] || 'other').trim()
        const toStr = String(row[toIdx] || '').trim()
        const fromStr = String(row[fromIdx] || '').trim()
        
        // Validate title
        if (!title) {
          errors.push(`Row ${rowNum}: Title is required`)
          return
        }
        
        // Validate and parse due time
        const dueSeconds = parseHMS(dueTimeStr)
        if (dueSeconds === null) {
          errors.push(`Row ${rowNum}: Invalid time format "${dueTimeStr}". Use HH:MM:SS format.`)
          return
        }
        
        // Parse type
        const type = mapInjectType(typeStr)
        
        validInjects.push({
          id: generateId(),
          number: injects.length + validInjects.length + 1,
          title,
          dueSeconds,
          type,
          status: 'pending',
          to: toStr,
          from: fromStr
        })
      })
      
      setPreviewInjects(validInjects)
      setValidationErrors(errors)
      
    } catch {
      setValidationErrors(['Error reading file. Please ensure it is a valid CSV or Excel file.'])
    }
    
    setIsProcessing(false)
  }

  const handleImport = () => {
    if (validationErrors.length > 0 || previewInjects.length === 0) return
    
    if (importMode === 'replace') {
      setInjects(renumberInjects(previewInjects))
    } else {
      // Append mode - check for duplicates
      const existingKeys = new Set(injects.map(i => `${i.title}:${i.dueSeconds}`))
      const newInjects = previewInjects.filter(inject => 
        !existingKeys.has(`${inject.title}:${inject.dueSeconds}`)
      )
      
      setInjects(prev => renumberInjects([...prev, ...newInjects]))
      
      // Show toast with summary (simplified for now)
      const duplicateCount = previewInjects.length - newInjects.length
      console.log(`Imported ${newInjects.length} inject(s). Skipped ${validationErrors.length} invalid and ${duplicateCount} duplicate row(s).`)
    }
    
    // Reset modal state
    setShowImportModal(false)
    setImportFile(null)
    setPreviewInjects([])
    setValidationErrors([])
    setImportMode('append')
  }

  const downloadTemplate = () => {
    const templateData = [
      ['Title', 'DueTime', 'Type', 'To', 'From'],
      ['Fire reported at Location A', '00:10:00', 'radio/phone', 'Fire Chief', 'Control'],
      ['Evacuation request from Site B', '00:25:00', 'in person', 'Site Manager', 'Emergency Team'],
      ['Media inquiry about incident', '00:40:00', 'electronic', 'Media Liaison', 'Dispatch'],
      ['Update incident map display', '00:50:00', 'map inject', 'GIS Coordinator', 'Operations']
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Injects Template')
    XLSX.writeFile(workbook, 'injects_template.csv')
  }

  // Resource import handlers
  const handleResourceFileSelect = async (file: File) => {
    setResourceImportFile(file)
    setIsResourceProcessing(true)
    setResourceValidationErrors([])
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
      
      if (jsonData.length < 2) {
        setResourceValidationErrors(['File must contain at least one header row and one data row'])
        setIsResourceProcessing(false)
        return
      }
      
      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)
      
      // Normalize headers for matching
      const normalizedHeaders = headers.map(h => normalizeHeader(String(h)))
      
      // Find column indices
      const labelIdx = normalizedHeaders.findIndex(h => 
        h.includes('label') || h.includes('name') || h.includes('resource')
      )
      const etaIdx = normalizedHeaders.findIndex(h => 
        h.includes('eta') || h.includes('minutes') || h.includes('time')
      )
      const statusIdx = normalizedHeaders.findIndex(h => 
        h.includes('status')
      )
      
      if (labelIdx === -1 || etaIdx === -1) {
        setResourceValidationErrors(['Required columns not found. Please ensure you have Label and ETA columns.'])
        setIsResourceProcessing(false)
        return
      }
      
      // Process rows and validate
      const errors: string[] = []
      const validResources = [] as ResourceItem[]
      
      (dataRows as unknown[][]).forEach((row: unknown[], rowIndex) => {
        const rowNum = rowIndex + 2 // +2 because we start from row 1 and skip header
        
        const label = String(row[labelIdx] || '').trim()
        const etaStr = String(row[etaIdx] || '').trim()
        const statusStr = String(row[statusIdx] || 'requested').trim().toLowerCase()
        
        // Validate label
        if (!label) {
          errors.push(`Row ${rowNum}: Label is required`)
          return
        }
        
        // Validate and parse ETA
        const etaMinutes = parseInt(etaStr, 10)
        if (isNaN(etaMinutes) || etaMinutes < 0) {
          errors.push(`Row ${rowNum}: Invalid ETA "${etaStr}". Must be a positive number of minutes.`)
          return
        }
        
        // Parse status
        let status: ResourceStatus = 'requested'
        if (['requested', 'tasked', 'enroute', 'arrived', 'cancelled'].includes(statusStr)) {
          status = statusStr as ResourceStatus
        }
        
        validResources.push({
          id: generateId(),
          label,
          etaSeconds: currentSeconds + (etaMinutes * 60),
          status
        })
      })
      
      setPreviewResources(validResources)
      setResourceValidationErrors(errors)
      
    } catch {
      setResourceValidationErrors(['Error reading file. Please ensure it is a valid CSV or Excel file.'])
    }
    
    setIsResourceProcessing(false)
  }

  const handleResourceImport = () => {
    if (resourceValidationErrors.length > 0 || previewResources.length === 0) return
    
    if (resourceImportMode === 'replace') {
      setResources(previewResources)
    } else {
      // Append mode - check for duplicates
      const existingKeys = new Set(resources.map(r => `${r.label}:${r.etaSeconds}`))
      const newResources = previewResources.filter(resource => 
        !existingKeys.has(`${resource.label}:${resource.etaSeconds}`)
      )
      
      setResources(prev => [...prev, ...newResources])
      
      // Show toast with summary (simplified for now)
      const duplicateCount = previewResources.length - newResources.length
      console.log(`Imported ${newResources.length} resource(s). Skipped ${resourceValidationErrors.length} invalid and ${duplicateCount} duplicate row(s).`)
    }
    
    // Reset modal state
    setShowResourceImportModal(false)
    setResourceImportFile(null)
    setPreviewResources([])
    setResourceValidationErrors([])
    setResourceImportMode('append')
  }

  const downloadResourceTemplate = () => {
    const templateData = [
      ['Label', 'ETA (minutes)', 'Status'],
      ['Fire Engine 1', '15', 'requested'],
      ['Ambulance 2', '20', 'requested'],
      ['Police Unit 3', '10', 'requested'],
      ['Hazmat Team', '45', 'requested']
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resources Template')
    XLSX.writeFile(workbook, 'resources_template.csv')
  }

  // Internal Components

  const TimerControls = () => {
    const [manualTime, setManualTime] = useState('')

    const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (manualTime.trim()) {
        handleManualTimeSet(manualTime.trim())
        setManualTime('')
      }
    }

    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="text-6xl lg:text-8xl font-mono font-bold text-white mb-4 tracking-wider">
            {formatHMS(currentSeconds)}
          </div>
          
          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={handleStartStop}
              className="px-6 py-3 text-xl font-semibold rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {isRunning ? 'Stop' : 'Start'}
            </button>
            
            <button
              onClick={handleReset}
              className="px-6 py-3 text-xl font-semibold rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
            >
              Reset
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2 justify-center">
            <input
              type="text"
              placeholder="HH:MM:SS"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded font-mono text-center w-32"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
            >
              Set
            </button>
          </form>
        </div>
      </div>
    )
  }


  // Editable field component
  const EditableField = ({ 
    inject, 
    field, 
    value, 
    displayValue, 
    isSelect = false, 
    selectOptions = [] 
  }: {
    inject: InjectItem
    field: string
    value: string | number
    displayValue?: string
    isSelect?: boolean
    selectOptions?: string[]
  }) => {
    const isEditing = editingField?.id === inject.id && editingField?.field === field
    
    if (isEditing) {
      if (isSelect) {
        return (
          <select
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyPress}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500"
            autoFocus
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      }
      
      return (
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyPress}
          className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500"
          autoFocus
        />
      )
    }
    
    return (
      <div
        onClick={() => handleStartEdit(inject.id, field, value)}
        className="cursor-pointer hover:bg-gray-700 hover:bg-opacity-50 px-2 py-1 rounded transition-colors"
        title="Click to edit"
      >
        {displayValue || value}
      </div>
    )
  }

  const InjectList = () => {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Inject Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Due Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">From</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">To</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...injects].sort((a, b) => a.dueSeconds - b.dueSeconds).map((inject, sortedIndex) => (
                <tr 
                  key={inject.id} 
                  className={`border-t border-gray-600 ${
                    isCurrentInject(inject) ? 'bg-yellow-900 bg-opacity-30' : ''
                  } ${inject.status === 'skipped' ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3 text-sm font-mono text-white font-semibold">
                    <EditableField
                      inject={inject}
                      field="number"
                      value={inject.number}
                      displayValue={`#${inject.number}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-white">
                    <EditableField
                      inject={inject}
                      field="dueTime"
                      value={formatHMS(inject.dueSeconds)}
                      displayValue={formatHMS(inject.dueSeconds)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    <EditableField
                      inject={inject}
                      field="from"
                      value={inject.from || ''}
                      displayValue={inject.from || '-'}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    <EditableField
                      inject={inject}
                      field="to"
                      value={inject.to || ''}
                      displayValue={inject.to || '-'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {editingField?.id === inject.id && editingField?.field === 'type' ? (
                      <select
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyPress}
                        className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500"
                        autoFocus
                      >
                        <option value="in person">in person</option>
                        <option value="radio/phone">radio/phone</option>
                        <option value="electronic">electronic</option>
                        <option value="map inject">map inject</option>
                        <option value="other">other</option>
                      </select>
                    ) : (
                      <div
                        onClick={() => handleStartEdit(inject.id, 'type', inject.type)}
                        className="cursor-pointer hover:bg-gray-700 hover:bg-opacity-50 px-2 py-1 rounded transition-colors"
                        title="Click to edit"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getInjectTypeColor(inject.type)}`}>
                          {inject.type}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-sm text-white ${inject.status === 'skipped' ? 'line-through' : ''}`}>
                    <EditableField
                      inject={inject}
                      field="title"
                      value={inject.title}
                      displayValue={inject.title}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getInjectStatusColor(inject.status)}`}>
                      {inject.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {/* Move Up/Down */}
                      <button
                        onClick={() => handleMoveInject(inject.id, 'up')}
                        disabled={sortedIndex === 0}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveInject(inject.id, 'down')}
                        disabled={sortedIndex === injects.length - 1}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded"
                        title="Move down"
                      >
                        ↓
                      </button>
                      
                      {/* Complete/Incomplete */}
                      <button
                        onClick={() => handleToggleInjectStatus(inject.id)}
                        disabled={inject.status === 'skipped'}
                        className={`px-2 py-1 text-xs font-semibold rounded transition-colors disabled:opacity-50 ${
                          inject.status === 'completed' 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title={inject.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {inject.status === 'completed' ? '↶' : '✓'}
                      </button>
                      
                      {/* Skip */}
                      <button
                        onClick={() => handleSkipInject(inject.id)}
                        disabled={inject.status === 'skipped' || inject.status === 'completed'}
                        className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded"
                        title="Skip inject"
                      >
                        ⊘
                      </button>
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteInject(inject.id)}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                        title="Delete inject"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ResourceRequestBoard = () => {
    const [editingResource, setEditingResource] = useState<string | null>(null)
    const [editETA, setEditETA] = useState('')

    const handleStartEdit = (resource: ResourceItem) => {
      setEditingResource(resource.id)
      setEditETA(formatHMS(resource.etaSeconds))
    }

    const handleSaveEdit = (resourceId: string) => {
      handleResourceETAEdit(resourceId, editETA)
      setEditingResource(null)
      setEditETA('')
    }

    const handleCancelEdit = () => {
      setEditingResource(null)
      setEditETA('')
    }

    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Resource Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Label</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">ETA</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id} className="border-t border-gray-600">
                  <td className="px-4 py-3 text-sm text-white">{resource.label}</td>
                  <td className="px-4 py-3 text-sm font-mono text-white">
                    {editingResource === resource.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editETA}
                          onChange={(e) => setEditETA(e.target.value)}
                          className="px-2 py-1 bg-gray-700 text-white rounded text-xs font-mono w-20"
                          placeholder="HH:MM:SS"
                        />
                        <button
                          onClick={() => handleSaveEdit(resource.id)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:text-blue-400"
                        onClick={() => handleStartEdit(resource)}
                        title="Click to edit ETA"
                      >
                        {formatHMS(resource.etaSeconds)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getResourceStatusColor(resource.status)}`}>
                      {resource.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {resource.status === "requested" && (
                        <button
                          onClick={() => handleResourceStatusChange(resource.id, "tasked")}
                          className="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded"
                        >
                          Task
                        </button>
                      )}
                      {resource.status === "tasked" && (
                        <button
                          onClick={() => handleResourceStatusChange(resource.id, "enroute")}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          Dispatch
                        </button>
                      )}
                      {resource.status === "enroute" && (
                        <button
                          onClick={() => handleResourceStatusChange(resource.id, "arrived")}
                          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          Arrive
                        </button>
                      )}
                      {!isTerminalStatus(resource.status) && (
                        <button
                          onClick={() => handleResourceStatusChange(resource.id, "cancelled")}
                          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resources.length === 0 && (
            <div className="text-center py-8 text-gray-400">No resources added yet</div>
          )}
        </div>
      </div>
    )
  }

  // Import Modal Components
  const FileDropZone = () => {
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      const file = files.find(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))
      if (file) {
        handleFileSelect(file)
      }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    }

    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-white mb-2">Drag and drop a CSV or Excel file here, or click to browse</p>
        <p className="text-gray-400 text-sm mb-4">Accepts .csv, .xlsx, .xls files</p>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors"
        >
          Choose File
        </label>
      </div>
    )
  }

  const PreviewTable = () => {
    if (previewInjects.length === 0) return null

    const displayItems = previewInjects.slice(0, 50) // Show first 50 rows max

    return (
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-white mb-3">Preview ({previewInjects.length} valid rows)</h4>
        <div className="overflow-x-auto max-h-64 border border-gray-600 rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-white">#</th>
                <th className="px-3 py-2 text-left text-white">Title</th>
                <th className="px-3 py-2 text-left text-white">Due Time</th>
                <th className="px-3 py-2 text-left text-white">Type</th>
                <th className="px-3 py-2 text-left text-white">To</th>
                <th className="px-3 py-2 text-left text-white">From</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((inject, index) => (
                <tr key={index} className="border-t border-gray-600">
                  <td className="px-3 py-2 text-white font-semibold">#{inject.number}</td>
                  <td className="px-3 py-2 text-white">{inject.title}</td>
                  <td className="px-3 py-2 text-white font-mono">{formatHMS(inject.dueSeconds)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs capitalize ${getInjectTypeColor(inject.type)}`}>
                      {inject.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-white">{inject.to || '-'}</td>
                  <td className="px-3 py-2 text-white">{inject.from || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {previewInjects.length > 50 && (
            <div className="p-2 text-center text-gray-400 text-xs border-t border-gray-600">
              ... and {previewInjects.length - 50} more rows
            </div>
          )}
        </div>
      </div>
    )
  }

  const ValidationList = () => {
    if (validationErrors.length === 0) return null

    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold text-red-400 mb-3">Validation Errors ({validationErrors.length})</h4>
        <div className="max-h-32 overflow-y-auto bg-red-900 bg-opacity-20 border border-red-600 rounded p-3">
          {validationErrors.map((error, index) => (
            <div key={index} className="text-red-400 text-sm mb-1">{error}</div>
          ))}
        </div>
      </div>
    )
  }

  const ImportInjectsModal = () => {
    if (!showImportModal) return null

    const canImport = validationErrors.length === 0 && previewInjects.length > 0 && !isProcessing

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Import Injects</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={downloadTemplate}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Download Template
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {!importFile ? (
              <FileDropZone />
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-white mb-2">File: <span className="font-mono text-blue-400">{importFile.name}</span></p>
                  <button
                    onClick={() => {
                      setImportFile(null)
                      setPreviewInjects([])
                      setValidationErrors([])
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Choose Different File
                  </button>
                </div>

                {isProcessing ? (
                  <div className="text-center py-8">
                    <div className="text-white">Processing file...</div>
                  </div>
                ) : (
                  <div>
                    <ValidationList />
                    <PreviewTable />
                  </div>
                )}
              </div>
            )}
          </div>

          {importFile && !isProcessing && (
            <div className="p-6 border-t border-gray-600">
              <div className="mb-4">
                <label className="text-white block mb-2">Import Mode:</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                      className="mr-2"
                    />
                    <span className="text-white">Append (add to existing)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                      className="mr-2"
                    />
                    <span className="text-white">Replace (remove all existing)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!canImport}
                  className={`px-6 py-2 rounded font-semibold transition-colors ${
                    canImport
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Import {previewInjects.length} Inject{previewInjects.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const ImportResourcesModal = () => {
    if (!showResourceImportModal) return null

    const canImport = resourceValidationErrors.length === 0 && previewResources.length > 0 && !isResourceProcessing

    const ResourceFileDropZone = () => {
      const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const droppedFiles = Array.from(e.dataTransfer.files)
        const file = droppedFiles[0]
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
          handleResourceFileSelect(file)
        }
      }

      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
      }

      return (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
        >
          <div className="text-4xl mb-4">📋</div>
          <p className="text-white mb-2">Drop your resource file here, or</p>
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleResourceFileSelect(file)
            }}
            className="hidden"
            id="resourceFileInput"
          />
          <label
            htmlFor="resourceFileInput"
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded cursor-pointer transition-colors"
          >
            Choose File
          </label>
          <p className="text-gray-400 text-sm mt-2">Supports .xlsx and .csv files</p>
        </div>
      )
    }

    const ResourceValidationList = () => {
      if (resourceValidationErrors.length === 0) return null

      return (
        <div className="mb-4">
          <h4 className="text-red-400 font-semibold mb-2">Validation Errors:</h4>
          <ul className="text-red-400 text-sm space-y-1">
            {resourceValidationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    const ResourcePreviewTable = () => {
      if (previewResources.length === 0) return null

      return (
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Preview ({previewResources.length} resources):</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-600 rounded">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-2 text-left text-white border-b border-gray-600">Label</th>
                  <th className="p-2 text-left text-white border-b border-gray-600">ETA</th>
                  <th className="p-2 text-left text-white border-b border-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewResources.slice(0, 10).map((resource, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="p-2 text-white">{resource.label}</td>
                    <td className="p-2 text-white">{Math.max(0, Math.round((resource.etaSeconds - currentSeconds) / 60))} min</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        resource.status === 'requested' ? 'bg-yellow-600 text-yellow-100' :
                        resource.status === 'tasked' ? 'bg-blue-600 text-blue-100' :
                        resource.status === 'enroute' ? 'bg-purple-600 text-purple-100' :
                        resource.status === 'arrived' ? 'bg-green-600 text-green-100' :
                        resource.status === 'cancelled' ? 'bg-red-600 text-red-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {resource.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {previewResources.length > 10 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-gray-400 text-center text-sm">
                      ... and {previewResources.length - 10} more resources
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Import Resources</h3>
              <button
                onClick={() => setShowResourceImportModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={downloadResourceTemplate}
                className="text-purple-400 hover:text-purple-300 text-sm underline"
              >
                Download Template
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {!resourceImportFile ? (
              <ResourceFileDropZone />
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-white mb-2">File: <span className="font-mono text-purple-400">{resourceImportFile.name}</span></p>
                  <button
                    onClick={() => {
                      setResourceImportFile(null)
                      setPreviewResources([])
                      setResourceValidationErrors([])
                    }}
                    className="text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    Choose Different File
                  </button>
                </div>

                {isResourceProcessing ? (
                  <div className="text-center py-8">
                    <div className="text-white">Processing file...</div>
                  </div>
                ) : (
                  <div>
                    <ResourceValidationList />
                    <ResourcePreviewTable />
                  </div>
                )}
              </div>
            )}
          </div>

          {resourceImportFile && !isResourceProcessing && (
            <div className="p-6 border-t border-gray-600">
              <div className="mb-4">
                <label className="text-white block mb-2">Import Mode:</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="resourceImportMode"
                      value="append"
                      checked={resourceImportMode === 'append'}
                      onChange={(e) => setResourceImportMode(e.target.value as 'append' | 'replace')}
                      className="mr-2"
                    />
                    <span className="text-white">Append (add to existing)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="resourceImportMode"
                      value="replace"
                      checked={resourceImportMode === 'replace'}
                      onChange={(e) => setResourceImportMode(e.target.value as 'append' | 'replace')}
                      className="mr-2"
                    />
                    <span className="text-white">Replace (remove all existing)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResourceImportModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResourceImport}
                  disabled={!canImport}
                  className={`px-6 py-2 rounded font-semibold transition-colors ${
                    canImport
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Import {previewResources.length} Resource{previewResources.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const TimelineFilterBar = () => {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-6">
          {/* Type Filters */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-white">Show Types</h4>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInjects}
                  onChange={(e) => setShowInjects(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-white text-sm">📋 Injects</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showResources}
                  onChange={(e) => setShowResources(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-white text-sm">🚛 Resources</span>
              </label>
            </div>
          </div>

          {/* Inject Type Filters */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-white">Inject Type</h4>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInPerson}
                  onChange={(e) => setShowInPerson(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-blue-400 text-sm">👤 In Person</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showRadioPhone}
                  onChange={(e) => setShowRadioPhone(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-green-400 text-sm">📞 Radio/Phone</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showElectronic}
                  onChange={(e) => setShowElectronic(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-purple-400 text-sm">💻 Electronic</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showMapInject}
                  onChange={(e) => setShowMapInject(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-red-400 text-sm">🗺️ Map Inject</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOther}
                  onChange={(e) => setShowOther(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-orange-400 text-sm">❓ Other</span>
              </label>
            </div>
          </div>

          {/* Resource Status Filters */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-white">Resource Status</h4>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showRequestedStatus}
                  onChange={(e) => setShowRequestedStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-400 text-sm">❔ Requested</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showTaskedStatus}
                  onChange={(e) => setShowTaskedStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-amber-400 text-sm">📋 Tasked</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showEnrouteStatus}
                  onChange={(e) => setShowEnrouteStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-blue-400 text-sm">🚗 Enroute</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showArrivedStatus}
                  onChange={(e) => setShowArrivedStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-green-400 text-sm">✅ Arrived</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showCancelledStatus}
                  onChange={(e) => setShowCancelledStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-red-400 text-sm">❌ Cancelled</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const Timeline = () => {
    // Filter items based on current filter state
    const filteredInjects = injects.filter(inject => {
      if (!showInjects) return false
      if (inject.type === 'in person' && !showInPerson) return false
      if (inject.type === 'radio/phone' && !showRadioPhone) return false
      if (inject.type === 'electronic' && !showElectronic) return false
      if (inject.type === 'map inject' && !showMapInject) return false
      if (inject.type === 'other' && !showOther) return false
      return true
    })

    const filteredResources = resources.filter(resource => {
      if (!showResources) return false
      if (resource.status === 'requested' && !showRequestedStatus) return false
      if (resource.status === 'tasked' && !showTaskedStatus) return false
      if (resource.status === 'enroute' && !showEnrouteStatus) return false
      if (resource.status === 'arrived' && !showArrivedStatus) return false
      if (resource.status === 'cancelled' && !showCancelledStatus) return false
      return true
    })

    // Determine the end time based on exercise finish time or fallback to max content time
    const finishTimeSeconds = exerciseFinishTime && parseHMS(exerciseFinishTime) !== null ? parseHMS(exerciseFinishTime)! : 0
    const maxContentSeconds = Math.max(
      ...injects.map(i => i.dueSeconds),
      ...resources.map(r => r.etaSeconds),
      0
    )
    
    // Use exercise finish time if set, otherwise use content max + 30 minutes, minimum 1 hour
    const timelineEndSeconds = finishTimeSeconds > 0 
      ? finishTimeSeconds 
      : Math.max(maxContentSeconds + 1800, 3600) // +30 min buffer, min 1 hour
    
    // Timeline fills full container width (responsive)
    const timelineWidth = 1000 // Wider to accommodate many injects
    const getTimelinePosition = (seconds: number): number => {
      return (seconds / timelineEndSeconds) * (timelineWidth - 32) + 16 // Account for padding
    }
    
    // Get the end position for the red line
    const getEndPosition = (): number => {
      return timelineWidth - 16 // Right edge minus padding
    }

    const nowPosition = getTimelinePosition(currentSeconds)

    // Calculate time intervals for markers - much more granular
    const getTimeIntervals = () => {
      const totalMinutes = timelineEndSeconds / 60
      let intervalMinutes: number
      
      // Much finer granular scaling
      if (totalMinutes <= 15) intervalMinutes = 2 // Every 2 minutes for very short exercises
      else if (totalMinutes <= 30) intervalMinutes = 5 // Every 5 minutes for 30 min exercises
      else if (totalMinutes <= 60) intervalMinutes = 5 // Every 5 minutes for 1 hour exercises
      else if (totalMinutes <= 120) intervalMinutes = 10 // Every 10 minutes for 2 hour exercises  
      else if (totalMinutes <= 240) intervalMinutes = 15 // Every 15 minutes for 4 hour exercises
      else if (totalMinutes <= 480) intervalMinutes = 30 // Every 30 minutes for 8 hour exercises
      else intervalMinutes = 60 // Every hour for very long exercises

      const intervals = []
      for (let minutes = 0; minutes <= totalMinutes; minutes += intervalMinutes) {
        intervals.push(minutes * 60) // Convert back to seconds
      }
      return intervals
    }

    const timeIntervals = getTimeIntervals()

    // Smart inject stacking - group injects that are close together
    const stackInjects = (items: (typeof filteredInjects[0] | typeof filteredResources[0])[]) => {
      const stackedItems: Array<{
        items: (typeof filteredInjects[0] | typeof filteredResources[0])[]
        position: number
        timeSeconds: number
      }> = []
      
      const sortedItems = [...items].sort((a, b) => {
        const aTime = 'dueSeconds' in a ? a.dueSeconds : a.etaSeconds
        const bTime = 'dueSeconds' in b ? b.dueSeconds : b.etaSeconds
        return aTime - bTime
      })

      const STACK_THRESHOLD = timelineWidth * 0.03 // Items within 3% of timeline width get stacked

      sortedItems.forEach(item => {
        const itemTime = 'dueSeconds' in item ? item.dueSeconds : item.etaSeconds
        const itemPosition = getTimelinePosition(itemTime)
        
        // Find existing stack within threshold
        const existingStack = stackedItems.find(stack => 
          Math.abs(stack.position - itemPosition) < STACK_THRESHOLD
        )
        
        if (existingStack) {
          existingStack.items.push(item)
        } else {
          stackedItems.push({
            items: [item],
            position: itemPosition,
            timeSeconds: itemTime
          })
        }
      })

      return stackedItems
    }

    // Combine and stack all items
    const allItems = [...filteredInjects, ...filteredResources]
    const stackedItems = stackInjects(allItems)

    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Timeline</h3>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-blue-400">👤 In Person</span>
            <span className="text-green-400">📞 Radio/Phone</span>
            <span className="text-purple-400">💻 Electronic</span>
            <span className="text-red-400">🗺️ Map Inject</span>
            <span className="text-orange-400">❓ Other</span>
            <span className="text-gray-400">🚛 Resources</span>
          </div>
        </div>
        
        <div className="relative w-full pt-6">
          {/* Main Timeline Bar */}
          <div 
            className="relative bg-gray-900 rounded-lg border-2 border-gray-600 mx-auto"
            style={{ 
              width: `${timelineWidth}px`,
              height: `${Math.max(120, stackedItems.length > 0 ? Math.max(...stackedItems.map(stack => stack.items.length)) * 30 + 80 : 120)}px`
            }}
          >
            {/* Background timeline track */}
            <div className="absolute top-1/2 left-4 right-4 h-2 bg-gray-700 rounded-full transform -translate-y-1/2">
              
              {/* Moving yellow "now" line */}
              <div 
                className="absolute top-1/2 w-1 bg-yellow-400 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg z-20"
                style={{ 
                  left: `${nowPosition}px`,
                  height: `${Math.max(120, stackedItems.length > 0 ? Math.max(...stackedItems.map(stack => stack.items.length)) * 30 + 80 : 120) - 40}px`
                }}
              >
                <div className="absolute -top-10 -left-6 w-12 px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded text-center whitespace-nowrap">
                  NOW
                </div>
              </div>

              {/* Red end line */}
              <div 
                className="absolute top-1/2 w-1 bg-red-500 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg z-10"
                style={{ 
                  left: `${getEndPosition()}px`,
                  height: `${Math.max(120, stackedItems.length > 0 ? Math.max(...stackedItems.map(stack => stack.items.length)) * 30 + 80 : 120) - 40}px`
                }}
              >
                <div className="absolute -top-10 -left-6 w-12 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded text-center whitespace-nowrap">
                  END
                </div>
              </div>

              {/* Stacked Items */}
              {stackedItems.map((stack, stackIndex) => (
                <div key={stackIndex} className="absolute" style={{ left: `${stack.position}px` }}>
                  {stack.items.length === 1 ? (
                    // Single item
                    <div
                      className={`absolute top-1/2 text-xl transform -translate-y-1/2 -translate-x-1/2 cursor-pointer z-15 ${'dueSeconds' in stack.items[0] 
                        ? getInjectTypeTextColor(stack.items[0].type)
                        : getResourceStatusTextColor(stack.items[0].status)}`}
                      title={'dueSeconds' in stack.items[0] 
                        ? `#${stack.items[0].number} ${stack.items[0].title} - ${formatHMS(stack.items[0].dueSeconds)} (${stack.items[0].type}) - To: ${stack.items[0].to || 'N/A'} From: ${stack.items[0].from || 'N/A'} (${stack.items[0].status})`
                        : `${stack.items[0].label} - ETA: ${formatHMS(stack.items[0].etaSeconds)} (${stack.items[0].status})`}
                    >
                      {'dueSeconds' in stack.items[0] 
                        ? getInjectTypeEmoji(stack.items[0].type)
                        : getResourceStatusEmoji(stack.items[0].status)}
                    </div>
                  ) : (
                    // Stacked items
                    <>
                      {stack.items.map((item, itemIndex) => (
                        <div
                          key={'dueSeconds' in item ? item.id : item.id}
                          className={`absolute text-lg transform -translate-x-1/2 cursor-pointer z-15 ${'dueSeconds' in item 
                            ? getInjectTypeTextColor(item.type)
                            : getResourceStatusTextColor(item.status)}`}
                          style={{ 
                            top: `${40 + (itemIndex - stack.items.length / 2) * 28}px`
                          }}
                          title={'dueSeconds' in item 
                            ? `#${item.number} ${item.title} - ${formatHMS(item.dueSeconds)} (${item.type}) - To: ${item.to || 'N/A'} From: ${item.from || 'N/A'} (${item.status})`
                            : `${item.label} - ETA: ${formatHMS(item.etaSeconds)} (${item.status})`}
                        >
                          {'dueSeconds' in item 
                            ? getInjectTypeEmoji(item.type)
                            : getResourceStatusEmoji(item.status)}
                        </div>
                      ))}
                      {/* Stack indicator */}
                      <div className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-400 flex items-center justify-center text-xs font-bold text-white z-5">
                        {stack.items.length}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time markers below timeline */}
          <div className="relative mt-4 mx-auto" style={{ width: `${timelineWidth}px` }}>
            {timeIntervals.map(seconds => (
              <div 
                key={seconds}
                className="absolute text-sm text-gray-400 font-mono transform -translate-x-1/2"
                style={{ left: `${getTimelinePosition(seconds)}px` }}
              >
                {formatHMS(seconds)}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Exercise Overview - displays prominently when fields are filled */}
        <ExerciseOverview 
          exerciseName={exerciseName}
          controllerName={controllerName}
        />
        
        {/* Exercise Header */}
        <ExerciseHeader 
          exerciseName={exerciseName}
          controllerName={controllerName}
          exerciseFinishTime={exerciseFinishTime}
          onExerciseNameChange={handleExerciseNameChange}
          onControllerNameChange={handleControllerNameChange}
          onFinishTimeChange={handleFinishTimeChange}
        />
        
        {/* Main Section: Timer and Resource Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Timer Controls */}
          <TimerControls />
          
          {/* Resource Request Board */}
          <ResourceRequestBoard />
        </div>
        
        {/* Timeline Section - directly under timer */}
        <div className="mb-6">
          <Timeline />
        </div>
        
        {/* Filter Controls - under timeline */}
        <div className="mb-8">
          <TimelineFilterBar />
        </div>
        
        {/* Inject Status Section - Full Width */}
        <div className="border-t-4 border-gray-700 pt-6 mb-6">
          <InjectList />
        </div>
        
        {/* Forms Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Injects Form */}
            <AddInjectForm 
              onAddInject={handleAddInjectCallback} 
              onImportClick={handleImportClickCallback}
            />
            
            {/* Add Resource Form */}
            <AddResourceForm 
              onAddResource={handleAddResourceCallback} 
              onImportClick={handleResourceImportClickCallback}
            />
          </div>
        </div>
        
        {/* Import Modal */}
        <ImportInjectsModal />
        <ImportResourcesModal />
      </div>
    </div>
  )
}