'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { InjectItem, ResourceItem, FilterState } from '../components/shared/types'
import { parseHMS, formatHMS } from '../utils/timeUtils'
import { generateId, canTransitionTo } from '../utils/validation'

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

  // Helper function to renumber injects based on due time order
  const renumberInjects = useCallback((injectsList: InjectItem[]): InjectItem[] => {
    return injectsList
      .sort((a, b) => a.dueSeconds - b.dueSeconds)
      .map((inject, index) => ({ ...inject, number: index + 1 }))
  }, [])

  // Timer handlers
  const handleStartStop = useCallback(() => {
    setIsRunning(!isRunning)
  }, [isRunning])

  const handleReset = useCallback(() => {
    setCurrentSeconds(0)
    setIsRunning(false)
  }, [])

  const handleManualTimeSet = useCallback((timeInput: string) => {
    const parsedSeconds = parseHMS(timeInput)
    if (parsedSeconds !== null) {
      setCurrentSeconds(parsedSeconds)
    }
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

  const handleResourceETAEdit = useCallback((resourceId: string, newETATime: string) => {
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
            editingState={{ editingField: null, editingValue: '' }}
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