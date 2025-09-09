"use client"

import React, { useCallback } from 'react'
import Link from 'next/link'
import { Cog } from 'lucide-react'

export type ExerciseHeaderProps = {
  exerciseName: string
  controllerName: string
  exerciseFinishTime: string
  onExerciseNameChange: (value: string) => void
  onControllerNameChange: (value: string) => void
  onFinishTimeChange: (value: string) => void
  readonly?: boolean
}

const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exerciseName,
  controllerName,
  exerciseFinishTime,
  onExerciseNameChange,
  onControllerNameChange,
  onFinishTimeChange,
  readonly = false,
}) => {
  const handleExerciseNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onExerciseNameChange(e.target.value)
    },
    [onExerciseNameChange],
  )

  const handleControllerNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onControllerNameChange(e.target.value)
    },
    [onControllerNameChange],
  )

  const handleFinishTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFinishTimeChange(e.target.value)
    },
    [onFinishTimeChange],
  )

  if (readonly) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6 relative">
        <Link href="/admin" className="absolute right-3 top-3 text-gray-300 hover:text-white" aria-label="Open Administration">
          <Cog className="w-5 h-5" />
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-300 mb-1">Exercise Name</span>
            <span className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600">{exerciseName || '-'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-300 mb-1">Controller Name</span>
            <span className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600">{controllerName || '-'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-300 mb-1">Exercise Finish Time</span>
            <span className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600">{exerciseFinishTime || '-'}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 relative">
      <Link href="/admin" className="absolute right-3 top-3 text-gray-300 hover:text-white" aria-label="Open Administration">
        <Cog className="w-5 h-5" />
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-300 mb-1">Exercise Name</label>
          <input
            type="text"
            value={exerciseName}
            onChange={handleExerciseNameChange}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Enter exercise name"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-300 mb-1">Controller Name</label>
          <input
            type="text"
            value={controllerName}
            onChange={handleControllerNameChange}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Enter controller name"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-300 mb-1">Exercise Finish Time</label>
          <input
            type="text"
            value={exerciseFinishTime}
            onChange={handleFinishTimeChange}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="HH:MM:SS"
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(ExerciseHeader)

