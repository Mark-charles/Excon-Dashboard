"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { readSnapshot, subscribeState, publishState, type DashboardState } from "@/lib/sync"
import { FileDown, Upload, Printer, ExternalLink, Trash2, ArrowLeft } from "lucide-react"

export default function AdminPage() {
  const [snap, setSnap] = useState<DashboardState | null>(null)
  const [exerciseName, setExerciseName] = useState("")
  const [controllerName, setControllerName] = useState("")
  const [exerciseFinishTime, setExerciseFinishTime] = useState("")
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const [injects, setInjects] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [showReset, setShowReset] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [appendScenario, setAppendScenario] = useState(false)
  const [role, setRole] = useState<string>(() => {
    if (typeof window === 'undefined') return 'admin'
    return localStorage.getItem('excon-role') || 'admin'
  })
  const [editLock, setEditLock] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return (localStorage.getItem('excon-edit-lock') || 'false') === 'true'
  })
  const [toast, setToast] = useState<string | null>(null)

  // hydrate + subscribe
  useEffect(() => {
    const s = readSnapshot()
    if (s) {
      setSnap(s)
      setExerciseName(s.exerciseName || "")
      setControllerName(s.controllerName || "")
      setExerciseFinishTime(s.exerciseFinishTime || "")
      setCurrentSeconds(s.currentSeconds || 0)
      setInjects(Array.isArray(s.injects) ? s.injects : [])
      setResources(Array.isArray(s.resources) ? s.resources : [])
    }
    const unsub = subscribeState((ns) => {
      setSnap(ns)
      setExerciseName(ns.exerciseName || "")
      setControllerName(ns.controllerName || "")
      setExerciseFinishTime(ns.exerciseFinishTime || "")
      setCurrentSeconds(ns.currentSeconds || 0)
      setInjects(Array.isArray(ns.injects) ? ns.injects : [])
      setResources(Array.isArray(ns.resources) ? ns.resources : [])
    })
    return () => unsub()
  }, [])

  const persist = (next: Partial<DashboardState>) => {
    const state: DashboardState = {
      exerciseName,
      controllerName,
      exerciseFinishTime,
      currentSeconds,
      injects,
      resources,
      ...next,
    }
    try {
      localStorage.setItem('excon-dashboard-state-v1', JSON.stringify(state))
      publishState(state)
      setToast('Saved')
      setTimeout(() => setToast(null), 1500)
    } catch {}
  }

  // Scenario save/load
  const saveScenario = () => {
    const scenario = {
      version: 'excon-scenario-v1',
      exerciseName,
      controllerName,
      exerciseFinishTime,
      injects: [...injects]
        .sort((a:any,b:any)=>a.dueSeconds-b.dueSeconds)
        .map((i:any)=>({ title:i.title, dueSeconds:i.dueSeconds, type:i.type, to:i.to, from:i.from })),
      resources: [...resources]
        .sort((a:any,b:any)=>a.etaSeconds-b.etaSeconds)
        .map((r:any)=>({ label:r.label, etaSeconds:r.etaSeconds, status:r.status, kind:r.kind }))
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
  }

  const handleScenarioFile = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data || data.version !== 'excon-scenario-v1') return
      const loadedInjects = Array.isArray(data.injects) ? data.injects.map((i:any, idx:number)=>({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`,
        number: idx+1,
        title: String(i.title||''),
        dueSeconds: Number(i.dueSeconds||0),
        type: String(i.type||'other'),
        status: 'pending',
        to: String(i.to||''),
        from: String(i.from||'')
      })) : []
      const loadedResources = Array.isArray(data.resources) ? data.resources.map((r:any)=>({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`,
        label: String(r.label||''),
        etaSeconds: Number(r.etaSeconds||0),
        status: ['requested','tasked','enroute','arrived','cancelled'].includes(String(r.status)) ? r.status : 'requested',
        kind: ['person','vehicle','group','air','capability','supply'].includes(String(r.kind)) ? r.kind : undefined,
      })) : []

      let next: DashboardState
      if (appendScenario) {
        next = {
          exerciseName,
          controllerName,
          exerciseFinishTime,
          currentSeconds,
          injects: [...injects, ...loadedInjects].map((i:any, idx:number) => ({ ...i, number: idx+1 })),
          resources: [...resources, ...loadedResources],
        }
      } else {
        next = {
          exerciseName: String(data.exerciseName || exerciseName),
          controllerName: String(data.controllerName || controllerName),
          exerciseFinishTime: String(data.exerciseFinishTime || exerciseFinishTime),
          currentSeconds: typeof data.currentSeconds === 'number' ? data.currentSeconds : 0,
          injects: loadedInjects.map((i:any, idx:number)=>({ ...i, number: idx+1 })),
          resources: loadedResources,
        }
      }
      setExerciseName(next.exerciseName)
      setControllerName(next.controllerName)
      setExerciseFinishTime(next.exerciseFinishTime)
      setCurrentSeconds(next.currentSeconds)
      setInjects(next.injects)
      setResources(next.resources)
      persist(next)
    } catch {}
  }

  const doResetAll = () => {
    const cleared: DashboardState = {
      exerciseName: "",
      controllerName: "",
      exerciseFinishTime: "",
      currentSeconds: 0,
      injects: [],
      resources: []
    }
    setExerciseName("")
    setControllerName("")
    setExerciseFinishTime("")
    setCurrentSeconds(0)
    setInjects([])
    setResources([])
    setShowReset(false)
    setConfirmText("")
    try {
      localStorage.setItem('excon-dashboard-state-v1', JSON.stringify(cleared))
      publishState(cleared)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Administration</h1>
          <Link href="/dashboard" className="text-gray-300 hover:text-white flex items-center gap-2" aria-label="Back to dashboard">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Exercise Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-300 mb-1">Exercise Name</label>
              <input value={exerciseName} onChange={(e)=>{setExerciseName(e.target.value); persist({exerciseName:e.target.value})}} className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-300 mb-1">Controller Name</label>
              <input value={controllerName} onChange={(e)=>{setControllerName(e.target.value); persist({controllerName:e.target.value})}} className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-300 mb-1">Exercise Finish Time</label>
              <input value={exerciseFinishTime} onChange={(e)=>{setExerciseFinishTime(e.target.value); persist({exerciseFinishTime:e.target.value})}} className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none" placeholder="HH:MM:SS" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-1 block">Role</label>
              <select value={role} onChange={(e)=>{ setRole(e.target.value); localStorage.setItem('excon-role', e.target.value); setToast('Saved'); setTimeout(()=>setToast(null), 1200) }} className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600">
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editLock} onChange={(e)=>{ setEditLock(e.target.checked); localStorage.setItem('excon-edit-lock', String(e.target.checked)); setToast('Saved'); setTimeout(()=>setToast(null), 1200) }} />
                <span className="text-gray-300">Lock editing (admins bypass)</span>
              </label>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={()=>persist({})} className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600">Save</button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Scenario Templates</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={saveScenario} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-2" aria-label="Save Scenario JSON">
              <FileDown className="w-4 h-4" /> Save Scenario (JSON)
            </button>
            <>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if (f) handleScenarioFile(f)}} />
              <button onClick={()=>fileRef.current?.click()} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-2" aria-label="Load Scenario JSON">
                <Upload className="w-4 h-4" /> Load Scenario (JSON)
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={appendScenario} onChange={(e)=>setAppendScenario(e.target.checked)} />
                Append (otherwise Replace)
              </label>
            </>
            <button onClick={()=>{ if (typeof window !== 'undefined') window.open('/display/summary','SummaryDisplay','noopener,noreferrer,width=1200,height=900') }} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-2" aria-label="Open Printable Summary">
              <Printer className="w-4 h-4" /> Open Printable Summary
            </button>
            <button onClick={()=>{ if (typeof window !== 'undefined') window.open('/display/timer','TimerDisplay','noopener,noreferrer,width=900,height=700') }} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-2" aria-label="Open Timer Display">
              <ExternalLink className="w-4 h-4" /> Open Timer Display
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-red-400">Danger Zone</h2>
          <p className="text-gray-300 mb-3">Resetting clears all injects, resources, and timer, and wipes exercise details. This action cannot be undone.</p>
          {!showReset ? (
            <button onClick={()=>setShowReset(true)} className="px-4 py-2 rounded bg-red-700 hover:bg-red-600 flex items-center gap-2" aria-label="Reset all data">
              <Trash2 className="w-4 h-4" /> Reset All Data
            </button>
          ) : (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-4">
              <p className="mb-2">Type <span className="font-mono">RESET</span> to confirm:</p>
              <div className="flex gap-2">
                <input value={confirmText} onChange={(e)=>setConfirmText(e.target.value)} className="px-3 py-2 bg-gray-900 text-white rounded border border-red-700 focus:outline-none" />
                <button onClick={doResetAll} disabled={confirmText !== 'RESET'} className={`px-4 py-2 rounded ${confirmText==='RESET' ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>Confirm Reset</button>
                <button onClick={()=>{setShowReset(false); setConfirmText('')}} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Cancel</button>
              </div>
            </div>
          )}
        </div>
        {toast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded">{toast}</div>
        )}
      </div>
    </div>
  )
}
