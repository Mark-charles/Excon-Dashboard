"use client"


import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ExternalLink, FileDown, ArrowUp, RotateCcw, Trash2 } from 'lucide-react'
import ExerciseHeader from '@/components/dashboard/ExerciseHeader'
import ExerciseOverview from '@/components/dashboard/ExerciseOverview'
import { publishState, subscribeState } from '@/lib/sync'
import { downloadCSV } from '@/lib/csv'
import { formatHMS, parseHMS } from '@/lib/time'
import AddInjectForm from '@/components/dashboard/AddInjectForm'
import AddResourceForm from '@/components/dashboard/AddResourceForm'
import ImportInjectsModal from '@/components/dashboard/ImportInjectsModal'
import ImportResourcesModal from '@/components/dashboard/ImportResourcesModal'
import TimerControls from '@/components/dashboard/TimerControls'
import ResourceRequestBoard from '@/components/dashboard/ResourceRequestBoard'
import DashboardTimeline from '@/components/dashboard/DashboardTimeline'
import { useDashboardStore } from '@/lib/store'
import { useInjectsImport } from '@/hooks/useInjectsImport'
import { useResourcesImport } from '@/hooks/useResourcesImport'
import { mapInjectType, generateId, renumberInjects } from '@/lib/helpers'
import type { InjectItem, ResourceItem, InjectType, ResourceStatus, ResourceKind } from '@/lib/types'

// Types moved to '@/lib/types'


// Components moved to '@/components/dashboard'

// AddInjectForm, AddResourceForm moved to '@/components/dashboard'

export default function Dashboard() {
  // Exercise info via store
  const exerciseName = useDashboardStore(s => s.exerciseName)
  const setExerciseName = useDashboardStore(s => s.setExerciseName)
  const controllerName = useDashboardStore(s => s.controllerName)
  const setControllerName = useDashboardStore(s => s.setControllerName)
  const exerciseFinishTime = useDashboardStore(s => s.exerciseFinishTime)
  const setExerciseFinishTime = useDashboardStore(s => s.setExerciseFinishTime)
  // Simplified: single unified view (no roles/locks)
  const canEdit = true
  
  // Stable callback functions for ExerciseHeader
  const handleExerciseNameChange = useCallback((value: string) => {
    setExerciseName(value)
  }, [setExerciseName])
  
  const handleControllerNameChange = useCallback((value: string) => {
    setControllerName(value)
  }, [setControllerName])
  
  const handleFinishTimeChange = useCallback((value: string) => {
    setExerciseFinishTime(value)
  }, [setExerciseFinishTime])
  
  // Stable callback functions for forms are defined after their dependencies below
  
  // Timer and main state
  const currentSeconds = useDashboardStore(s => s.currentSeconds)
  const isRunning = useDashboardStore(s => s.isRunning)
  const resetTimer = useDashboardStore(s => s.reset)
  const setSeconds = useDashboardStore(s => s.setSeconds)
  const tick = useDashboardStore(s => s.tick)
  const injects = useDashboardStore(s => s.injects)
  const setInjects = useDashboardStore(s => s.setInjects)
  const resources = useDashboardStore(s => s.resources)
  const setResources = useDashboardStore(s => s.setResources)
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const raw = localStorage.getItem('excon-audio-enabled')
    return raw ? raw === 'true' : true
  })
  const alertedDueRef = useRef<Set<string>>(new Set())
  const alertedMissedRef = useRef<Set<string>>(new Set())
  const prevInjectsRef = useRef<InjectItem[] | null>(null)
  const externalUpdateRef = useRef(false)
  const scenarioFileInputRef = useRef<HTMLInputElement | null>(null)
  const [toast, setToast] = useState<{message: string; ts: number} | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)
  
  // Shared focus-visible ring style for accessibility

  // Local persistence of key state (hydrate store)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('excon-dashboard-state-v1') : null
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.exerciseName === 'string') setExerciseName(parsed.exerciseName)
        if (typeof parsed.controllerName === 'string') setControllerName(parsed.controllerName)
        if (typeof parsed.exerciseFinishTime === 'string') setExerciseFinishTime(parsed.exerciseFinishTime)
        if (Array.isArray(parsed.injects)) setInjects(parsed.injects as InjectItem[])
        if (Array.isArray(parsed.resources)) setResources(parsed.resources as ResourceItem[])
        if (typeof parsed.currentSeconds === 'number' && parsed.currentSeconds >= 0) setSeconds(parsed.currentSeconds)
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const state = {
        exerciseName,
        controllerName,
        exerciseFinishTime,
        currentSeconds,
        injects,
        resources,
      }
      if (typeof window !== 'undefined') {
        if (externalUpdateRef.current) {
          // Skip publish for externally-driven updates to avoid loops
          externalUpdateRef.current = false
        } else {
          publishState(state)
        }
        localStorage.setItem('excon-dashboard-state-v1', JSON.stringify(state))
      }
    } catch {}
  }, [exerciseName, controllerName, exerciseFinishTime, currentSeconds, injects, resources])

  // Subscribe to external state updates (e.g., Admin page changes)
  useEffect(() => {
    const unsub = subscribeState((s) => {
      externalUpdateRef.current = true
      const detailsChanged = (typeof s.exerciseName === 'string' && s.exerciseName !== exerciseName)
        || (typeof s.controllerName === 'string' && s.controllerName !== controllerName)
        || (typeof s.exerciseFinishTime === 'string' && s.exerciseFinishTime !== exerciseFinishTime)
      const injectsChanged = Array.isArray(s.injects) && JSON.stringify(s.injects) !== JSON.stringify(injects)
      const resourcesChanged = Array.isArray(s.resources) && JSON.stringify(s.resources) !== JSON.stringify(resources)
      if (typeof s.exerciseName === 'string') setExerciseName(s.exerciseName)
      if (typeof s.controllerName === 'string') setControllerName(s.controllerName)
      if (typeof s.exerciseFinishTime === 'string') setExerciseFinishTime(s.exerciseFinishTime)
      if (typeof s.currentSeconds === 'number') setSeconds(s.currentSeconds)
      if (Array.isArray(s.injects)) setInjects(s.injects as InjectItem[])
      if (Array.isArray(s.resources)) setResources(s.resources as ResourceItem[])

      // Show a small toast when changes arrive from Admin
      const showToast = (message: string) => {
        setToast({ message, ts: Date.now() })
        if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current)
        toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3000)
      }
      if (detailsChanged) showToast('Exercise details updated')
      else if (injectsChanged || resourcesChanged) showToast('Scenario updated')
    })
    return () => unsub()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Roles removed; no role or edit-lock listeners


  

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('excon-audio-enabled', String(audioEnabled))
    }
  }, [audioEnabled])
  
  // Import hooks (injects/resources)
  const injectImport = useInjectsImport({ currentSeconds, injects, setInjects })
  const resourceImport = useResourcesImport({ currentSeconds, resources, setResources })
  const [autoAdvanceResources, setAutoAdvanceResources] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const raw = localStorage.getItem('excon-auto-advance-resources')
    return raw ? raw === 'true' : false
  })

  // Snooze modal state

  // Persist auto-advance toggle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('excon-auto-advance-resources', String(autoAdvanceResources))
    }
  }, [autoAdvanceResources])

  // Auto-advance resources when enabled
  useEffect(() => {
    if (!autoAdvanceResources) return
    setResources(prev => {
      let changed = false
      const next = prev.map(r => {
        const created = r.createdAtSeconds ?? 0
        if (r.status === 'requested' && currentSeconds - created >= 60) {
          changed = true
          return { ...r, status: 'tasked' as const }
        }
        if (r.status === 'tasked' && currentSeconds >= (r.etaSeconds - 60)) {
          changed = true
          return { ...r, status: 'enroute' as const }
        }
        return r
      })
      return changed ? next : prev
    })
  }, [currentSeconds, autoAdvanceResources, setResources])

  // Inline editing state
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (isRunning) {
      intervalId = setInterval(() => { tick() }, 1000)
    }
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [isRunning, tick])

  // Auto-check for missed injects
  useEffect(() => {
    setInjects(prevInjects =>
      prevInjects.map(inject => 
        inject.status === "pending" && currentSeconds > inject.dueSeconds
          ? { ...inject, status: "missed" as const }
          : inject
      )
    )
  }, [currentSeconds, setInjects])

  // Detect newly due and newly missed injects for audio cues
  useEffect(() => {
    if (!audioEnabled) return
    // Single beep when an inject becomes due (once)
    injects.forEach(inject => {
      if (inject.status === 'pending' && currentSeconds >= inject.dueSeconds && !alertedDueRef.current.has(inject.id)) {
        alertedDueRef.current.add(inject.id)
        if (!inject.acked) {
          if (inject.audioDataUrl && inject.autoPlayAudio) {
            try {
              const audio = new Audio(inject.audioDataUrl)
              void audio.play()
            } catch { /* ignore */ }
          } else {
            playBeep(1)
          }
        }
      }
    })
  }, [currentSeconds, injects, audioEnabled])

  useEffect(() => {
    if (!audioEnabled) {
      prevInjectsRef.current = injects
      return
    }
    const prev = prevInjectsRef.current
    if (prev) {
      const prevStatus = new Map(prev.map(i => [i.id, i.status]))
      injects.forEach(i => {
        const was = prevStatus.get(i.id)
        if (i.status === 'missed' && was !== 'missed' && !alertedMissedRef.current.has(i.id)) {
          alertedMissedRef.current.add(i.id)
          playBeep(2)
        }
      })
    }
    prevInjectsRef.current = injects
  }, [injects, audioEnabled])

  const playBeep = (times: number) => {
    try {
      const AudioCtx = (
        window as unknown as {
          AudioContext: typeof AudioContext
          webkitAudioContext?: typeof AudioContext
        }
      ).AudioContext ||
        (window as unknown as {
          AudioContext: typeof AudioContext
          webkitAudioContext?: typeof AudioContext
        }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const duration = 0.12
      const gap = 0.12
      for (let n = 0; n < times; n++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = times === 2 ? 880 : 660
        osc.connect(gain)
        gain.connect(ctx.destination)
        const start = ctx.currentTime + n * (duration + gap)
        const end = start + duration
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, end)
        osc.start(start)
        osc.stop(end)
      }
      // close after a short delay to free resources
      setTimeout(() => ctx.close(), (duration + gap) * times * 1000 + 200)
    } catch {}
  }

  useEffect(() => {
    setResources(prevResources => {
      let changed = false
      const next = prevResources.map(resource => {
        if (resource.status === "enroute" && currentSeconds >= resource.etaSeconds) {
          changed = true
          return { ...resource, status: "arrived" as const }
        }
        return resource
      })
      return changed ? next : prevResources
    })
  }, [currentSeconds, setResources])

  // formatHMS/parseHMS imported from '@/lib/time'



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
  // Import helper functions moved to '@/lib/csv'

  // mapInjectType, generateId moved to '@/lib/helpers'



  // Reset entire exercise (names, times, injects/resources, and timer)
  const handleResetExercise = () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Reset exercise? This will clear names, finish time, injects, resources, and reset the timer to 00:00:00.')
      if (!ok) return
    }
    try {
      setExerciseName('')
      setControllerName('')
      setExerciseFinishTime('')
      setInjects([])
      setResources([])
      setSeconds(0)
      resetTimer()
    } catch {}
  }

  const handleClearInjects = () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Delete all injects? This cannot be undone.')
      if (!ok) return
    }
    setInjects([])
  }

  const handleClearResources = () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Delete all resources? This cannot be undone.')
      if (!ok) return
    }
    setResources([])
  }

  // Form handlers
  // renumberInjects moved to '@/lib/helpers'

  const handleAddInject = useCallback((title: string, dueTime: string, type: InjectType, to: string, from: string, audioDataUrl?: string, audioName?: string, autoPlayAudio?: boolean) => {
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
        from: from.trim(),
        acked: false,
        audioDataUrl,
        audioName,
        autoPlayAudio: !!autoPlayAudio
      }
      setInjects(prev => renumberInjects([...prev, newInject]))
    }
  }, [setInjects])

  const handleAddResource = useCallback((label: string, etaMinutes: number, kind: ResourceKind) => {
    if (label.trim() && etaMinutes >= 0) {
      const newResource: ResourceItem = {
        id: `r${Date.now()}`,
        label: label.trim(),
        etaSeconds: currentSeconds + (etaMinutes * 60),
        status: "requested",
        kind,
        createdAtSeconds: currentSeconds
      }
      setResources(prev => [...prev, newResource])
    }
  }, [currentSeconds, setResources])

  // Stable callback functions for forms (defined after their dependencies to avoid TDZ)
  const handleAddInjectCallback = useCallback((
    title: string,
    dueTime: string,
    type: InjectType,
    to: string,
    from: string,
    audioDataUrl?: string | null,
    audioName?: string | null,
    autoPlayAudio?: boolean,
  ) => {
    handleAddInject(title, dueTime, type, to, from, audioDataUrl || undefined, audioName || undefined, !!autoPlayAudio)
  }, [handleAddInject])

  const handleAddResourceCallback = useCallback((label: string, minutes: number, kind: ResourceKind) => {
    handleAddResource(label, minutes, kind)
  }, [handleAddResource])

  const handleImportClickCallback = useCallback(() => {
    if (!canEdit) return
    injectImport.setOpen(true)
  }, [canEdit, injectImport])

  const handleResourceImportClickCallback = useCallback(() => {
    if (!canEdit) return
    resourceImport.setOpen(true)
  }, [canEdit, resourceImport])

  // Import handlers

  // Scenario templates (JSON)
  const saveScenarioJSON = () => {
    try {
      const scenario = {
        version: 'excon-scenario-v1',
        exerciseName,
        controllerName,
        exerciseFinishTime,
        injects: [...injects]
          .sort((a,b) => a.dueSeconds - b.dueSeconds)
          .map(i => ({ title: i.title, dueSeconds: i.dueSeconds, type: i.type, to: i.to, from: i.from })),
        resources: [...resources]
          .sort((a,b) => a.etaSeconds - b.etaSeconds)
          .map(r => ({ label: r.label, etaSeconds: r.etaSeconds, status: r.status, kind: r.kind }))
      }
      const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const name = exerciseName?.trim() ? `_${exerciseName.trim().replace(/\s+/g,'_')}` : ''
      a.href = url
      a.download = `scenario${name}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const handleScenarioLoad = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data || typeof data !== 'object' || data.version !== 'excon-scenario-v1') return
      // Basic shape checks
      const loadedInjects: InjectItem[] = Array.isArray(data.injects)
        ? data.injects.map((i, idx) => {
            const obj = i as Record<string, unknown>
            return {
              id: generateId(),
              number: idx + 1,
              title: String(obj.title || ''),
              dueSeconds: Number(obj.dueSeconds || 0),
              type: mapInjectType(String(obj.type || 'other')),
              status: 'pending',
              to: String(obj.to || ''),
              from: String(obj.from || ''),
            }
          })
        : []

      const loadedResources: ResourceItem[] = Array.isArray(data.resources)
        ? data.resources.map(r => {
            const obj = r as Record<string, unknown>
            return {
              id: generateId(),
              label: String(obj.label || ''),
              etaSeconds: Number(obj.etaSeconds || 0),
              status: (['requested', 'tasked', 'enroute', 'arrived', 'cancelled'].includes(String(obj.status))
                ? (obj.status as ResourceStatus)
                : 'requested'),
              kind: (['person', 'vehicle', 'group', 'air', 'capability', 'supply'].includes(String(obj.kind))
                ? (obj.kind as ResourceKind)
                : undefined),
            }
          })
        : []

      setInjects(renumberInjects(loadedInjects))
      setResources(loadedResources)
      if (typeof data.exerciseName === 'string') setExerciseName(data.exerciseName)
      if (typeof data.controllerName === 'string') setControllerName(data.controllerName)
      if (typeof data.exerciseFinishTime === 'string') setExerciseFinishTime(data.exerciseFinishTime)
    } catch {}
  }

  // CSV export helpers moved to '@/lib/csv'
  const exportInjectsImportCSV = () => {
    const rows: (string|number)[][] = []
    rows.push(['Title','Due (minutes)','Type','To','From'])
    const sorted = [...injects].sort((a,b) => a.dueSeconds - b.dueSeconds)
    sorted.forEach(i => {
      const minutes = Math.max(0, Math.round((i.dueSeconds - currentSeconds) / 60))
      rows.push([i.title, minutes, i.type, i.to, i.from])
    })
    const name = exerciseName?.trim() ? `_${exerciseName.trim().replace(/\s+/g,'_')}` : ''
    downloadCSV(`injects_import${name}.csv`, rows)
  }
  const exportResourcesCSV = () => {
    const rows: (string|number)[][] = []
    rows.push(['Label','Status','Kind','ETASeconds','ETA(HH:MM:SS)'])
    const sorted = [...resources].sort((a,b) => a.etaSeconds - b.etaSeconds)
    sorted.forEach(r => rows.push([r.label, r.status, r.kind || '', r.etaSeconds, formatHMS(r.etaSeconds)]))
    const name = exerciseName?.trim() ? `_${exerciseName.trim().replace(/\s+/g,'_')}` : ''
    downloadCSV(`resources${name}.csv`, rows)
  }



  // Main render
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <ExerciseHeader
          exerciseName={exerciseName}
          controllerName={controllerName}
          exerciseFinishTime={exerciseFinishTime}
          onExerciseNameChange={handleExerciseNameChange}
          onControllerNameChange={handleControllerNameChange}
          onFinishTimeChange={handleFinishTimeChange}
          readonly={!canEdit}
        />

        <ExerciseOverview
          exerciseName={exerciseName}
          controllerName={controllerName}
        />

        {/* Timer full width */}
        <TimerControls />

        {/* Resources full width under timer */}
        <ResourceRequestBoard
          canEdit={canEdit}
          autoAdvanceResources={autoAdvanceResources}
          onToggleAutoAdvance={setAutoAdvanceResources}
        />

        {/* Timeline and Inject list */}
        <DashboardTimeline
          canEdit={canEdit}
          audioEnabled={audioEnabled}
          onToggleAudio={() => setAudioEnabled(v => !v)}
          onExportInjects={exportInjectsImportCSV}
        />

        {/* Forms at bottom to leave space for status lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AddInjectForm
            onAddInject={handleAddInjectCallback}
            onImportClick={handleImportClickCallback}
            disabled={!canEdit}
          />

          <AddResourceForm
            onAddResource={handleAddResourceCallback}
            onImportClick={handleResourceImportClickCallback}
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Import Modals */}
      {/* Admin / Setup Controls */}
      <div className="mt-6 bg-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Admin</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {/* Export JSON */}
          <button
            onClick={saveScenarioJSON}
            className="flex flex-col items-center justify-center p-3 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Export scenario to JSON"
          >
            <FileDown className="w-6 h-6" />
            <span className="mt-1 text-xs text-gray-300">Export JSON</span>
          </button>

          {/* Import JSON */}
          <>
            <input
              ref={scenarioFileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) await handleScenarioLoad(f)
                if (e.target) e.target.value = ''
              }}
            />
            <button
              onClick={() => scenarioFileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Import scenario from JSON"
            >
              <ArrowUp className="w-6 h-6" />
              <span className="mt-1 text-xs text-gray-300">Import JSON</span>
            </button>
          </>

          {/* CSV: Injects */}
          <button
            onClick={exportInjectsImportCSV}
            className="flex flex-col items-center justify-center p-3 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Export injects CSV"
          >
            <FileDown className="w-6 h-6" />
            <span className="mt-1 text-xs text-gray-300">Injects CSV</span>
          </button>

          {/* CSV: Resources */}
          <button
            onClick={exportResourcesCSV}
            className="flex flex-col items-center justify-center p-3 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Export resources CSV"
          >
            <FileDown className="w-6 h-6" />
            <span className="mt-1 text-xs text-gray-300">Resources CSV</span>
          </button>

          {/* Reset Exercise */}
          <button
            onClick={handleResetExercise}
            className="flex flex-col items-center justify-center p-3 rounded bg-red-700 hover:bg-red-800 text-white"
            title="Reset entire exercise"
          >
            <RotateCcw className="w-6 h-6" />
            <span className="mt-1 text-xs text-gray-100">Reset</span>
          </button>

          {/* Clear Injects */}
          <button
            onClick={handleClearInjects}
            className="flex flex-col items-center justify-center p-3 rounded bg-red-600 hover:bg-red-700 text-white"
            title="Delete all injects"
          >
            <Trash2 className="w-6 h-6" />
            <span className="mt-1 text-xs text-gray-100">Clear Injects</span>
          </button>

          {/* Clear Resources */}
          <button
            onClick={handleClearResources}
            className="flex flex-col items-center justify-center p-3 rounded bg-red-600 hover:bg-red-700 text-white"
            title="Delete all resources"
          >
            <Trash2 className="w-6 h-6" />
            <span className="mt-1 text-xs text-gray-100">Clear Resources</span>
          </button>

          {/* Summary */}
          <button
            onClick={() => { if (typeof window !== 'undefined') window.open('/display/summary', 'SummaryDisplay', 'noopener,noreferrer,width=1100,height=800') }}
            className="flex flex-col items-center justify-center p-3 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Open printable summary"
          >
            <ExternalLink className="w-6 h-6" />
            <span className="mt-1 text-xs text-gray-300">Summary</span>
          </button>
        </div>
      </div>

      {/* Import Modals */}
      <ImportInjectsModal
        open={injectImport.open}
        onClose={() => injectImport.setOpen(false)}
        isProcessing={injectImport.isProcessing}
        importMode={injectImport.importMode}
        setImportMode={injectImport.setImportMode}
        importFile={injectImport.importFile}
        onFileSelect={injectImport.onFileSelect}
        onClearFile={injectImport.clearFile}
        validationErrors={injectImport.validationErrors}
        invalidRows={injectImport.invalidInjectRows}
        previewInjects={injectImport.previewInjects}
        onImport={injectImport.commitImport}
        onDownloadTemplate={injectImport.downloadTemplate}
        getInjectTypeColor={getInjectTypeColor}
      />
      <ImportResourcesModal
        open={resourceImport.open}
        onClose={() => resourceImport.setOpen(false)}
        isProcessing={resourceImport.isProcessing}
        importMode={resourceImport.importMode}
        setImportMode={resourceImport.setImportMode}
        importFile={resourceImport.importFile}
        onFileSelect={resourceImport.onFileSelect}
        onClearFile={resourceImport.clearFile}
        validationErrors={resourceImport.validationErrors}
        invalidRows={resourceImport.invalidResourceRows}
        previewResources={resourceImport.previewResources}
        onImport={resourceImport.commitImport}
        currentSeconds={currentSeconds}
      />

      {/* Toast for remote updates */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded shadow">
          {toast.message}
        </div>
      )}
    </div>
  )
}







