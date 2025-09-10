"use client"

import React, { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { formatHMS, parseHMS } from '@/lib/time'
import { useDashboardStore } from '@/lib/store'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ring-offset-gray-800'

const TimerControls: React.FC = () => {
  const currentSeconds = useDashboardStore(s => s.currentSeconds)
  const isRunning = useDashboardStore(s => s.isRunning)
  const start = useDashboardStore(s => s.start)
  const stop = useDashboardStore(s => s.stop)
  const reset = useDashboardStore(s => s.reset)
  const setSeconds = useDashboardStore(s => s.setSeconds)

  const handleStartStop = () => {
    if (isRunning) stop()
    else start()
  }

  const handleReset = () => {
    reset()
  }

  const handleManualTimeSet = (timeInput: string) => {
    const parsedSeconds = parseHMS(timeInput)
    if (parsedSeconds !== null) {
      setSeconds(parsedSeconds)
    }
  }

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
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.open(
                '/display/timer',
                'TimerDisplay',
                'noopener,noreferrer,width=900,height=700'
              )
            }
          }}
          className={`p-2 rounded bg-gray-700 hover:bg-gray-600 text-white ${focusRing}`}
          title="Open Timer Display"
          aria-label="Open Timer Display"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
      <div className="text-center mb-6">
        <div className="text-5xl md:text-7xl xl:text-8xl font-mono font-bold text-white mb-4 tracking-wider">
          {formatHMS(currentSeconds)}
        </div>
        <div className="flex gap-4 justify-center mb-4">
          <button
            onClick={handleStartStop}
            className={`px-6 py-3 text-xl font-semibold rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] ${focusRing}`}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>

          <button
            onClick={handleReset}
            className={`px-6 py-3 text-xl font-semibold rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white min-w-[120px] ${focusRing}`}
          >
            Reset
          </button>
        </div>
        <form onSubmit={handleManualSubmit} className="flex gap-2 justify-center">
          <input
            type="text"
            placeholder="HH:MM:SS"
            value={manualTime}
            onChange={e => setManualTime(e.target.value)}
            className={`px-3 py-2 bg-gray-700 text-white rounded font-mono text-center w-32 ${focusRing}`}
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

export default TimerControls

