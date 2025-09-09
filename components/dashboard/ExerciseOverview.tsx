"use client"

import React from 'react'

export type ExerciseOverviewProps = {
  exerciseName: string
  controllerName: string
}

const ExerciseOverview: React.FC<ExerciseOverviewProps> = ({ exerciseName, controllerName }) => {
  if (!exerciseName.trim() && !controllerName.trim()) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 mb-6 border-l-4 border-blue-400">
      <div className="text-center">
        {exerciseName.trim() && (
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 tracking-wide">
            {exerciseName}
          </h1>
        )}
        {controllerName.trim() && (
          <div className="text-xl lg:text-2xl text-blue-200 font-semibold">
            Controller: <span className="text-white">{controllerName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(ExerciseOverview)

