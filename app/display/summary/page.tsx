"use client"

import React, { useEffect, useMemo, useState } from "react"
import { readSnapshot, subscribeState, type DashboardState } from "@/lib/sync"

export default function SummaryDisplayPage() {
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

  const injectRows = useMemo(() => {
    const injects = (state?.injects ?? []) as Array<{
      id: string
      number: number
      title: string
      dueSeconds: number
      type: string
      status: string
      to: string
      from: string
    }>
    return [...injects].sort((a, b) => a.dueSeconds - b.dueSeconds)
  }, [state])

  const resourceRows = useMemo(() => {
    const resources = (state?.resources ?? []) as Array<{
      id: string
      label: string
      etaSeconds: number
      status: string
      kind?: string
    }>
    return [...resources].sort((a, b) => a.etaSeconds - b.etaSeconds)
  }, [state])

  // timeline snippet (compact)
  const maxSeconds = useMemo(() => {
    const injMax = Math.max(0, ...(injectRows.map(i => i.dueSeconds)))
    const resMax = Math.max(0, ...(resourceRows.map(r => r.etaSeconds)))
    return Math.max(injMax, resMax, (state?.currentSeconds ?? 0))
  }, [injectRows, resourceRows, state])

  const width = 900
  const getX = (sec: number) => maxSeconds > 0 ? Math.round((sec / maxSeconds) * width) : 0

  return (
    <div className="min-h-screen bg-white text-black p-6 print:p-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-3xl font-bold">{state?.exerciseName || 'Exercise Summary'}</h1>
            {state?.controllerName ? (
              <div className="text-gray-600">Controller: {state.controllerName}</div>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Logo" className="h-8 w-auto hidden md:block" />
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Print
          </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-5xl font-mono font-extrabold tracking-wider text-center">
            {formatHMS(state?.currentSeconds ?? 0)}
          </div>
          {state?.exerciseFinishTime ? (
            <div className="text-center text-gray-600 mt-2">Finish: {state.exerciseFinishTime}</div>
          ) : null}
        </div>

        {/* Timeline snippet */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Timeline</h2>
          <div className="relative border border-gray-300 rounded p-4 overflow-hidden">
            <div className="relative mx-auto" style={{ width: `${width}px`, height: 80 }}>
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-300" />
              {/* markers every 10 minutes approx */}
              {Array.from({ length: 6 }).map((_, idx) => {
                const sec = Math.round((idx / 5) * maxSeconds)
                return (
                  <div key={idx} className="absolute text-xs text-gray-500 -translate-x-1/2" style={{ left: `${getX(sec)}px`, top: 0 }}>
                    {formatHMS(sec)}
                    <div className="w-[1px] h-8 bg-gray-300 mx-auto mt-1" />
                  </div>
                )
              })}
              {/* Inject dots */}
              {injectRows.map(i => (
                <div key={`inj-${i.id}`} className="absolute -translate-x-1/2" style={{ left: `${getX(i.dueSeconds)}px`, top: 26 }} title={`#${i.number} ${i.title}`}>
                  <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow" />
                </div>
              ))}
              {/* Resource diamonds */}
              {resourceRows.map(r => (
                <div key={`res-${r.id}`} className="absolute -translate-x-1/2 rotate-45" style={{ left: `${getX(r.etaSeconds)}px`, top: 46 }} title={`${r.label} (${r.status})`}>
                  <div className="w-3 h-3 bg-green-500 border border-white shadow" />
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="mt-3 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                <span>Injects</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rotate-45 bg-green-500" />
                <span>Resources</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Injects</h2>
          <table className="w-full border border-gray-300 text-sm" aria-label="Printable injects">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Due</th>
                <th className="p-2 text-left">Seconds</th>
                <th className="p-2 text-left">From</th>
                <th className="p-2 text-left">To</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {injectRows.map((i) => (
                <tr key={i.id} className="border-t border-gray-200">
                  <td className="p-2 font-mono">{i.number}</td>
                  <td className="p-2 font-mono">{formatHMS(i.dueSeconds)}</td>
                  <td className="p-2 font-mono">{i.dueSeconds}</td>
                  <td className="p-2">{i.from || '-'}</td>
                  <td className="p-2">{i.to || '-'}</td>
                  <td className="p-2 capitalize">{i.type}</td>
                  <td className="p-2">{i.title}</td>
                  <td className="p-2 capitalize">{i.status}</td>
                </tr>
              ))}
              {injectRows.length === 0 && (
                <tr><td className="p-3 text-center text-gray-500" colSpan={7}>No injects</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Resources</h2>
          <table className="w-full border border-gray-300 text-sm" aria-label="Printable resources">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Label</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Kind</th>
                <th className="p-2 text-left">ETA</th>
                <th className="p-2 text-left">Seconds</th>
              </tr>
            </thead>
            <tbody>
              {resourceRows.map((r) => (
                <tr key={r.id} className="border-t border-gray-200">
                  <td className="p-2">{r.label}</td>
                  <td className="p-2 capitalize">{r.status}</td>
                  <td className="p-2 capitalize">{r.kind || '-'}</td>
                  <td className="p-2 font-mono">{formatHMS(r.etaSeconds)}</td>
                  <td className="p-2 font-mono">{r.etaSeconds}</td>
                </tr>
              ))}
              {resourceRows.length === 0 && (
                <tr><td className="p-3 text-center text-gray-500" colSpan={4}>No resources</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
