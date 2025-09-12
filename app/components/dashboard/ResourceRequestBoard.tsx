'use client'

import React, { useState } from 'react'
import type { ResourceItem, ResourceStatus } from '../shared/types'
import { formatHMS } from '../../utils/timeUtils'
import { getResourceStatusColor } from '../../utils/styleUtils'
import { isTerminalStatus } from '../../utils/validation'

interface ResourceRequestBoardProps {
  resources: ResourceItem[]
  onResourceStatusChange: (resourceId: string, newStatus: ResourceStatus) => void
  onResourceETAEdit: (resourceId: string, newETATime: string) => void
}

const ResourceRequestBoard: React.FC<ResourceRequestBoardProps> = ({
  resources,
  onResourceStatusChange,
  onResourceETAEdit
}) => {
  const [editingResource, setEditingResource] = useState<string | null>(null)
  const [editETA, setEditETA] = useState('')

  const handleStartEdit = (resource: ResourceItem) => {
    setEditingResource(resource.id)
    setEditETA(formatHMS(resource.etaSeconds))
  }

  const handleSaveEdit = (resourceId: string) => {
    onResourceETAEdit(resourceId, editETA)
    setEditingResource(null)
    setEditETA('')
  }

  const handleCancelEdit = () => {
    setEditingResource(null)
    setEditETA('')
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-white mb-4">Resource Requests</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Label</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">ETA</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id} className="border-t border-gray-600">
                <td className="px-4 py-3 text-sm text-white">{resource.label}</td>
                <td className="px-4 py-3 text-sm font-mono text-white">
                  {editingResource === resource.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editETA}
                        onChange={(e) => setEditETA(e.target.value)}
                        className="px-2 py-1 bg-gray-700 text-white rounded text-xs font-mono w-20"
                        placeholder="HH:MM:SS"
                      />
                      <button
                        onClick={() => handleSaveEdit(resource.id)}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:text-blue-400"
                      onClick={() => handleStartEdit(resource)}
                      title="Click to edit ETA"
                    >
                      {formatHMS(resource.etaSeconds)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getResourceStatusColor(resource.status)}`}>
                    {resource.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {resource.status === "requested" && (
                      <button
                        onClick={() => onResourceStatusChange(resource.id, "tasked")}
                        className="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded"
                      >
                        Task
                      </button>
                    )}
                    {resource.status === "tasked" && (
                      <button
                        onClick={() => onResourceStatusChange(resource.id, "enroute")}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Dispatch
                      </button>
                    )}
                    {resource.status === "enroute" && (
                      <button
                        onClick={() => onResourceStatusChange(resource.id, "arrived")}
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                      >
                        Arrive
                      </button>
                    )}
                    {!isTerminalStatus(resource.status) && (
                      <button
                        onClick={() => onResourceStatusChange(resource.id, "cancelled")}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <div className="text-center py-8 text-gray-400">No resources added yet</div>
        )}
      </div>
    </div>
  )
}

export default ResourceRequestBoard