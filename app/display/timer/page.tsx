"use client"

import React, { useEffect, useState } from "react"
import { readSnapshot, subscribeState } from "@/lib/sync"
import type { DashboardState } from "@/lib/types"

export default function TimerDisplayPage() {
  const [state, setState] = useState<DashboardState | null>(null)

  useEffect(() => {
    // initial hydrate
    setState(readSnapshot())
    // subscribe for live updates
    const unsub = subscribeState(setState)
    return () => unsub()
  }, [])

  const formatHMS = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-6">
        {state?.exerciseName ? (
          <h1 className="text-3xl md:text-5xl font-bold tracking-wide">{state.exerciseName}</h1>
        ) : null}
        {state?.controllerName ? (
          <p className="text-blue-300 mt-2">Controller: {state.controllerName}</p>
        ) : null}
      </div>
      <div className="text-8xl md:text-[10rem] font-mono font-extrabold tracking-wider" aria-label="Exercise timer">
        {formatHMS(state?.currentSeconds ?? 0)}
      </div>
      {state?.exerciseFinishTime ? (
        <div className="mt-6 text-gray-300">Finish: {state.exerciseFinishTime}</div>
      ) : null}
    </div>
  )
}
