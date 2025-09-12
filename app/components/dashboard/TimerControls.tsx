'use client'

import React, { useState } from 'react'
import { formatHMS } from '../../utils/timeUtils'

interface TimerControlsProps {
  currentSeconds: number
  isRunning: boolean
  onStartStop: () => void
  onReset: () => void
  onManualTimeSet: (timeInput: string) => void
}

const TimerControls: React.FC<TimerControlsProps> = ({
  currentSeconds,
  isRunning,
  onStartStop,
  onReset,
  onManualTimeSet
}) => {
  const [manualTime, setManualTime] = useState('')

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualTime.trim()) {
      onManualTimeSet(manualTime.trim())
      setManualTime('')
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="text-center mb-6">
        <div className="text-6xl lg:text-8xl font-mono font-bold text-white mb-4 tracking-wider">
          {formatHMS(currentSeconds)}
        </div>
        
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

        <form onSubmit={handleManualSubmit} className="flex gap-2 justify-center">
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
        </form>
      </div>
    </div>
  )
}

export default TimerControls