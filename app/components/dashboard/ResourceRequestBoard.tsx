'use client'

import React, { useState } from 'react'
import type { ResourceItem, ResourceStatus } from '../shared/types'
import { formatHMS } from '../../utils/timeUtils'
import { isTerminalStatus } from '../../utils/validation'
import { getResourceInitials } from '../../utils/resourceUtils'

interface ResourceRequestBoardProps {
  resources: ResourceItem[]
  onResourceStatusChange: (resourceId: string, newStatus: ResourceStatus) => void
  onResourceETAEdit: (resourceId: string, newETATime: string) => boolean
  onPopout?: () => void
}

const ResourceRequestBoard: React.FC<ResourceRequestBoardProps> = ({
  resources,
  onResourceStatusChange,
  onResourceETAEdit,
  onPopout
}) => {
  const [editingResource, setEditingResource] = useState<string | null>(null)
  const [editETA, setEditETA] = useState('')
  const [etaError, setEtaError] = useState<string | null>(null)

  const handleStartEdit = (resource: ResourceItem) => {
    setEditingResource(resource.id)
    setEditETA(formatHMS(resource.etaSeconds))
  }

  const handleSaveEdit = (resourceId: string) => {
    const ok = onResourceETAEdit(resourceId, editETA)
    if (ok) {
      setEditingResource(null)
      setEditETA('')
      setEtaError(null)
    } else {
      setEtaError('Invalid time. Use HH:MM:SS (e.g., 00:45:00).')
    }
  }

  const handleCancelEdit = () => {
    setEditingResource(null)
    setEditETA('')
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <h3 className="text-3xl font-bold text-white tracking-tight">Request Board</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-600/50">
            <span className="text-gray-300 text-sm font-medium">
              {resources.length} Resources | {resources.filter(r => r.status === 'arrived').length} On Scene
            </span>
          </div>
          {onPopout && (
            <button
              type="button"
              onClick={onPopout}
              className="p-2 rounded-lg bg-gray-800/60 border border-gray-600/60 text-gray-200 hover:text-white hover:border-emerald-400/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-gray-900"
              aria-label="Open resource board in a new window"
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

      {/* Compact Status Overview */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {['requested', 'tasked', 'enroute', 'arrived', 'cancelled'].map((status) => {
          const count = resources.filter(r => r.status === status).length
          return (
            <div key={status} className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-600/30">
              <div className="text-sm font-bold text-white">{count}</div>
              <div className="text-xs text-gray-300 capitalize">{status}</div>
            </div>
          )
        })}
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4 inline-flex items-center justify-center text-emerald-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="10" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="16" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="text-xl font-medium text-gray-300 mb-2">No Requests</div>
          <div className="text-gray-400">Resources will appear here when added to the exercise</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 px-3 text-gray-300 font-medium">Resource</th>
                <th className="text-left py-2 px-3 text-gray-300 font-medium">Type</th>
                <th className="text-left py-2 px-3 text-gray-300 font-medium">ETA</th>
                <th className="text-left py-2 px-3 text-gray-300 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
          </table>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {resources.map((resource) => (
                  <tr 
                    key={resource.id}
                    className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 font-semibold flex items-center justify-center text-sm uppercase">
                          {getResourceInitials(resource.label)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{resource.label}</div>
                          {resource.kind && (
                            <div className="text-xs text-gray-400">{resource.kind}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-gray-300 capitalize">
                        {resource.kind || 'Emergency Resource'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {editingResource === resource.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editETA}
                            onChange={(e) => setEditETA(e.target.value)}
                            className="w-24 px-2 py-1 bg-gray-700 text-white rounded text-xs font-mono border border-blue-400 focus:ring-1 focus:ring-blue-400"
                            placeholder="HH:MM:SS"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(resource.id)}
                            aria-label={`Save ETA for ${resource.label}`}
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-gray-900 inline-flex items-center gap-1"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" fill="none"/>
                            </svg>
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            aria-label={`Cancel editing ETA for ${resource.label}`}
                            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 focus-visible:ring-offset-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="cursor-pointer hover:bg-gray-700/50 px-2 py-1 rounded transition-colors font-mono text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900"
                          onClick={() => handleStartEdit(resource)}
                          title="Click to edit ETA"
                          aria-label={`Edit ETA for ${resource.label}, currently ${formatHMS(resource.etaSeconds)}`}
                        >
                          {formatHMS(resource.etaSeconds)}
                        </button>
                      )}
                      {etaError && editingResource === resource.id && (
                        <div className="text-red-400 text-xs mt-1" role="alert">{etaError}</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          resource.status === 'arrived' ? 'bg-green-400' :
                          resource.status === 'enroute' ? 'bg-blue-400 animate-pulse' :
                          resource.status === 'tasked' ? 'bg-amber-400 animate-pulse' :
                          resource.status === 'cancelled' ? 'bg-red-400' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-xs text-gray-300 capitalize">{resource.status}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        {resource.status === 'requested' && (
                          <button
                            type="button"
                            onClick={() => onResourceStatusChange(resource.id, 'tasked')}
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900 inline-flex items-center gap-1"
                            title="Task Resource"
                            aria-label={`Task ${resource.label}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                            </svg>
                            Task
                          </button>
                        )}
                        {resource.status === 'tasked' && (
                          <button
                            type="button"
                            onClick={() => onResourceStatusChange(resource.id, 'enroute')}
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900 inline-flex items-center gap-1"
                            title="Dispatch"
                            aria-label={`Dispatch ${resource.label}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M5 12h14" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none"/>
                            </svg>
                            Dispatch
                          </button>
                        )}
                        {resource.status === 'enroute' && (
                          <button
                            type="button"
                            onClick={() => onResourceStatusChange(resource.id, 'arrived')}
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-gray-900 inline-flex items-center gap-1"
                            title="Mark Arrived"
                            aria-label={`Mark ${resource.label} arrived`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              <circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            </svg>
                            Arrived
                          </button>
                        )}
                        {!isTerminalStatus(resource.status) && (
                          <button
                            type="button"
                            onClick={() => onResourceStatusChange(resource.id, 'cancelled')}
                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:ring-offset-gray-900 inline-flex items-center gap-1"
                            title="Cancel"
                            aria-label={`Cancel ${resource.label}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResourceRequestBoard
