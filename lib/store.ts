"use client"

import { create } from 'zustand'
import type { DashboardState, InjectItem, ResourceItem } from './types'

type TimerSlice = {
  currentSeconds: number
  isRunning: boolean
  start: () => void
  stop: () => void
  reset: () => void
  setSeconds: (s: number) => void
  tick: () => void
}

type InjectsSlice = {
  injects: InjectItem[]
  setInjects: (next: InjectItem[] | ((prev: InjectItem[]) => InjectItem[])) => void
}

type ResourcesSlice = {
  resources: ResourceItem[]
  setResources: (next: ResourceItem[] | ((prev: ResourceItem[]) => ResourceItem[])) => void
}

type MetaSlice = {
  exerciseName: string
  controllerName: string
  exerciseFinishTime: string
  setExerciseName: (v: string) => void
  setControllerName: (v: string) => void
  setExerciseFinishTime: (v: string) => void
}

export type DashboardStore = TimerSlice & InjectsSlice & ResourcesSlice & MetaSlice

export const useDashboardStore = create<DashboardStore>((set) => ({
  // Timer
  currentSeconds: 0,
  isRunning: false,
  start: () => set({ isRunning: true }),
  stop: () => set({ isRunning: false }),
  reset: () => set({ currentSeconds: 0, isRunning: false }),
  setSeconds: (s) => set({ currentSeconds: s }),
  tick: () => set((s) => ({ currentSeconds: s.currentSeconds + 1 })),

  // Injects
  injects: [],
  setInjects: (next) => set((s) => ({ injects: typeof next === 'function' ? (next as (prev: InjectItem[]) => InjectItem[])(s.injects) : next })),

  // Resources
  resources: [],
  setResources: (next) => set((s) => ({ resources: typeof next === 'function' ? (next as (prev: ResourceItem[]) => ResourceItem[])(s.resources) : next })),

  // Meta
  exerciseName: '',
  controllerName: '',
  exerciseFinishTime: '',
  setExerciseName: (v) => set({ exerciseName: v }),
  setControllerName: (v) => set({ controllerName: v }),
  setExerciseFinishTime: (v) => set({ exerciseFinishTime: v }),
}))

// Helper to capture a full snapshot in the DashboardState shape
export function getDashboardSnapshot(get: () => DashboardStore): DashboardState {
  const s = get()
  return {
    exerciseName: s.exerciseName,
    controllerName: s.controllerName,
    exerciseFinishTime: s.exerciseFinishTime,
    currentSeconds: s.currentSeconds,
    injects: s.injects,
    resources: s.resources,
  }
}
