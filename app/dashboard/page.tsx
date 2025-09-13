'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { InjectItem, ResourceItem, FilterState } from '../components/shared/types'
import { parseHMS } from '../utils/timeUtils'
import { generateId, canTransitionTo } from '../utils/validation'
import { logWarn, logger } from '../utils/loggingUtils'

// Import extracted components
import ExerciseHeader from '../components/exercise/ExerciseHeader'
import ExerciseOverview from '../components/exercise/ExerciseOverview'
import TimerControls from '../components/dashboard/TimerControls'
import ResourceRequestBoard from '../components/dashboard/ResourceRequestBoard'
import Timeline from '../components/timeline/Timeline'
import TimelineFilterBar from '../components/timeline/TimelineFilterBar'
import InjectList from '../components/dashboard/InjectList'
import AddInjectForm from '../components/forms/AddInjectForm'
import AddResourceForm from '../components/forms/AddResourceForm'
import ImportInjectsModal from '../components/modals/ImportInjectsModal'
import ImportResourcesModal from '../components/modals/ImportResourcesModal'

const initialInjects: InjectItem[] = []

export default function Dashboard() {
  // Exercise info
  const [exerciseName, setExerciseName] = useState("Untitled Exercise")
  const [controllerName, setControllerName] = useState("")
  const [exerciseFinishTime, setExerciseFinishTime] = useState("")
  
  // Timer and main state
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [injects, setInjects] = useState<InjectItem[]>(initialInjects)
  const [resources, setResources] = useState<ResourceItem[]>([])
  // Persistence / restore state
  const [pendingRestore, setPendingRestore] = useState<null | {
    exerciseName: string
    controllerName: string
    exerciseFinishTime: string
    currentSeconds: number
    injects: InjectItem[]
    resources: ResourceItem[]
  }>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [showResourceImportModal, setShowResourceImportModal] = useState(false)

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    showInjects: true,
    showResources: true,
    showInPerson: true,
    showRadioPhone: true,
    showElectronic: true,
    showMapInject: true,
    showOther: true,
    showRequestedStatus: true,
    showTaskedStatus: true,
    showEnrouteStatus: true,
    showArrivedStatus: true,
    showCancelledStatus: true
  })

  // Exercise header handlers
  const handleExerciseNameChange = useCallback((value: string) => {
    setExerciseName(value)
  }, [])
  
  const handleControllerNameChange = useCallback((value: string) => {
    setControllerName(value)
  }, [])
  
  const handleFinishTimeChange = useCallback((value: string) => {
    setExerciseFinishTime(value)
  }, [])

  // Timer effects
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

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

  // Persistence: save session to localStorage
  useEffect(() => {
    try {
      const snapshot = {
        exerciseName,
        controllerName,
        exerciseFinishTime,
        currentSeconds,
        injects,
        resources,
      }
      localStorage.setItem('excon_session', JSON.stringify(snapshot))
    } catch {
      // ignore storage errors
    }
  }, [exerciseName, controllerName, exerciseFinishTime, currentSeconds, injects, resources])

  // Check for existing session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('excon_session')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setPendingRestore(parsed)
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [])

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

  // Helper function to renumber injects based on due time order
  const renumberInjects = useCallback((injectsList: InjectItem[]): InjectItem[] => {
    return [...injectsList]
      .sort((a, b) => a.dueSeconds - b.dueSeconds)
      .map((inject, index) => ({ ...inject, number: index + 1 }))
  }, [])

  // Timer handlers
  const handleStartStop = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const handleReset = useCallback(() => {
    setCurrentSeconds(0)
    setIsRunning(false)
  }, [])

  const handleManualTimeSet = useCallback((timeInput: string): boolean => {
    const parsedSeconds = parseHMS(timeInput)
    if (parsedSeconds !== null) {
      setCurrentSeconds(parsedSeconds)
      return true
    }
    logWarn('TimerControls', `Invalid manual time input: ${timeInput}`)
    return false
  }, [])

  // Inject handlers
  const handleAddInject = useCallback((title: string, dueTime: string, type: InjectItem['type'], to: string, from: string) => {
    const dueSeconds = parseHMS(dueTime)
    if (dueSeconds !== null && title.trim() && to.trim() && from.trim()) {
      const newInject: InjectItem = {
        id: generateId(),
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

  const handleToggleInjectStatus = useCallback((injectId: string) => {
    setInjects(prevInjects => 
      prevInjects.map(inject => 
        inject.id === injectId 
          ? { ...inject, status: inject.status === "completed" ? "pending" as const : "completed" as const }
          : inject
      )
    )
  }, [])

  const handleMoveInject = useCallback((id: string, direction: 'up' | 'down') => {
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
  }, [renumberInjects])

  const handleSkipInject = useCallback((id: string) => {
    setInjects(prev => 
      prev.map(inject => 
        inject.id === id 
          ? { ...inject, status: "skipped" as const }
          : inject
      )
    )
  }, [])

  const handleDeleteInject = useCallback((id: string) => {
    setInjects(prev => renumberInjects(prev.filter(inject => inject.id !== id)))
  }, [renumberInjects])

  const handleUpdateInjects = useCallback((updatedInjects: InjectItem[]) => {
    setInjects(renumberInjects(updatedInjects))
  }, [renumberInjects])

  // Resource handlers
  const handleAddResource = useCallback((label: string, etaMinutes: number) => {
    if (label.trim() && etaMinutes >= 0) {
      const newResource: ResourceItem = {
        id: generateId(),
        label: label.trim(),
        etaSeconds: currentSeconds + (etaMinutes * 60),
        status: "requested"
      }
      setResources(prev => [...prev, newResource])
    }
  }, [currentSeconds])

  const handleResourceStatusChange = useCallback((resourceId: string, newStatus: ResourceItem['status']) => {
    setResources(prevResources => 
      prevResources.map(resource => 
        resource.id === resourceId && canTransitionTo(resource.status, newStatus)
          ? { ...resource, status: newStatus }
          : resource
      )
    )
  }, [])

  const handleResourceETAEdit = useCallback((resourceId: string, newETATime: string): boolean => {
    const newETASeconds = parseHMS(newETATime)
    if (newETASeconds !== null) {
      setResources(prevResources => 
        prevResources.map(resource => 
          resource.id === resourceId 
            ? { ...resource, etaSeconds: newETASeconds }
            : resource
        )
      )
      return true
    }
    logWarn('ResourceRequestBoard', `Invalid ETA time input: ${newETATime}`)
    return false
  }, [])

  // Import handlers
  const handleInjectsImport = useCallback((importedInjects: InjectItem[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setInjects(renumberInjects(importedInjects))
    } else {
      // Append mode - check for duplicates
      const existingKeys = new Set(injects.map(i => `${i.title}:${i.dueSeconds}`))
      const newInjects = importedInjects.filter(inject => 
        !existingKeys.has(`${inject.title}:${inject.dueSeconds}`)
      )
      
      setInjects(prev => renumberInjects([...prev, ...newInjects]))
      
      // Log summary
      const duplicateCount = importedInjects.length - newInjects.length
      console.log(`Imported ${newInjects.length} inject(s). Skipped ${duplicateCount} duplicate(s).`)
    }
  }, [injects, renumberInjects])

  const handleResourcesImport = useCallback((importedResources: ResourceItem[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setResources(importedResources)
    } else {
      // Append mode - check for duplicates
      const existingKeys = new Set(resources.map(r => `${r.label}:${r.etaSeconds}`))
      const newResources = importedResources.filter(resource => 
        !existingKeys.has(`${resource.label}:${resource.etaSeconds}`)
      )
      
      setResources(prev => [...prev, ...newResources])
      
      // Log summary
      const duplicateCount = importedResources.length - newResources.length
      console.log(`Imported ${newResources.length} resource(s). Skipped ${duplicateCount} duplicate(s).`)
    }
  }, [resources])

  // Filter handler
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Session controls
  const handleExportSession = useCallback(() => {
    const data = {
      exerciseName,
      controllerName,
      exerciseFinishTime,
      currentSeconds,
      injects,
      resources,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'excon-session.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [exerciseName, controllerName, exerciseFinishTime, currentSeconds, injects, resources])

  const handleImportSessionClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportSessionFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (data) {
          setExerciseName(data.exerciseName || 'Untitled Exercise')
          setControllerName(data.controllerName || '')
          setExerciseFinishTime(data.exerciseFinishTime || '')
          setCurrentSeconds(typeof data.currentSeconds === 'number' ? data.currentSeconds : 0)
          setInjects(Array.isArray(data.injects) ? data.injects : [])
          setResources(Array.isArray(data.resources) ? data.resources : [])
        }
      } catch (err) {
        logWarn('Dashboard', `Failed to import session JSON: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    reader.readAsText(file)
    // reset file input
    e.target.value = ''
  }, [])

  const handleExportLogs = useCallback(() => {
    const logs = logger.exportLogs()
    const content = `ERROR LOG\n${logs.errorLog}\n\nTASK LOG\n${logs.taskLog}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'excon-logs.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleRestoreSession = useCallback(() => {
    if (!pendingRestore) return
    setExerciseName(pendingRestore.exerciseName || 'Untitled Exercise')
    setControllerName(pendingRestore.controllerName || '')
    setExerciseFinishTime(pendingRestore.exerciseFinishTime || '')
    setCurrentSeconds(typeof pendingRestore.currentSeconds === 'number' ? pendingRestore.currentSeconds : 0)
    setInjects(Array.isArray(pendingRestore.injects) ? pendingRestore.injects : [])
    setResources(Array.isArray(pendingRestore.resources) ? pendingRestore.resources : [])
    setPendingRestore(null)
  }, [pendingRestore])

  const handleDismissRestore = useCallback(() => {
    localStorage.removeItem('excon_session')
    setPendingRestore(null)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {pendingRestore && (
          <div className="mb-4 p-3 bg-blue-900 border border-blue-600 rounded text-white flex items-center justify-between">
            <div>Previous session found. Restore it?</div>
            <div className="flex gap-2">
              <button onClick={handleRestoreSession} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">Restore</button>
              <button onClick={handleDismissRestore} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">Dismiss</button>
            </div>
          </div>
        )}
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
        
        {/* Session Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button onClick={handleExportSession} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">Export Session</button>
          <button onClick={handleImportSessionClick} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">Import Session</button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportSessionFile} className="hidden" />
          <button onClick={handleExportLogs} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">Export Logs</button>
        </div>

        {/* Main Section: Timer and Resource Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Timer Controls */}
          <TimerControls
            currentSeconds={currentSeconds}
            isRunning={isRunning}
            onStartStop={handleStartStop}
            onReset={handleReset}
            onManualTimeSet={handleManualTimeSet}
          />
          
          {/* Resource Request Board */}
          <ResourceRequestBoard
            resources={resources}
            onResourceStatusChange={handleResourceStatusChange}
            onResourceETAEdit={handleResourceETAEdit}
          />
        </div>
        
        {/* Timeline Section - directly under timer */}
        <div className="mb-6">
          <Timeline
            injects={injects}
            resources={resources}
            currentSeconds={currentSeconds}
            exerciseFinishTime={exerciseFinishTime}
            filterState={filterState}
          />
        </div>
        
        {/* Filter Controls - under timeline */}
        <div className="mb-8">
          <TimelineFilterBar
            filterState={filterState}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        {/* Inject Status Section - Full Width */}
        <div className="border-t-4 border-gray-700 pt-6 mb-6">
          <InjectList
            injects={injects}
            currentSeconds={currentSeconds}
            onUpdateInjects={handleUpdateInjects}
            onToggleInjectStatus={handleToggleInjectStatus}
            onMoveInject={handleMoveInject}
            onSkipInject={handleSkipInject}
            onDeleteInject={handleDeleteInject}
          />
        </div>
        
        {/* Forms Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Injects Form */}
            <AddInjectForm 
              onAddInject={handleAddInject} 
              onImportClick={() => setShowImportModal(true)}
            />
            
            {/* Add Resource Form */}
            <AddResourceForm 
              onAddResource={handleAddResource} 
              onImportClick={() => setShowResourceImportModal(true)}
            />
          </div>
        </div>
        
        {/* Import Modals */}
        <ImportInjectsModal
          isOpen={showImportModal}
          existingInjects={injects}
          onClose={() => setShowImportModal(false)}
          onImport={handleInjectsImport}
        />
        
        <ImportResourcesModal
          isOpen={showResourceImportModal}
          currentSeconds={currentSeconds}
          onClose={() => setShowResourceImportModal(false)}
          onImport={handleResourcesImport}
        />
      </div>
    </div>
  )
}
