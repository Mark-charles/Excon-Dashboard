"use client"


import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { User, Users, Phone, Cpu, MapPin, Tag, ClipboardCheck, Truck, CheckCircle2, XCircle, Clock, Plane, Cog, Package, Volume2, VolumeX, ExternalLink, FileDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import { publishState, subscribeState } from '@/lib/sync'

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
  acked?: boolean
  audioDataUrl?: string
  audioName?: string
  autoPlayAudio?: boolean
}

type ResourceKind = 'person' | 'vehicle' | 'group' | 'air' | 'capability' | 'supply'

type ResourceItem = {
  id: string
  label: string
  etaSeconds: number
  status: ResourceStatus
  kind?: ResourceKind
  createdAtSeconds?: number
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
  readonly?: boolean
}>(({ exerciseName, controllerName, exerciseFinishTime, onExerciseNameChange, onControllerNameChange, onFinishTimeChange, readonly = false }) => {
  const handleExerciseNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onExerciseNameChange(e.target.value)
  }, [onExerciseNameChange])
  
  const handleControllerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onControllerNameChange(e.target.value)
  }, [onControllerNameChange])
  
  const handleFinishTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFinishTimeChange(e.target.value)
  }, [onFinishTimeChange])

  if (readonly) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6 relative">
        <Link href="/admin" className="absolute right-3 top-3 text-gray-300 hover:text-white" aria-label="Open Administration">
          <Cog className="w-5 h-5" />
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-300 mb-1">Exercise Name</span>
            <span className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600">{exerciseName || '-'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-300 mb-1">Controller Name</span>
            <span className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600">{controllerName || '-'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-300 mb-1">Exercise Finish Time</span>
            <span className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600">{exerciseFinishTime || '-'}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 relative">
      <Link href="/admin" className="absolute right-3 top-3 text-gray-300 hover:text-white" aria-label="Open Administration">
        <Cog className="w-5 h-5" />
      </Link>
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
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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
  onAddInject: (title: string, dueTime: string, type: InjectType, to: string, from: string, audioDataUrl?: string | null, audioName?: string | null, autoPlayAudio?: boolean) => void
  onImportClick: () => void
  disabled?: boolean
}>(({ onAddInject, onImportClick, disabled = false }) => {
  const [title, setTitle] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [type, setType] = useState<InjectType>('radio/phone')
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const [audioName, setAudioName] = useState('')
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null)
  const [autoPlay, setAutoPlay] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return
    if (title.trim() && dueTime.trim() && to.trim() && from.trim()) {
      onAddInject(title, dueTime, type, to, from, audioDataUrl, audioName, autoPlay)
      setTitle('')
      setDueTime('')
      setType('radio/phone')
      setTo('')
      setFrom('')
      setAudioDataUrl(null)
      setAudioName('')
      setAutoPlay(false)
    }
  }, [title, dueTime, type, to, from, onAddInject, audioDataUrl, audioName, autoPlay])

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
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          required
          disabled={disabled}
        />
        <input
          type="text"
          placeholder="Due Time (HH:MM:SS)"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          required
          disabled={disabled}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InjectType)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          disabled={disabled}
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
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
            required
            disabled={disabled}
          />
          <input
            type="text"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
            required
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
          <div className="flex items-center gap-2">
            <input id="inject-audio-file" type="file" accept="audio/*" className="hidden" onChange={async (e)=>{
              const f = e.target.files?.[0]
              if (f) {
                const reader = new FileReader()
                reader.onload = () => { setAudioDataUrl(String(reader.result)); setAudioName(f.name) }
                reader.readAsDataURL(f)
              }
            }} />
            <label htmlFor="inject-audio-file" className={`px-3 py-2 ${disabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'} text-white rounded`}>{audioName ? 'Change Audio' : 'Attach Audio'}</label>
            {audioName && <span className="text-gray-300 text-sm truncate max-w-[180px]" title={audioName}>{audioName}</span>}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoPlay} onChange={(e)=>setAutoPlay(e.target.checked)} disabled={disabled} />
            <span className="text-gray-300 text-sm">Auto-play at due time</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold"
            disabled={disabled}
          >
            Add Inject
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors flex items-center justify-center"
            title="Import from CSV/Excel"
            aria-label="Import injects from CSV or Excel"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
  onAddResource: (label: string, minutes: number, kind: ResourceKind) => void
  onImportClick: () => void
  disabled?: boolean
}>(({ onAddResource, onImportClick, disabled = false }) => {
  const [label, setLabel] = useState('')
  const [etaMinutes, setEtaMinutes] = useState('')
  const [kind, setKind] = useState<ResourceKind>('vehicle')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return
    const minutes = parseInt(etaMinutes, 10)
    if (label.trim() && !isNaN(minutes) && minutes >= 0) {
      onAddResource(label, minutes, kind)
      setLabel('')
      setEtaMinutes('')
      setKind('vehicle')
    }
  }, [label, etaMinutes, kind, onAddResource])

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
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          required
          disabled={disabled}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ResourceKind)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
            aria-label="Resource kind"
            disabled={disabled}
          >
            <option value="person">Person/Position</option>
            <option value="vehicle">Vehicle/Unit</option>
            <option value="group">Task Force/Strike Team</option>
            <option value="air">Air Support</option>
            <option value="capability">Capability</option>
            <option value="supply">Supplies/Food</option>
          </select>
        <input
          type="number"
          placeholder="ETA (minutes)"
          value={etaMinutes}
          onChange={(e) => setEtaMinutes(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          min="0"
          required
          disabled={disabled}
        />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-semibold"
            disabled={disabled}
          >
            Add Resource
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors flex items-center justify-center"
            title="Import from CSV/Excel"
            aria-label="Import resources from CSV or Excel"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
  // Exercise info (initialize from localStorage if present)
  const initialSnapshot = (() => {
    if (typeof window === 'undefined') return null as any
    try {
      const raw = localStorage.getItem('excon-dashboard-state-v1')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()
  const [exerciseName, setExerciseName] = useState<string>(() =>
    initialSnapshot && typeof initialSnapshot.exerciseName === 'string' ? initialSnapshot.exerciseName : ''
  )
  const [controllerName, setControllerName] = useState<string>(() =>
    initialSnapshot && typeof initialSnapshot.controllerName === 'string' ? initialSnapshot.controllerName : ''
  )
  const [exerciseFinishTime, setExerciseFinishTime] = useState<string>(() =>
    initialSnapshot && typeof initialSnapshot.exerciseFinishTime === 'string' ? initialSnapshot.exerciseFinishTime : ''
  )
  // Roles + edit lock (local-only). Admin always editable; operators obey edit lock; viewers are read-only.
  const [role, setRole] = useState<string>(() => {
    if (typeof window === 'undefined') return 'admin'
    return localStorage.getItem('excon-role') || 'admin'
  })
  const [editLock, setEditLock] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return (localStorage.getItem('excon-edit-lock') || 'false') === 'true'
  })
  const canEdit = role === 'admin' || (role === 'operator' && !editLock)
  
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
  const handleAddInjectCallback = useCallback((title: string, dueTime: string, type: InjectType, to: string, from: string, audioDataUrl?: string | null, audioName?: string | null, autoPlayAudio?: boolean) => {
    handleAddInject(title, dueTime, type, to, from, audioDataUrl || undefined, audioName || undefined,  !!autoPlayAudio) 
  }, [])
  
  const handleAddResourceCallback = useCallback((label: string, minutes: number, kind: ResourceKind) => {
    handleAddResource(label, minutes, kind)
  }, [])
  
  const handleImportClickCallback = useCallback(() => {
    if (!canEdit) return
    setShowImportModal(true)
  }, [canEdit])
  
  const handleResourceImportClickCallback = useCallback(() => {
    if (!canEdit) return
    setShowResourceImportModal(true)
  }, [canEdit])
  
  // Timer and main state
  const [currentSeconds, setCurrentSeconds] = useState<number>(() =>
    initialSnapshot && typeof initialSnapshot.currentSeconds === 'number' ? initialSnapshot.currentSeconds : 0
  )
  const [isRunning, setIsRunning] = useState(false)
  const [injects, setInjects] = useState<InjectItem[]>(() =>
    initialSnapshot && Array.isArray(initialSnapshot.injects) ? (initialSnapshot.injects as InjectItem[]) : initialInjects
  )
  const [resources, setResources] = useState<ResourceItem[]>(() =>
    initialSnapshot && Array.isArray(initialSnapshot.resources) ? (initialSnapshot.resources as ResourceItem[]) : []
  )
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
  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ring-offset-gray-800"

  // Local persistence of key state
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
        if (typeof parsed.currentSeconds === 'number' && parsed.currentSeconds >= 0) setCurrentSeconds(parsed.currentSeconds)
      }
    } catch {}
  }, [])

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
      if (typeof s.currentSeconds === 'number') setCurrentSeconds(s.currentSeconds)
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
  }, [])

  // Listen for role/lock changes via storage (e.g., Admin page)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "excon-role") setRole(localStorage.getItem("excon-role") || "admin")
      if (e.key === "excon-edit-lock") setEditLock((localStorage.getItem("excon-edit-lock") || "false") === "true")
    }
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage)
    return () => { if (typeof window !== "undefined") window.removeEventListener("storage", onStorage) }
  }, [])


  

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('excon-audio-enabled', String(audioEnabled))
    }
  }, [audioEnabled])
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewInjects, setPreviewInjects] = useState<InjectItem[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [invalidInjectRows, setInvalidInjectRows] = useState<{rowNum:number, title:string, dueTime:string, type:string, to:string, from:string, error:string}[]>([])

  // Resource import modal state
  const [showResourceImportModal, setShowResourceImportModal] = useState(false)
  const [resourceImportMode, setResourceImportMode] = useState<'append' | 'replace'>('append')
  const [resourceImportFile, setResourceImportFile] = useState<File | null>(null)
  const [previewResources, setPreviewResources] = useState<ResourceItem[]>([])
  const [resourceValidationErrors, setResourceValidationErrors] = useState<string[]>([])
  const [isResourceProcessing, setIsResourceProcessing] = useState(false)
  const [invalidResourceRows, setInvalidResourceRows] = useState<{rowNum:number, label:string, eta:string, status?:string, kind?:string, error:string}[]>([])
  const [autoAdvanceResources, setAutoAdvanceResources] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const raw = localStorage.getItem('excon-auto-advance-resources')
    return raw ? raw === 'true' : false
  })

  // Snooze modal state
  const [snoozeInjectId, setSnoozeInjectId] = useState<string | null>(null)
  const [snoozeInput, setSnoozeInput] = useState<string>('')

  // Persist auto-advance toggle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('excon-auto-advance-resources', String(autoAdvanceResources))
    }
  }, [autoAdvanceResources])

  // Auto-advance resources when enabled
  useEffect(() => {
    if (!autoAdvanceResources) return
    setResources(prev => prev.map(r => {
      const created = r.createdAtSeconds ?? 0
      if (r.status === 'requested' && currentSeconds - created >= 60) {
        return { ...r, status: 'tasked' as const }
      }
      if (r.status === 'tasked' && currentSeconds >= (r.etaSeconds - 60)) {
        return { ...r, status: 'enroute' as const }
      }
      return r
    }))
  }, [currentSeconds, autoAdvanceResources])

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
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
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
    setResources(prevResources => 
      prevResources.map(resource => {
        // Auto-advance enroute -> arrived at ETA
        if (resource.status === "enroute" && currentSeconds >= resource.etaSeconds) {
          return { ...resource, status: "arrived" as const }
        }
        return resource
      })
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

  // Icon helpers (SVG components via lucide-react)
  const getInjectTypeIcon = (type: InjectType) => {
    const props = { size: 16, className: "inline align-middle" }
    switch (type) {
      case 'in person': return <User {...props} />
      case 'radio/phone': return <Phone {...props} />
      case 'electronic': return <Cpu {...props} />
      case 'map inject': return <MapPin {...props} />
      case 'other': return <Tag {...props} />
      default: return <Tag {...props} />
    }
  }

  const getResourceStatusIcon = (status: ResourceStatus) => {
    const props = { size: 16, className: "inline align-middle" }
    switch (status) {
      case 'requested': return <Clock {...props} />
      case 'tasked': return <ClipboardCheck {...props} />
      case 'enroute': return <Truck {...props} />
      case 'arrived': return <CheckCircle2 {...props} />
      case 'cancelled': return <XCircle {...props} />
      default: return <Tag {...props} />
    }
  }


  const getResourceKindIcon = (kind?: ResourceKind) => {
    const props = { size: 16, className: "inline align-middle" }
    switch (kind) {
      case 'person': return <User {...props} />
      case 'vehicle': return <Truck {...props} />
      case 'group': return <Users {...props} />
      case 'air': return <Plane {...props} />
      case 'capability': return <Cog {...props} />
      case 'supply': return <Package {...props} />
      default: return <Truck {...props} />
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

  const handleAckInject = (injectId: string, ack: boolean) => {
    setInjects(prev => prev.map(i => i.id === injectId ? { ...i, acked: ack } : i))
  }

  const handleSnoozeInject = (injectId: string, minutes: number) => {
    const offset = Math.max(0, Math.round(minutes * 60))
    setInjects(prev => renumberInjects(prev.map(i => i.id === injectId ? { ...i, dueSeconds: currentSeconds + offset, acked: false } : i)))
    alertedDueRef.current.delete(injectId)
  }

  const handlePlayInjectAudio = (injectId: string) => {
    const inject = injects.find(i => i.id === injectId)
    if (inject?.audioDataUrl) {
      try {
        const audio = new Audio(inject.audioDataUrl)
        void audio.play()
      } catch {}
    }
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
    let newETASeconds: number | null = null
    const val = newETATime.trim()
    if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(val)) {
      newETASeconds = parseHMS(val)
    } else {
      const num = Number(val)
      if (!isNaN(num) && num >= 0) {
        // treat numeric as minutes from now
        newETASeconds = currentSeconds + Math.round(num * 60)
      }
    }
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
    if (!canEdit) return
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
  }, [currentSeconds])

  // Import handlers
  const handleFileSelect = async (file: File) => {
    setImportFile(file)
    setIsProcessing(true)
    setValidationErrors([])
    setInvalidInjectRows([])
    
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
        h.includes('duetime') || h.includes('time') || h.includes('due') || h.includes('second') || h.includes('sec')
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
      const invalidRows: {rowNum:number, title:string, dueTime:string, type:string, to:string, from:string, error:string}[] = []
      const validInjects = [] as InjectItem[]
      const dueHeaderNorm = normalizedHeaders[dueTimeIdx]
      
      (dataRows as unknown[][]).forEach((row: unknown[], rowIndex) => {
        const rowNum = rowIndex + 2 // +2 because we start from row 1 and skip header
        
        const title = String(row[titleIdx] || '').trim()
        const dueTimeStr = String(row[dueTimeIdx] || '').trim()
        const typeStr = String(row[typeIdx] || 'other').trim()
        const toStr = String(row[toIdx] || '').trim()
        const fromStr = String(row[fromIdx] || '').trim()
        
        // Validate title
        if (!title) {
          const msg = `Row ${rowNum}: Title is required`
          errors.push(msg)
          invalidRows.push({ rowNum, title, dueTime: dueTimeStr, type: typeStr, to: toStr, from: fromStr, error: msg })
          return
        }
        
        // Validate and parse due time (supports HH:MM:SS, seconds absolute, or minutes relative)
        let dueSeconds: number | null = null
        if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(dueTimeStr)) {
          dueSeconds = parseHMS(dueTimeStr)
        } else {
          const num = Number(dueTimeStr)
          if (!isNaN(num) && num >= 0) {
            if (dueHeaderNorm?.includes('second') || dueHeaderNorm?.includes('sec')) {
              dueSeconds = Math.floor(num)
            } else {
              // minutes
              dueSeconds = currentSeconds + Math.round(num * 60)
            }
          }
        }
        if (dueSeconds === null) {
          const msg = `Row ${rowNum}: Invalid time "${dueTimeStr}". Use minutes (e.g., 15), HH:MM:SS (e.g., 01:30:00), or seconds.`
          errors.push(msg)
          invalidRows.push({ rowNum, title, dueTime: dueTimeStr, type: typeStr, to: toStr, from: fromStr, error: msg })
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
      setInvalidInjectRows(invalidRows)
      
    } catch {
      setValidationErrors(['Error reading file. Please ensure it is a valid CSV or Excel file.'])
    }
    
    setIsProcessing(false)
  }

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
      const loadedInjects: InjectItem[] = Array.isArray(data.injects) ? data.injects.map((i: any, idx: number) => ({
        id: generateId(),
        number: idx + 1,
        title: String(i.title || ''),
        dueSeconds: Number(i.dueSeconds || 0),
        type: mapInjectType(String(i.type || 'other')),
        status: 'pending',
        to: String(i.to || ''),
        from: String(i.from || '')
      })) : []

      const loadedResources: ResourceItem[] = Array.isArray(data.resources) ? data.resources.map((r: any) => ({
        id: generateId(),
        label: String(r.label || ''),
        etaSeconds: Number(r.etaSeconds || 0),
        status: (['requested','tasked','enroute','arrived','cancelled'].includes(String(r.status))) ? r.status as ResourceStatus : 'requested',
        kind: (['person','vehicle','group','air','capability','supply'].includes(String(r.kind))) ? r.kind as any : undefined,
      })) : []

      setInjects(renumberInjects(loadedInjects))
      setResources(loadedResources)
      if (typeof data.exerciseName === 'string') setExerciseName(data.exerciseName)
      if (typeof data.controllerName === 'string') setControllerName(data.controllerName)
      if (typeof data.exerciseFinishTime === 'string') setExerciseFinishTime(data.exerciseFinishTime)
    } catch {}
  }

  // CSV export helpers and actions
  const csvEscape = (value: unknown) => {
    const s = String(value ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const downloadCSV = (filename: string, rows: (string|number)[][]) => {
    try {
      const content = rows.map(r => r.map(csvEscape).join(',')).join('\r\n')
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {}
  }
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
    setInvalidInjectRows([])
    setImportMode('append')
  }

  const downloadTemplate = () => {
    const templateData = [
      ['Title', 'Due (minutes)', 'Type', 'To', 'From'],
      ['Fire reported at Location A', '10', 'radio/phone', 'Fire Chief', 'Control'],
      ['Evacuation request from Site B', '25', 'in person', 'Site Manager', 'Emergency Team'],
      ['Media inquiry about incident', '40', 'electronic', 'Media Liaison', 'Dispatch'],
      ['Update incident map display', '50', 'map inject', 'GIS Coordinator', 'Operations']
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
    setInvalidResourceRows([])
    
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
        h.includes('eta') || h.includes('minutes') || h.includes('time') || h.includes('second') || h.includes('sec')
      )
      const statusIdx = normalizedHeaders.findIndex(h => 
        h.includes('status')
      )
      const kindIdx = normalizedHeaders.findIndex(h => 
        h.includes('kind') || h.includes('type') || h.includes('category')
      )
      
      if (labelIdx === -1 || etaIdx === -1) {
        setResourceValidationErrors(['Required columns not found. Please ensure you have Label and ETA columns.'])
        setIsResourceProcessing(false)
        return
      }
      
      // Process rows and validate
      const errors: string[] = []
      const invalidRows: {rowNum:number, label:string, eta:string, status?:string, kind?:string, error:string}[] = []
      const validResources = [] as ResourceItem[]
      
      (dataRows as unknown[][]).forEach((row: unknown[], rowIndex) => {
        const rowNum = rowIndex + 2 // +2 because we start from row 1 and skip header
        
        const label = String(row[labelIdx] || '').trim()
        const etaStr = String(row[etaIdx] || '').trim()
        const statusStr = String(row[statusIdx] || 'requested').trim().toLowerCase()
        const kindStr = kindIdx !== -1 ? String(row[kindIdx] || '').trim() : ''
        
        // Validate label
        if (!label) {
          const msg = `Row ${rowNum}: Label is required`
          errors.push(msg)
          invalidRows.push({ rowNum, label, eta: etaStr, status: statusStr, error: msg })
          return
        }
        
        // Validate and parse ETA (supports minutes, HH:MM:SS absolute, or seconds)
        let etaSecondsAbs: number | null = null
        if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(etaStr)) {
          // Absolute HH:MM:SS from T0
          etaSecondsAbs = parseHMS(etaStr)
        } else {
          const etaHeader = normalizedHeaders[etaIdx] || ''
          const num = Number(etaStr)
          if (!isNaN(num) && num >= 0) {
            if (etaHeader.includes('second') || etaHeader.includes('sec')) {
              etaSecondsAbs = Math.floor(num)
            } else {
              // minutes (relative from current time)
              etaSecondsAbs = currentSeconds + Math.round(num * 60)
            }
          }
        }
        if (etaSecondsAbs === null) {
          const msg = `Row ${rowNum}: Invalid ETA "${etaStr}". Use minutes (e.g., 15), HH:MM:SS (e.g., 01:30:00), or seconds.`
          errors.push(msg)
          invalidRows.push({ rowNum, label, eta: etaStr, status: statusStr, error: msg })
          return
        }
        
        // Parse status
        let status: ResourceStatus = 'requested'
        if (['requested', 'tasked', 'enroute', 'arrived', 'cancelled'].includes(statusStr)) {
          status = statusStr as ResourceStatus
        }
        // Kind: explicit column, otherwise infer from label (simple heuristics)
        let kind: ResourceKind | undefined
        const kNorm = kindStr.toLowerCase()
        if (['person','vehicle','group','air','capability','supply'].includes(kNorm)) {
          kind = kNorm as ResourceKind
        } else {
          const lower = label.toLowerCase()
          if (/(officer|chief|president|planner|liaison)/.test(lower)) kind = 'person'
          else if (/(task\s*force|strike\s*team|group)/.test(lower)) kind = 'group'
          else if (/(heli|air|plane|chopper)/.test(lower)) kind = 'air'
          else if (/(drone|uav|robot|capability)/.test(lower)) kind = 'capability'
          else if (/(food|catering|water|suppl|meals|rations|feed)/.test(lower)) kind = 'supply'
          else kind = 'vehicle'
        }
        
        validResources.push({
          id: generateId(),
          label,
          etaSeconds: etaSecondsAbs,
          status,
          kind,
          createdAtSeconds: currentSeconds
        })
      })
      
      setPreviewResources(validResources)
      setResourceValidationErrors(errors)
      setInvalidResourceRows(invalidRows)
      
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
    setInvalidResourceRows([])
    setResourceImportMode('append')
  }

  const downloadResourceTemplate = () => {
    const templateData = [
      ['Label', 'Kind (optional)', 'ETA (minutes)', 'Status'],
      ['Fire Engine 1', 'vehicle', '15', 'requested'],
      ['Ambulance 2', 'vehicle', '20', 'requested'],
      ['Police Unit 3', 'vehicle', '10', 'requested'],
      ['Hazmat Team', 'group', '45', 'requested']
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
        <div className="flex items-start justify-end mb-2">
          <button
            onClick={() => { if (typeof window !== 'undefined') window.open('/display/timer', 'TimerDisplay', 'noopener,noreferrer,width=900,height=700'); }}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
            title="Open Timer Display"
            aria-label="Open Timer Display"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="text-6xl lg:text-8xl font-mono font-bold text-white mb-4 tracking-wider">
            {formatHMS(currentSeconds)}
          </div>
          <div className="flex gap-4 justify-center mb-4">
            <button
              onClick={handleStartStop}
              className="px-6 py-3 text-xl font-semibold rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ring-offset-gray-800"
            >
              {isRunning ? 'Stop' : 'Start'}
            </button>
            
            <button
              onClick={handleReset}
              className="px-6 py-3 text-xl font-semibold rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ring-offset-gray-800"
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
              className="px-3 py-2 bg-gray-700 text-white rounded font-mono text-center w-32 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
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
    
    const onKey = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleStartEdit(inject.id, field, value)
      }
    }
    const fieldLabel: Record<string, string> = {
      number: 'number', dueTime: 'due time', title: 'title', type: 'type', to: 'to', from: 'from'
    }
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleStartEdit(inject.id, field, value)}
        onKeyDown={onKey}
        className="cursor-pointer hover:bg-gray-700 hover:bg-opacity-50 px-2 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
        title="Click to edit"
        aria-label={`Edit ${fieldLabel[field] || field} for inject #${inject.number}`}
      >
        {displayValue || value}
      </div>
    )
  }

  const InjectList = () => {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">Inject Status</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={exportInjectsImportCSV}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Export Injects (Import CSV)"
              aria-label="Export Injects (Import CSV)"
            >
              <FileDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAudioEnabled(v => !v)}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
              aria-pressed={audioEnabled}
              aria-label={audioEnabled ? 'Mute audio alerts' : 'Unmute audio alerts'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Injects table">
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
                      {/* Ack */}
                      <button
                        onClick={() => handleAckInject(inject.id, !(inject.acked ?? false))}
                        className={`px-2 py-1 text-xs ${inject.acked ? 'bg-gray-600' : 'bg-teal-600 hover:bg-teal-700'} text-white rounded ${focusRing}`}
                        disabled={!canEdit}
                        title={inject.acked ? 'Unacknowledge' : 'Acknowledge'}
                        aria-label={inject.acked ? `Unacknowledge inject #${inject.number}` : `Acknowledge inject #${inject.number}`}
                      >
                        {inject.acked ? 'Unack' : 'Ack'}
                      </button>
                      {/* Snooze */}
                      <button
                        onClick={() => setSnoozeInjectId(inject.id)}
                        className={`px-2 py-1 text-xs bg-purple-700 hover:bg-purple-600 text-white rounded ${focusRing}`}
                        title="Snooze (custom)"
                        aria-label={`Snooze inject #${inject.number}`}
                        disabled={!canEdit}
                      >
                        Snooze
                      </button>
                      <button
                        onClick={() => handleSnoozeInject(inject.id, 5)}
                        className={`px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded ${focusRing}`}
                        title="Snooze +5m"
                        aria-label={`Snooze inject #${inject.number} by 5 minutes`}
                        disabled={!canEdit}
                      >
                        +5m
                      </button>
                      <button
                        onClick={() => handleSnoozeInject(inject.id, 10)}
                        className={`px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded ${focusRing}`}
                        title="Snooze +10m"
                        aria-label={`Snooze inject #${inject.number} by 10 minutes`}
                        disabled={!canEdit}
                      >
                        +10m
                      </button>
                      {inject.audioDataUrl && (
                        <button
                          onClick={() => handlePlayInjectAudio(inject.id)}
                          className={`px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded ${focusRing}`}
                          title="Play attached audio"
                          aria-label={`Play audio for inject #${inject.number}`}
                        >
                          Play
                        </button>
                      )}
                      {/* Move Up/Down */}
                      <button
                        onClick={() => handleMoveInject(inject.id, 'up')}
                        disabled={!canEdit || sortedIndex === 0}
                        className={`px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded ${focusRing}`}
                        title="Move up"
                        aria-label={`Move inject #${inject.number} up`}
                      >
                        Up
                      </button>
                      <button
                        onClick={() => handleMoveInject(inject.id, 'down')}
                        disabled={!canEdit || sortedIndex === injects.length - 1}
                        className={`px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded ${focusRing}`}
                        title="Move down"
                        aria-label={`Move inject #${inject.number} down`}
                      >
                        Down
                      </button>
                      
                      {/* Complete/Incomplete */}
                      <button
                        onClick={() => handleToggleInjectStatus(inject.id)}
                        disabled={!canEdit || inject.status === 'skipped'}
                        className={`px-2 py-1 text-xs font-semibold rounded transition-colors disabled:opacity-50 ${focusRing} ${
                          inject.status === 'completed' 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title={inject.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                        aria-label={inject.status === 'completed' ? `Mark inject #${inject.number} incomplete` : `Mark inject #${inject.number} complete`}
                      >
                        {inject.status === 'completed' ? 'Undo' : 'Done'}
                      </button>
                      {/* Skip */}
                      <button
                        onClick={() => handleSkipInject(inject.id)}
                        disabled={!canEdit || inject.status === 'skipped' || inject.status === 'completed'}
                        className={`px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded ${focusRing}`}
                        title="Skip inject"
                        aria-label={`Skip inject #${inject.number}`}
                      >
                        Skip
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteInject(inject.id)}
                        className={`px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded ${focusRing}`}
                        disabled={!canEdit}
                        title="Delete inject"
                        aria-label={`Delete inject #${inject.number}`}
                      >
                        Delete
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">Resource Requests</h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={autoAdvanceResources} onChange={(e)=>setAutoAdvanceResources(e.target.checked)} />
              Auto-advance
            </label>
            <button
              onClick={() => {
                // Import-ready CSV: minutes instead of absolute seconds
                const rows: (string|number)[][] = []
                rows.push(['Label','Kind','ETA (minutes)','Status'])
                const sorted = [...resources].sort((a,b) => a.etaSeconds - b.etaSeconds)
                sorted.forEach(r => {
                  const minutes = Math.max(0, Math.round((r.etaSeconds - currentSeconds) / 60))
                  rows.push([r.label, r.kind || '', minutes, r.status])
                })
                const name = exerciseName?.trim() ? `_${exerciseName.trim().replace(/\s+/g,'_')}` : ''
                downloadCSV(`resources_import${name}.csv`, rows)
              }}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Export Resources (Import CSV)"
              aria-label="Export Resources (Import CSV)"
            >
              <FileDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => { if (typeof window !== 'undefined') window.open('/display/resources', 'ResourcesDisplay', 'noopener,noreferrer,width=1200,height=800'); }}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
              title="Open Resources Display"
              aria-label="Open Resources Display"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Resource requests table">
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
                  <td className="px-4 py-3 text-sm text-white">
                    <span className="inline-flex items-center gap-2">
                      {getResourceStatusIcon(resource.status)}
                      {resource.kind && <span className="opacity-80">{getResourceKindIcon(resource.kind)}</span>}
                      <span>{resource.label}</span>
                    </span>
                  </td>
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
                        className={`cursor-pointer ${canEdit ? 'hover:text-blue-400' : 'text-gray-400 cursor-not-allowed'}`}
                        onClick={() => { if (canEdit) handleStartEdit(resource) }}
                        title={canEdit ? "Click to edit ETA" : "Editing locked"}
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
                          className="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white rounded"
                          disabled={!canEdit}
                        >
                          Task
                        </button>
                      )}
                      {resource.status === "tasked" && (
                        <button
                          onClick={() => handleResourceStatusChange(resource.id, "enroute")}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
                          disabled={!canEdit}
                        >
                          Dispatch
                        </button>
                      )}
                      {resource.status === "enroute" && (
                        <button
                          onClick={() => handleResourceStatusChange(resource.id, "arrived")}
                          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded"
                          disabled={!canEdit}
                        >
                          Arrive
                        </button>
                      )}
                      {!isTerminalStatus(resource.status) && (
                        <button
                          onClick={() => handleResourceStatusChange(resource.id, "cancelled")}
                          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded"
                          disabled={!canEdit}
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
        <p className="text-gray-400 text-xs mb-2">Due can be minutes (e.g., 15), HH:MM:SS from start (e.g., 01:30:00), or seconds (e.g., 5400).</p>
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

  const InvalidInjectRowsTable = () => {
    if (invalidInjectRows.length === 0) return null
    const rows = invalidInjectRows.slice(0, 50)
    return (
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-red-400 mb-3">Invalid Rows ({invalidInjectRows.length})</h4>
        <div className="overflow-x-auto max-h-64 border border-red-600 rounded">
          <table className="w-full text-sm" aria-label="Invalid inject rows">
            <thead className="bg-red-900 bg-opacity-40 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-white">Row</th>
                <th className="px-3 py-2 text-left text-white">Title</th>
                <th className="px-3 py-2 text-left text-white">Due Time</th>
                <th className="px-3 py-2 text-left text-white">Type</th>
                <th className="px-3 py-2 text-left text-white">To</th>
                <th className="px-3 py-2 text-left text-white">From</th>
                <th className="px-3 py-2 text-left text-white">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-red-800 bg-red-950 bg-opacity-20">
                  <td className="px-3 py-2 text-red-300 font-mono">{r.rowNum}</td>
                  <td className="px-3 py-2 text-red-300">{r.title || '-'}</td>
                  <td className="px-3 py-2 text-red-300 font-mono">{r.dueTime || '-'}</td>
                  <td className="px-3 py-2 text-red-300">{r.type || '-'}</td>
                  <td className="px-3 py-2 text-red-300">{r.to || '-'}</td>
                  <td className="px-3 py-2 text-red-300">{r.from || '-'}</td>
                  <td className="px-3 py-2 text-red-200">{r.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
    )
  }

  const ValidationList = () => {
    if (validationErrors.length === 0) return null

    const displayErrors = validationErrors.slice(0, 50)
    const remaining = validationErrors.length - displayErrors.length

    return (
      <div className="mt-4" aria-live="polite">
        <h4 className="text-lg font-semibold text-red-400 mb-3">Validation Errors ({validationErrors.length})</h4>
        <div className="max-h-32 overflow-y-auto bg-red-900 bg-opacity-20 border border-red-600 rounded p-3">
          {displayErrors.map((error, index) => (
            <div key={index} className="text-red-400 text-sm mb-1">{error}</div>
          ))}
          {remaining > 0 && (
            <div className="text-red-300 text-xs mt-2">... and {remaining} more. Fix top issues first.</div>
          )}
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
                    <InvalidInjectRowsTable />
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
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
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
          <p className="text-gray-400 text-xs mt-1">ETA can be minutes (e.g., 15), HH:MM:SS from start (e.g., 01:30:00), or seconds (e.g., 5400). Optional Kind: person, vehicle, group, air, capability, supply.</p>
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
                <span className="text-red-500">-</span>
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
            <table className="w-full border border-gray-600 rounded" aria-label="Preview resources">
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

    const ResourceInvalidRowsTable = () => {
      if (invalidResourceRows.length === 0) return null
      const rows = invalidResourceRows.slice(0, 50)
      return (
        <div className="mb-4">
          <h4 className="text-red-400 font-semibold mb-2">Invalid Rows ({invalidResourceRows.length})</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-red-700 rounded" aria-label="Invalid resource rows">
              <thead>
                <tr className="bg-red-900 bg-opacity-40">
                  <th className="p-2 text-left text-white">Row</th>
                  <th className="p-2 text-left text-white">Label</th>
                  <th className="p-2 text-left text-white">ETA</th>
                  <th className="p-2 text-left text-white">Status</th>
                  <th className="p-2 text-left text-white">Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-red-800 bg-red-950 bg-opacity-20">
                    <td className="p-2 text-red-300 font-mono">{r.rowNum}</td>
                    <td className="p-2 text-red-300">{r.label || '-'}</td>
                    <td className="p-2 text-red-300">{r.eta || '-'}</td>
                    <td className="p-2 text-red-300 capitalize">{r.status || '-'}</td>
                    <td className="p-2 text-red-200">{r.error}</td>
                  </tr>
                ))}
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
                    <ResourceInvalidRowsTable />
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
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInPerson}
                  onChange={(e) => setShowInPerson(e.target.checked)}
                  className="mr-2"
                />
                <span className="inline-flex items-center gap-1 text-blue-400"><User size={14} className="inline" /> In Person</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showRadioPhone}
                  onChange={(e) => setShowRadioPhone(e.target.checked)}
                  className="mr-2"
                />
                <span className="inline-flex items-center gap-1 text-green-400"><Phone size={14} className="inline" /> Radio/Phone</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showElectronic}
                  onChange={(e) => setShowElectronic(e.target.checked)}
                  className="mr-2"
                />
                <span className="inline-flex items-center gap-1 text-purple-400"><Cpu size={14} className="inline" /> Electronic</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showMapInject}
                  onChange={(e) => setShowMapInject(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-red-400 text-sm"><MapPin size={14} className="inline" /> Map Inject</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOther}
                  onChange={(e) => setShowOther(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-orange-400 text-sm"><Tag size={14} className="inline" /> Other</span>
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
                <span className="text-gray-400 text-sm"><Clock size={14} className="inline" /> Requested</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showTaskedStatus}
                  onChange={(e) => setShowTaskedStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-amber-400 text-sm"><ClipboardCheck size={14} className="inline" /> Tasked</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showEnrouteStatus}
                  onChange={(e) => setShowEnrouteStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-blue-400 text-sm"><Truck size={14} className="inline" /> Enroute</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showArrivedStatus}
                  onChange={(e) => setShowArrivedStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-green-400 text-sm"><CheckCircle2 size={14} className="inline" /> Arrived</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showCancelledStatus}
                  onChange={(e) => setShowCancelledStatus(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-red-400 text-sm"><XCircle size={14} className="inline" /> Cancelled</span>
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
            <span className="inline-flex items-center gap-1 text-blue-400"><User size={14} className="inline" /> In Person</span>
            <span className="inline-flex items-center gap-1 text-green-400"><Phone size={14} className="inline" /> Radio/Phone</span>
            <span className="inline-flex items-center gap-1 text-purple-400"><Cpu size={14} className="inline" /> Electronic</span>
            <span className="inline-flex items-center gap-1 text-red-400"><MapPin size={14} className="inline" /> Map Inject</span>
            <span className="inline-flex items-center gap-1 text-orange-400"><Tag size={14} className="inline" /> Other</span>
            <span className="text-gray-400">Resources</span>
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
                        ? getInjectTypeIcon(stack.items[0].type)
                        : getResourceKindIcon(stack.items[0].kind)}
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
                            ? getInjectTypeIcon(item.type)
                            : getResourceKindIcon(item.kind)}
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
          readonly
        />

        {/* Main Section: Timer and Resource Requests side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TimerControls />
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
              disabled={ !canEdit} 
            />
            {/* Add Resource Form */}
            <AddResourceForm 
              onAddResource={handleAddResourceCallback} 
              onImportClick={handleResourceImportClickCallback}
              disabled={ !canEdit} 
            />
        </div>
        </div>

        
        {/* Import Modal */}
        <ImportInjectsModal />
        <ImportResourcesModal />
        {/* Snooze Modal */}
        {snoozeInjectId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xl font-semibold text-white">Snooze Inject</h4>
                <button onClick={() => { setSnoozeInjectId(null); setSnoozeInput("") }} className="text-gray-400 hover:text-white" aria-label="Close snooze dialog">×</button>
              </div>
              <p className="text-gray-300 mb-3">Enter minutes or HH:MM:SS.</p>
              <input
                type="text"
                value={snoozeInput}
                onChange={(e) => setSnoozeInput(e.target.value)}
                placeholder="e.g., 5 or 01:30:00"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono mb-4"
              />
              <div className="flex gap-2 mb-4">
                {[1,5,10,15].map((m) => (
                  <button
                    key={m}
                    onClick={() => { if (snoozeInjectId) { handleSnoozeInject(snoozeInjectId, m); setSnoozeInjectId(null); setSnoozeInput('') } }}
                    className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded"
                  >
                    +{m}m
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setSnoozeInjectId(null); setSnoozeInput('') }} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                <button
                  onClick={() => {
                    if (!snoozeInjectId) return
                    const val = snoozeInput.trim()
                    if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(val)) {
                      const abs = parseHMS(val)
                      if (abs !== null) {
                        // Use absolute HH:MM:SS from start; convert to minutes from now
                        const mins = Math.max(0, Math.round((abs - currentSeconds)/60))
                        handleSnoozeInject(snoozeInjectId, mins)
                      }
                    } else {
                      const minsNum = Number(val)
                      if (!isNaN(minsNum) && minsNum >= 0) {
                        handleSnoozeInject(snoozeInjectId, minsNum)
                      }
                    }
                    setSnoozeInjectId(null)
                    setSnoozeInput('')
                  }}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded"
                >
                  Snooze
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50" aria-live="polite">
          <div className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg border border-gray-600">
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}












