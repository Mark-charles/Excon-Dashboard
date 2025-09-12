'use client'

import React from 'react'

interface ExerciseOverviewProps {
  exerciseName: string
  controllerName: string
}

const ExerciseOverview = React.memo<ExerciseOverviewProps>(({ exerciseName, controllerName }) => {
  // Only show if at least one field has content
  if (!exerciseName.trim() && !controllerName.trim()) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 shadow-xl">
      <div className="text-center">
        {exerciseName.trim() && (
          <h1 className="text-3xl font-bold text-white mb-2">
            {exerciseName}
          </h1>
        )}
        {controllerName.trim() && (
          <p className="text-xl text-blue-100">
            Controller: <span className="font-semibold">{controllerName}</span>
          </p>
        )}
      </div>
    </div>
  )
})

ExerciseOverview.displayName = 'ExerciseOverview'

export default ExerciseOverview