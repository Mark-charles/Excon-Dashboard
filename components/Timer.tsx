"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { ExternalLink } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { formatHMS, parseHMS } from '@/lib/time'

export default function Timer() {
  const currentSeconds = useDashboardStore(s => s.currentSeconds)
  const isRunning = useDashboardStore(s => s.isRunning)
  const start = useDashboardStore(s => s.start)
  const stop = useDashboardStore(s => s.stop)
  const reset = useDashboardStore(s => s.reset)
  const setSeconds = useDashboardStore(s => s.setSeconds)
  const tick = useDashboardStore(s => s.tick)

  const [manualTime, setManualTime] = useState('')

  // Drive the ticking when running
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null
    if (isRunning) {
      id = setInterval(() => {
        tick()
      }, 1000)
    }
    return () => { if (id) clearInterval(id) }
  }, [isRunning, tick])

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTime.trim()) return
    const parsed = parseHMS(manualTime.trim())
    if (parsed !== null) {
      setSeconds(parsed)
      setManualTime('')
    }
  }, [manualTime, setSeconds])

  const handleStartStop = () => (isRunning ? stop() : start())

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-end mb-2">
        <button
          onClick={() => { if (typeof window !== 'undefined') window.open('/display/timer', 'TimerDisplay', 'noopener,noreferrer,width=900,height=700') }}
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
            onClick={reset}
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

