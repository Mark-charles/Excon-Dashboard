'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { InjectItem, ResourceItem, FilterState } from '../components/shared/types'
import { parseHMS, formatHMS } from '../utils/timeUtils'
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
const injectFieldKeys = ['number', 'title', 'dueSeconds', 'type', 'to', 'from', 'notes', 'resources'] as const
type InjectFieldKey = (typeof injectFieldKeys)[number]
type InjectFieldChange = {
  from: InjectItem[InjectFieldKey]
  to: InjectItem[InjectFieldKey]
}

type ActivityKind =
  | 'inject:add' | 'inject:update' | 'inject:status' | 'inject:move' | 'inject:skip' | 'inject:delete'
  | 'resource:add' | 'resource:status' | 'resource:eta'
  | 'session:reset' | 'session:import' | 'session:export' | 'report:export'

type ActivityDetails = Record<string, unknown>

interface ActivityEntry { ts: number; kind: ActivityKind; details: ActivityDetails }

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
  // Activity log for audit/reporting
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  // Persistence / restore state
  const [pendingRestore, setPendingRestore] = useState<null | {
    exerciseName: string
    controllerName: string
    exerciseFinishTime: string
    currentSeconds: number
    injects: InjectItem[]
    resources: ResourceItem[]
    activity?: ActivityEntry[]
  }>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [showResourceImportModal, setShowResourceImportModal] = useState(false)

  const logActivity = useCallback((kind: ActivityKind, details: ActivityDetails = {}) => {
    const entry: ActivityEntry = { ts: Date.now(), kind, details }
    setActivity(prev => [...prev, entry])
  }, [])

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
        activity,
      }
      localStorage.setItem('excon_session', JSON.stringify(snapshot))
    } catch {
      // ignore storage errors
    }
  }, [exerciseName, controllerName, exerciseFinishTime, currentSeconds, injects, resources, activity])

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
  const handleAddInject = useCallback((title: string, dueTime: string, type: InjectItem['type'], to: string, from: string, notes: string, resources: string) => {
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
        from: from.trim(),
        notes: notes.trim(),
        resources: resources.trim()
      }
      setInjects(prev => renumberInjects([...prev, newInject]))
      // activity
      try { logActivity('inject:add', { id: newInject.id, title: newInject.title, dueSeconds, type, to, from }) } catch {}
    }
  }, [renumberInjects, logActivity])

  const handleToggleInjectStatus = useCallback((injectId: string) => {
    setInjects(prevInjects => 
      prevInjects.map(inject => 
        inject.id === injectId 
          ? { ...inject, status: inject.status === "completed" ? "pending" as const : "completed" as const }
          : inject
      )
    )
    try {
      const inj = injects.find(i => i.id === injectId)
      if (inj) logActivity('inject:status', { id: inj.id, number: inj.number, to: inj.status === 'completed' ? 'pending' : 'completed' })
    } catch {}
  }, [injects, logActivity])

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
    try { logActivity('inject:move', { id, direction }) } catch {}
  }, [renumberInjects, logActivity])

  const handleSkipInject = useCallback((id: string) => {
    setInjects(prev => 
      prev.map(inject => 
        inject.id === id 
          ? { ...inject, status: "skipped" as const }
          : inject
      )
    )
    try { logActivity('inject:skip', { id }) } catch {}
  }, [logActivity])

  const handleDeleteInject = useCallback((id: string) => {
    setInjects(prev => renumberInjects(prev.filter(inject => inject.id !== id)))
    try { logActivity('inject:delete', { id }) } catch {}
  }, [renumberInjects, logActivity])

  const handleUpdateInjects = useCallback((updatedInjects: InjectItem[]) => {
    try {
      const before = new Map(injects.map(i => [i.id, i]))
      updatedInjects.forEach(u => {
        const previous = before.get(u.id)
        if (!previous) return
        const changes: Partial<Record<InjectFieldKey, InjectFieldChange>> = {}
        injectFieldKeys.forEach((key) => {
          if (previous[key] !== u[key]) {
            changes[key] = {
              from: previous[key],
              to: u[key],
            }
          }
        })
        if (Object.keys(changes).length) logActivity('inject:update', { id: u.id, changes })
      })
    } catch {}
    setInjects(renumberInjects(updatedInjects))
  }, [renumberInjects, injects, logActivity])

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
      try { logActivity('resource:add', { id: newResource.id, label: newResource.label, etaSeconds: newResource.etaSeconds }) } catch {}
    }
  }, [currentSeconds, logActivity])

  const handleResourceStatusChange = useCallback((resourceId: string, newStatus: ResourceItem['status']) => {
    setResources(prevResources => 
      prevResources.map(resource => 
        resource.id === resourceId && canTransitionTo(resource.status, newStatus)
          ? { ...resource, status: newStatus }
          : resource
      )
    )
    try {
      const r = resources.find(x => x.id === resourceId)
      if (r) logActivity('resource:status', { id: r.id, label: r.label, to: newStatus })
    } catch {}
  }, [resources, logActivity])

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
      try {
        const r = resources.find(x => x.id === resourceId)
        if (r) logActivity('resource:eta', { id: r.id, label: r.label, to: newETASeconds })
      } catch {}
      return true
    }
    logWarn('ResourceRequestBoard', `Invalid ETA time input: ${newETATime}`)
    return false
  }, [resources, logActivity])

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
  const handleExportExercise = useCallback(() => {
    const data = {
      exerciseName,
      controllerName,
      exerciseFinishTime,
      currentSeconds,
      injects,
      resources,
      activity,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'excon-exercise.json'
    a.click()
    URL.revokeObjectURL(url)
    try { logActivity('session:export', { injects: injects.length, resources: resources.length }) } catch {}
  }, [exerciseName, controllerName, exerciseFinishTime, currentSeconds, injects, resources, activity, logActivity])

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
          setActivity(Array.isArray(data.activity) ? data.activity : [])
          try { logActivity('session:import', { injects: Array.isArray(data.injects) ? data.injects.length : 0, resources: Array.isArray(data.resources) ? data.resources.length : 0 }) } catch {}
        }
      } catch (err) {
        logWarn('Dashboard', `Failed to Import exercise JSON: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    reader.readAsText(file)
    // reset file input
    e.target.value = ''
  }, [logActivity])

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

  const handleResetDashboard = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm('Reset dashboard and wipe all data? This cannot be undone.')) {
      try { localStorage.removeItem('excon_session') } catch {}
      setExerciseName('Untitled Exercise')
      setControllerName('')
      setExerciseFinishTime('')
      setCurrentSeconds(0)
      setInjects([])
      setResources([])
      setPendingRestore(null)
      setActivity([])
      try { logActivity('session:reset', {}) } catch {}
    }
  }, [logActivity])

  const handleExportReport = useCallback(async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const marginX = 48
    let y = 56

    const addLine = (text: string, fontSize = 11, color: [number, number, number] = [34,38,45]) => {
      doc.setFontSize(fontSize)
      doc.setTextColor(color[0], color[1], color[2])
      doc.text(text, marginX, y)
      y += fontSize + 6
    }

    // Header
    doc.setFillColor(23, 37, 84)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255,255,255)
    doc.setFontSize(14)
    doc.text('Exercise Report', marginX, 26)
    doc.setFontSize(9)
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX + 320, 26)

    // Meta
    y = 64
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(34, 38, 45)
    addLine(`Exercise: ${exerciseName}`, 12)
    addLine(`Controller: ${controllerName || '-'}`, 12)
    addLine(`Elapsed: ${formatHMS(currentSeconds)}  Finish: ${exerciseFinishTime || '-'}`, 12)
    y += 6

    // Injects table
    doc.setFont('helvetica', 'bold')
    addLine('Master Schedule of Events', 13)
    doc.setFont('helvetica', 'normal')
    const headers = ['#','Time','Type','From','To','Status','Title']
    const colWidths = [24, 56, 70, 70, 70, 60, 270]
    doc.setFontSize(10)
    let x = marginX
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i] })
    y += 14

    const addRow = (cells: string[]) => {
      let cx = marginX
      cells.forEach((c, i) => {
        const txt = (c || '').toString()
        doc.text(txt.length > 60 ? txt.slice(0, 57) + '...' : txt, cx, y)
        cx += colWidths[i]
      })
      y += 14
      if (y > doc.internal.pageSize.getHeight() - 72) { doc.addPage(); y = 56 }
    }

    ;[...injects].sort((a,b) => a.dueSeconds - b.dueSeconds).forEach(inj => addRow([
      String(inj.number),
      formatHMS(inj.dueSeconds),
      inj.type,
      inj.from || '-',
      inj.to || '-',
      inj.status,
      inj.title
    ]))

    y += 8
    doc.setFont('helvetica', 'bold')
    addLine('Resources', 13)
    doc.setFont('helvetica', 'normal')
    const resHeaders = ['Label','ETA','Status']
    const resWidths = [260, 80, 120]
    x = marginX
    resHeaders.forEach((h, i) => { doc.text(h, x, y); x += resWidths[i] })
    y += 14
    resources.forEach(r => addRow([r.label, formatHMS(r.etaSeconds), r.status]))

    // Logs
    const logs = logger.exportLogs()
    y += 8
    doc.setFont('helvetica', 'bold')
    addLine('Logs', 13)
    doc.setFont('helvetica', 'normal')
    const logsText = `ERROR LOG\n${logs.errorLog}\n\nTASK LOG\n${logs.taskLog}`
    const lines = doc.splitTextToSize(logsText, doc.internal.pageSize.getWidth() - marginX * 2)
    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - 72) { doc.addPage(); y = 56 }
      doc.text(line, marginX, y)
      y += 12
    })

    // Activity timeline
    y += 8
    doc.setFont('helvetica', 'bold')
    addLine('Activity Timeline', 13)
    doc.setFont('helvetica', 'normal')
    if (activity.length === 0) {
      addLine('No recorded activity for this session', 11)
    } else {
      const acts = [...activity].sort((a,b)=>a.ts-b.ts)
      acts.forEach((a) => {
        if (y > doc.internal.pageSize.getHeight() - 72) { doc.addPage(); y = 56 }
        const t = new Date(a.ts).toLocaleString()
        const details = typeof a.details === 'object' ? JSON.stringify(a.details) : String(a.details)
        const line = `${t}  ${a.kind}  ${details}`
        const wrapped = doc.splitTextToSize(line, doc.internal.pageSize.getWidth() - marginX * 2)
        wrapped.forEach((w: string) => { doc.text(w, marginX, y); y += 12 })
      })
    }

    doc.save('excon-report.pdf')
    try { logActivity('report:export', { injects: injects.length, resources: resources.length, activities: activity.length }) } catch {}
  }, [exerciseName, controllerName, exerciseFinishTime, currentSeconds, injects, resources, activity, logActivity])

  const handleRestoreSession = useCallback(() => {
    if (!pendingRestore) return
    setExerciseName(pendingRestore.exerciseName || 'Untitled Exercise')
    setControllerName(pendingRestore.controllerName || '')
    setExerciseFinishTime(pendingRestore.exerciseFinishTime || '')
    setCurrentSeconds(typeof pendingRestore.currentSeconds === 'number' ? pendingRestore.currentSeconds : 0)
    setInjects(Array.isArray(pendingRestore.injects) ? pendingRestore.injects : [])
    setResources(Array.isArray(pendingRestore.resources) ? pendingRestore.resources : [])
    setActivity(Array.isArray(pendingRestore.activity) ? pendingRestore.activity : [])
    setPendingRestore(null)
  }, [pendingRestore])

  const handleDismissRestore = useCallback(() => {
    localStorage.removeItem('excon_session')
    setPendingRestore(null)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-4 lg:p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        {pendingRestore && (
          <div className="p-4 bg-gradient-to-r from-blue-900/90 to-blue-800/90 border border-blue-500/50 rounded-2xl text-white flex items-center justify-between shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Previous session found. Would you like to restore it?</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleRestoreSession} 
                aria-label="Restore previous session"
                data-label="Restore"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900 icon-btn"
              >
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M21 12a9 9 0 10-3 6.708" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M21 8v4h-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  Restore
                </span>
              </button>
              <button 
                onClick={handleDismissRestore} 
                aria-label="Dismiss restore prompt"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 focus-visible:ring-offset-gray-900"
              >
                Dismiss
              </button>
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
        
        {/* Session Controls moved to bottom Admin section */}

        {/* Main Control Center - Timer and Resource Overview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Timer Controls - Prominent Position */}
          <div className="xl:col-span-1">
            <TimerControls
              currentSeconds={currentSeconds}
              isRunning={isRunning}
              onStartStop={handleStartStop}
              onReset={handleReset}
              onManualTimeSet={handleManualTimeSet}
            />
          </div>
          
          {/* Resource Request Board - Takes more space */}
          <div className="xl:col-span-2">
            <ResourceRequestBoard
              resources={resources}
              onResourceStatusChange={handleResourceStatusChange}
              onResourceETAEdit={handleResourceETAEdit}
            />
          </div>
        </div>
        
        {/* Timeline Section - Prominently displayed */}
        <div className="relative">
          {/* Timeline Filters - Above timeline for better UX */}
          <div className="mb-4">
            <TimelineFilterBar
              filterState={filterState}
              onFilterChange={handleFilterChange}
            />
          </div>
          
          <Timeline
            injects={injects}
            resources={resources}
            currentSeconds={currentSeconds}
            exerciseFinishTime={exerciseFinishTime}
            filterState={filterState}
          />
        </div>
        
        {/* Master Schedule of Events - full width */}
        <InjectList
          injects={injects}
          currentSeconds={currentSeconds}
          onUpdateInjects={handleUpdateInjects}
          onToggleInjectStatus={handleToggleInjectStatus}
          onMoveInject={handleMoveInject}
          onSkipInject={handleSkipInject}
          onDeleteInject={handleDeleteInject}
        />

        {/* Forms under MSE */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Add to Master Schedule of Events */}
          <AddInjectForm 
            onAddInject={handleAddInject} 
            onImportClick={() => setShowImportModal(true)}
          />

          {/* Add Resources (Requests) */}
          <AddResourceForm 
            onAddResource={handleAddResource} 
            onImportClick={() => setShowResourceImportModal(true)}
          />
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
        
        {/* Dashboard Admin */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              Dashboard Admin
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExportExercise} 
              aria-label="Export exercise JSON"
              data-label="Export Exercise"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-gray-900 icon-btn"
            >
              Export Exercise
            </button>
            <button 
              onClick={handleImportSessionClick} 
              aria-label="Import exercise JSON"
              data-label="Import Exercise"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900 icon-btn"
            >
              Import Exercise
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportSessionFile} className="hidden" />
            <button 
              onClick={handleExportLogs} 
              aria-label="Export logs"
              data-label="Export Logs"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 focus-visible:ring-offset-gray-900 icon-btn"
            >
              Export Logs
            </button>
            <button
              onClick={handleExportReport}
              aria-label="Export PDF report"
              data-label="Export Report"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 focus-visible:ring-offset-gray-900 icon-btn"
            >
              Export Report (PDF)
            </button>
            <button
              onClick={handleResetDashboard}
              aria-label="Reset dashboard"
              data-label="Reset Dashboard"
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:ring-offset-gray-900 icon-btn"
            >
              Reset Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


