"use client"

// Simple cross-window sync using BroadcastChannel with storage fallback

export type DashboardState = {
  exerciseName: string
  controllerName: string
  exerciseFinishTime: string
  currentSeconds: number
  injects: any[]
  resources: any[]
}

const CHANNEL_NAME = "excon-dashboard-sync-v1"
const STORAGE_KEY = "excon-dashboard-state-v1"

let bc: BroadcastChannel | null = null
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  bc = new BroadcastChannel(CHANNEL_NAME)
}

export type SyncMessage = {
  type: "state"
  payload: DashboardState
  ts: number
}

type Unsubscribe = () => void

export function publishState(state: DashboardState) {
  const msg: SyncMessage = { type: "state", payload: state, ts: Date.now() }
  try {
    if (bc) bc.postMessage(msg)
    // storage fallback: update a mirror key to trigger the storage event
    if (typeof window !== "undefined") {
      localStorage.setItem("excon-dashboard-sync-ping", String(msg.ts))
    }
  } catch {}
}

export function subscribeState(onMessage: (state: DashboardState) => void): Unsubscribe {
  const onBC = (e: MessageEvent<SyncMessage>) => {
    if (e.data && e.data.type === "state") {
      onMessage(e.data.payload)
    }
  }
  const onStorage = (e: StorageEvent) => {
    // When the primary state changes, displays can re-read snapshot from STORAGE_KEY
    if (e.key === "excon-dashboard-sync-ping" || e.key === STORAGE_KEY) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) onMessage(JSON.parse(raw))
      } catch {}
    }
  }

  if (bc) bc.addEventListener("message", onBC)
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage)

  return () => {
    if (bc) bc.removeEventListener("message", onBC)
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage)
  }
}

export function readSnapshot(): DashboardState | null {
  try {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DashboardState) : null
  } catch {
    return null
  }
}

