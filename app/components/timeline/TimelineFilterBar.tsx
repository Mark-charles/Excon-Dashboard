'use client'

import React from 'react'
import type { FilterState } from '../shared/types'

interface TimelineFilterBarProps {
  filterState: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
}

const TimelineFilterBar: React.FC<TimelineFilterBarProps> = ({
  filterState,
  onFilterChange
}) => {
  const {
    showInjects,
    showResources,
    showInPerson,
    showRadioPhone,
    showElectronic,
    showMapInject,
    showOther,
    showRequestedStatus,
    showTaskedStatus,
    showEnrouteStatus,
    showArrivedStatus,
    showCancelledStatus
  } = filterState

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap gap-6">
        {/* Type Filters */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white">Show Types</h4>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInjects}
                onChange={(e) => onFilterChange({ showInjects: e.target.checked })}
                className="mr-2"
              />
              <span className="text-white text-sm">📋 Injects</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showResources}
                onChange={(e) => onFilterChange({ showResources: e.target.checked })}
                className="mr-2"
              />
              <span className="text-white text-sm">🚛 Resources</span>
            </label>
          </div>
        </div>

        {/* Inject Type Filters */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white">Inject Type</h4>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInPerson}
                onChange={(e) => onFilterChange({ showInPerson: e.target.checked })}
                className="mr-2"
              />
              <span className="text-blue-400 text-sm">👤 In Person</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showRadioPhone}
                onChange={(e) => onFilterChange({ showRadioPhone: e.target.checked })}
                className="mr-2"
              />
              <span className="text-green-400 text-sm">📞 Radio/Phone</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showElectronic}
                onChange={(e) => onFilterChange({ showElectronic: e.target.checked })}
                className="mr-2"
              />
              <span className="text-purple-400 text-sm">💻 Electronic</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showMapInject}
                onChange={(e) => onFilterChange({ showMapInject: e.target.checked })}
                className="mr-2"
              />
              <span className="text-red-400 text-sm">🗺️ Map Inject</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOther}
                onChange={(e) => onFilterChange({ showOther: e.target.checked })}
                className="mr-2"
              />
              <span className="text-orange-400 text-sm">❓ Other</span>
            </label>
          </div>
        </div>

        {/* Resource Status Filters */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white">Resource Status</h4>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showRequestedStatus}
                onChange={(e) => onFilterChange({ showRequestedStatus: e.target.checked })}
                className="mr-2"
              />
              <span className="text-gray-400 text-sm">❔ Requested</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showTaskedStatus}
                onChange={(e) => onFilterChange({ showTaskedStatus: e.target.checked })}
                className="mr-2"
              />
              <span className="text-amber-400 text-sm">📋 Tasked</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showEnrouteStatus}
                onChange={(e) => onFilterChange({ showEnrouteStatus: e.target.checked })}
                className="mr-2"
              />
              <span className="text-blue-400 text-sm">🚗 Enroute</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showArrivedStatus}
                onChange={(e) => onFilterChange({ showArrivedStatus: e.target.checked })}
                className="mr-2"
              />
              <span className="text-green-400 text-sm">✅ Arrived</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showCancelledStatus}
                onChange={(e) => onFilterChange({ showCancelledStatus: e.target.checked })}
                className="mr-2"
              />
              <span className="text-red-400 text-sm">❌ Cancelled</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineFilterBar