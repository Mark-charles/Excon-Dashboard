"use client"

import React, { useEffect, useMemo, useState } from "react"
import { readSnapshot, subscribeState, type DashboardState } from "@/lib/sync"

type ResourceStatus = "requested" | "tasked" | "enroute" | "arrived" | "cancelled"

export default function ResourcesDisplayPage() {
  const [state, setState] = useState<DashboardState | null>(null)

  useEffect(() => {
    setState(readSnapshot())
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

  const rows = useMemo(() => {
    const resources = (state?.resources ?? []) as Array<{
      id: string
      label: string
      etaSeconds: number
      status: ResourceStatus
      kind?: string
    }>
    const now = state?.currentSeconds ?? 0
    return resources
      .slice()
      .sort((a, b) => a.etaSeconds - b.etaSeconds)
      .map((r) => ({
        ...r,
        eta: formatHMS(Math.max(r.etaSeconds - now, 0)),
      }))
  }, [state])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mb-6 text-center">
        {state?.exerciseName ? (
          <h1 className="text-3xl md:text-5xl font-bold tracking-wide">{state.exerciseName}</h1>
        ) : null}
        <h2 className="text-2xl md:text-3xl text-gray-300 mt-2">Resources Board</h2>
      </div>

      <div className="max-w-6xl mx-auto">
        <table className="w-full text-lg" aria-label="Resources display table">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="text-left p-3">Label</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">ETA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-700">
                <td className="p-3">{r.label}</td>
                <td className="p-3 capitalize">{r.status}</td>
                <td className="p-3 font-mono">{r.eta}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan={3}>
                  No resources
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
