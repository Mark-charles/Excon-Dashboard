'use client'

import React, { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'

type InjectType = "in person" | "radio/phone" | "electronic" | "other"
type InjectStatus = "pending" | "completed" | "missed"
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

// Add Resource Form Component  
const AddResourceForm = React.memo<{
  onAddResource: (label: string, minutes: number) => void
}>(({ onAddResource }) => {
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
      <h3 className="text-2xl font-bold text-white mb-4">Add Resource</h3>
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
        <button
          type="submit"
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
        >
          Add Resource
        </button>
      </form>
    </div>
  )
})

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

  // Filter state
  const [showInjects, setShowInjects] = useState(true)
  const [showResources, setShowResources] = useState(true)
  const [showInPerson, setShowInPerson] = useState(true)
  const [showRadioPhone, setShowRadioPhone] = useState(true)
  const [showElectronic, setShowElectronic] = useState(true)
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


  const timeToX = (seconds: number): number => {
    return (seconds / 60) * 20 // 1 minute = 20px
  }

  const getInjectStatusColor = (status: InjectStatus): string => {
    switch (status) {
      case "pending": return "bg-gray-500 text-white"
      case "completed": return "bg-green-500 text-white"
      case "missed": return "bg-red-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }

  const getInjectBorderColor = (status: InjectStatus): string => {
    switch (status) {
      case "pending": return "border-gray-400"
      case "completed": return "border-green-500"
      case "missed": return "border-red-500"
      default: return "border-gray-400"
    }
  }

  const getInjectTypeColor = (type: InjectType): string => {
    switch (type) {
      case "in person": return "bg-blue-500"
      case "radio/phone": return "bg-green-500"
      case "electronic": return "bg-purple-500"
      case "other": return "bg-orange-500"
      default: return "bg-gray-500"
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
    if (normalized.includes('other') || normalized === 'o' || normalized === '4') return 'other'
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

  const getResourceTimelineColor = (status: ResourceStatus): string => {
    switch (status) {
      case "requested": return "bg-gray-500"
      case "tasked": return "bg-amber-500"
      case "enroute": return "bg-blue-600"
      case "arrived": return "bg-green-500"
      case "cancelled": return "bg-red-500"
      default: return "bg-gray-500"
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
  const handleAddInject = (title: string, dueTime: string, type: InjectType, to: string, from: string) => {
    const dueSeconds = parseHMS(dueTime)
    if (dueSeconds !== null && title.trim() && to.trim() && from.trim()) {
      const newInject: InjectItem = {
        id: `i${Date.now()}`,
        number: injects.length + 1, // Auto-increment inject number
        title: title.trim(),
        dueSeconds,
        type,
        status: "pending",
        to: to.trim(),
        from: from.trim()
      }
      setInjects(prev => [...prev, newInject])
    }
  }

  const handleAddResource = (label: string, etaMinutes: number) => {
    if (label.trim() && etaMinutes >= 0) {
      const newResource: ResourceItem = {
        id: `r${Date.now()}`,
        label: label.trim(),
        etaSeconds: currentSeconds + (etaMinutes * 60),
        status: "requested"
      }
      setResources(prev => [...prev, newResource])
    }
  }

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
      setInjects(previewInjects)
    } else {
      // Append mode - check for duplicates
      const existingKeys = new Set(injects.map(i => `${i.title}:${i.dueSeconds}`))
      const newInjects = previewInjects.filter(inject => 
        !existingKeys.has(`${inject.title}:${inject.dueSeconds}`)
      )
      
      setInjects(prev => [...prev, ...newInjects])
      
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
      ['Media inquiry about incident', '00:40:00', 'electronic', 'Media Liaison', 'Dispatch']
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Injects Template')
    XLSX.writeFile(workbook, 'injects_template.csv')
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">To</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">From</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {injects.map((inject) => (
                <tr 
                  key={inject.id} 
                  className={`border-t border-gray-600 ${
                    isCurrentInject(inject) ? 'bg-yellow-900 bg-opacity-30' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-mono text-white font-semibold">
                    #{inject.number}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-white">
                    {formatHMS(inject.dueSeconds)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{inject.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getInjectTypeColor(inject.type)}`}>
                      {inject.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{inject.to || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{inject.from || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getInjectStatusColor(inject.status)}`}>
                      {inject.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleInjectStatus(inject.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                        inject.status === 'completed' 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {inject.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                    </button>
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
                <span className="text-white text-sm">Injects</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showResources}
                  onChange={(e) => setShowResources(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-white text-sm">Resources</span>
              </label>
            </div>
          </div>

          {/* Inject Type Filters */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-white">Inject Type</h4>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInPerson}
                  onChange={(e) => setShowInPerson(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-purple-400 text-sm">In Person</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showRadioPhone}
                  onChange={(e) => setShowRadioPhone(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-blue-400 text-sm">Radio/Phone</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showElectronic}
                  onChange={(e) => setShowElectronic(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-green-400 text-sm">Electronic</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOther}
                  onChange={(e) => setShowOther(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-amber-400 text-sm">Other</span>
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
                <span className="text-gray-400 text-sm">Requested</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showTaskedStatus}
                  onChange={(e) => setShowTaskedStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-amber-400 text-sm">Tasked</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showEnrouteStatus}
                  onChange={(e) => setShowEnrouteStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-blue-400 text-sm">Enroute</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showArrivedStatus}
                  onChange={(e) => setShowArrivedStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-green-400 text-sm">Arrived</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showCancelledStatus}
                  onChange={(e) => setShowCancelledStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-red-400 text-sm">Cancelled</span>
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

    const finishTimeSeconds = exerciseFinishTime && parseHMS(exerciseFinishTime) !== null ? parseHMS(exerciseFinishTime)! : 0
    const maxSeconds = Math.max(
      currentSeconds,
      ...injects.map(i => i.dueSeconds),
      ...resources.map(r => r.etaSeconds),
      finishTimeSeconds,
      3600 // minimum 1 hour
    )
    
    const containerWidth = timeToX(maxSeconds) + 200 // extra padding
    const nowPosition = timeToX(currentSeconds)

    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">Timeline</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-white">In Person</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-white">Radio/Phone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-white">Electronic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
              <span className="text-white">Other</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-white">Resources</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div 
            className="relative bg-gray-900 rounded h-32 border-2 border-gray-600 shadow-lg"
            style={{ width: `${containerWidth}px`, minWidth: '100%' }}
          >
            {/* Now line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
              style={{ left: `${nowPosition}px` }}
            >
              <div className="absolute -top-2 -left-3 w-6 h-4 bg-yellow-400 rounded-sm flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">Now</span>
              </div>
            </div>

            {/* Exercise Finish Time marker */}
            {exerciseFinishTime && parseHMS(exerciseFinishTime) !== null && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                style={{ left: `${timeToX(parseHMS(exerciseFinishTime)!)}px` }}
              >
                <div className="absolute -top-2 -left-4 w-8 h-4 bg-red-400 rounded-sm flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-900">End</span>
                </div>
              </div>
            )}

            {/* Time markers */}
            {Array.from({ length: Math.ceil(maxSeconds / 300) }, (_, i) => i * 300).map(seconds => (
              <div 
                key={seconds}
                className="absolute top-0 bottom-0 w-px bg-gray-600"
                style={{ left: `${timeToX(seconds)}px` }}
              >
                <div className="absolute -bottom-6 -left-8 text-xs text-gray-400 w-16 text-center">
                  {formatHMS(seconds)}
                </div>
              </div>
            ))}

            {/* Inject items */}
            {filteredInjects.map(inject => (
              <div
                key={inject.id}
                className={`absolute w-4 h-4 rounded-full ${getInjectTypeColor(inject.type)} ${getInjectBorderColor(inject.status)} border-2 top-1/2 transform -translate-y-1/2 cursor-pointer`}
                style={{ left: `${timeToX(inject.dueSeconds) - 8}px` }}
                title={`#${inject.number} ${inject.title} - ${formatHMS(inject.dueSeconds)} (${inject.type}) - To: ${inject.to || 'N/A'} From: ${inject.from || 'N/A'} (${inject.status})`}
              />
            ))}

            {/* Resource items */}
            {filteredResources.map(resource => (
              <div
                key={resource.id}
                className={`absolute w-4 h-4 rounded-full ${getResourceTimelineColor(resource.status)} border-2 border-white top-1/2 transform -translate-y-1/2 cursor-pointer`}
                style={{ left: `${timeToX(resource.etaSeconds) - 8}px` }}
                title={`${resource.label} - ETA: ${formatHMS(resource.etaSeconds)} (${resource.status})`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
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
            <AddResourceForm onAddResource={handleAddResourceCallback} />
          </div>
        </div>
        
        {/* Import Modal */}
        <ImportInjectsModal />
      </div>
    </div>
  )
}