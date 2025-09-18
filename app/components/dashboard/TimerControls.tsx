'use client'

import React, { useState } from 'react'
import { formatHMS } from '../../utils/timeUtils'

interface TimerControlsProps {
  currentSeconds: number
  isRunning: boolean
  onStartStop: () => void
  onReset: () => void
  onManualTimeSet: (timeInput: string) => boolean
  soundEnabled: boolean
  onToggleSound: () => void
  onPopout?: () => void
}

const TimerControls: React.FC<TimerControlsProps> = ({
  currentSeconds,
  isRunning,
  onStartStop,
  onReset,
  onManualTimeSet,
  soundEnabled,
  onToggleSound,
  onPopout
}) => {
  const [manualTime, setManualTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualTime.trim()) {
      const ok = onManualTimeSet(manualTime.trim())
      if (ok) {
        setManualTime('')
        setError(null)
      } else {
        setError('Invalid time. Use HH:MM:SS (e.g., 01:05:30).')
      }
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="text-left">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Exercise Timer</div>
          <div className="text-6xl lg:text-7xl font-mono font-bold text-white tracking-wider">
            {formatHMS(currentSeconds)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute inject alerts' : 'Unmute inject alerts'}
            aria-pressed={soundEnabled}
            className={`p-2 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900 ${soundEnabled ? 'text-emerald-300 border-emerald-400/60 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-gray-300 border-gray-600/60 bg-gray-700/40 hover:bg-gray-700/60'}`}
          >
            {soundEnabled ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 15h3l4 4V5L8 9H5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M16 9a3 3 0 010 6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M18.5 7a6 6 0 010 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 15h3l4 4V5L8 9H5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M16 9l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            )}
          </button>
          {onPopout && (
            <button
              type="button"
              onClick={onPopout}
              aria-label="Open timer in a new window"
              className="p-2 rounded-lg border border-gray-600/60 text-gray-200 bg-gray-700/40 hover:text-white hover:border-blue-400/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M7 7h10v10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M17 7l-8 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M7 17h10" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={onStartStop}
            className="px-6 py-3 text-xl font-semibold rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          
          <button
            onClick={onReset}
            className="px-6 py-3 text-xl font-semibold rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleManualSubmit} className="flex flex-col gap-2 items-center justify-center">
          <input
            type="text"
            placeholder="HH:MM:SS"
            value={manualTime}
            onChange={(e) => setManualTime(e.target.value)}
            className="px-3 py-2 bg-gray-700 text-white rounded font-mono text-center w-32"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
          >
            Set
          </button>
          {error && (
            <div className="text-red-400 text-sm" role="alert" aria-live="polite">{error}</div>
          )}
        </form>
      </div>
    </div>
  )
}

export default TimerControls
