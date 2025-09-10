"use client"

import React, { useState } from 'react'
import { ExternalLink, FileDown, Clock, ClipboardCheck, Truck, CheckCircle2, XCircle, User, Users, Plane, Cog, Package } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { formatHMS, parseHMS } from '@/lib/time'
import { downloadCSV } from '@/lib/csv'
import type { ResourceItem, ResourceStatus, ResourceKind } from '@/lib/types'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ring-offset-gray-800'

const getResourceStatusIcon = (status: ResourceStatus) => {
  const props = { size: 16, className: 'inline align-middle' }
  switch (status) {
    case 'requested':
      return <Clock {...props} />
    case 'tasked':
      return <ClipboardCheck {...props} />
    case 'enroute':
      return <Truck {...props} />
    case 'arrived':
      return <CheckCircle2 {...props} />
    case 'cancelled':
      return <XCircle {...props} />
    default:
      return <Clock {...props} />
  }
}

const getResourceKindIcon = (kind?: ResourceKind) => {
  const props = { size: 16, className: 'inline align-middle' }
  switch (kind) {
    case 'person':
      return <User {...props} />
    case 'vehicle':
      return <Truck {...props} />
    case 'group':
      return <Users {...props} />
    case 'air':
      return <Plane {...props} />
    case 'capability':
      return <Cog {...props} />
    case 'supply':
      return <Package {...props} />
    default:
      return <Truck {...props} />
  }
}

const getResourceStatusColor = (status: ResourceStatus): string => {
  switch (status) {
    case 'requested':
      return 'bg-gray-500 text-white'
    case 'tasked':
      return 'bg-amber-500 text-white'
    case 'enroute':
      return 'bg-blue-600 text-white'
    case 'arrived':
      return 'bg-green-500 text-white'
    case 'cancelled':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const isTerminalStatus = (status: ResourceStatus): boolean => {
  return status === 'arrived' || status === 'cancelled'
}

export type ResourceRequestBoardProps = {
  canEdit: boolean
  autoAdvanceResources: boolean
  onToggleAutoAdvance: (checked: boolean) => void
}

const ResourceRequestBoard: React.FC<ResourceRequestBoardProps> = ({
  canEdit,
  autoAdvanceResources,
  onToggleAutoAdvance,
}) => {
  const resources = useDashboardStore(s => s.resources)
  const setResources = useDashboardStore(s => s.setResources)
  const currentSeconds = useDashboardStore(s => s.currentSeconds)
  const exerciseName = useDashboardStore(s => s.exerciseName)

  const [editingResource, setEditingResource] = useState<string | null>(null)
  const [editETA, setEditETA] = useState('')

  const handleResourceStatusChange = (resourceId: string, newStatus: ResourceStatus) => {
    if (!canEdit) return
    setResources(prev =>
      prev.map(r => (r.id === resourceId ? { ...r, status: newStatus } : r))
    )
  }

  const handleResourceETAEdit = (resourceId: string, newETATime: string) => {
    const etaSeconds = parseHMS(newETATime)
    if (etaSeconds === null) return
    setResources(prev =>
      prev.map(r => (r.id === resourceId ? { ...r, etaSeconds } : r))
    )
  }

  const handleStartEdit = (resource: ResourceItem) => {
    setEditingResource(resource.id)
    setEditETA(formatHMS(resource.etaSeconds))
  }

  const handleSaveEdit = (resourceId: string) => {
    handleResourceETAEdit(resourceId, editETA)
    setEditingResource(null)
    setEditETA('')
  }

  const handleCancelEdit = () => {
    setEditingResource(null)
    setEditETA('')
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-white">Resource Requests</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoAdvanceResources}
              onChange={e => onToggleAutoAdvance(e.target.checked)}
            />
            Auto-advance
          </label>
          <button
            onClick={() => {
              const rows: (string | number)[][] = []
              rows.push(['Label', 'Kind', 'ETA (minutes)', 'Status'])
              const sorted = [...resources].sort((a, b) => a.etaSeconds - b.etaSeconds)
              sorted.forEach(r => {
                const minutes = Math.max(0, Math.round((r.etaSeconds - currentSeconds) / 60))
                rows.push([r.label, r.kind || '', minutes, r.status])
              })
              const name = exerciseName?.trim()
                ? `_${exerciseName.trim().replace(/\s+/g, '_')}`
                : ''
              downloadCSV(`resources_import${name}.csv`, rows)
            }}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Export Resources (Import CSV)"
            aria-label="Export Resources (Import CSV)"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined')
                window.open(
                  '/display/resources',
                  'ResourcesDisplay',
                  'noopener,noreferrer,width=1200,height=800'
                )
            }}
            className={`p-2 rounded bg-gray-700 hover:bg-gray-600 text-white ${focusRing}`}
            title="Open Resources Display"
            aria-label="Open Resources Display"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Resource requests table">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Label</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">ETA</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => (
              <tr key={resource.id} className="border-t border-gray-600">
                <td className="px-4 py-3 text-sm text-white">
                  <span className="inline-flex items-center gap-2">
                    {getResourceStatusIcon(resource.status)}
                    {resource.kind && (
                      <span className="opacity-80">{getResourceKindIcon(resource.kind)}</span>
                    )}
                    <span>{resource.label}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-white">
                  {editingResource === resource.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editETA}
                        onChange={e => setEditETA(e.target.value)}
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
                      className={`cursor-pointer ${
                        canEdit ? 'hover:text-blue-400' : 'text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (canEdit) handleStartEdit(resource)
                      }}
                      title={canEdit ? 'Click to edit ETA' : 'Editing locked'}
                    >
                      {formatHMS(resource.etaSeconds)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getResourceStatusColor(
                      resource.status
                    )}`}
                  >
                    {resource.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {resource.status === 'requested' && (
                      <button
                        onClick={() => handleResourceStatusChange(resource.id, 'tasked')}
                        className="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white rounded"
                        disabled={!canEdit}
                      >
                        Task
                      </button>
                    )}
                    {resource.status === 'tasked' && (
                      <button
                        onClick={() => handleResourceStatusChange(resource.id, 'enroute')}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
                        disabled={!canEdit}
                      >
                        Dispatch
                      </button>
                    )}
                    {resource.status === 'enroute' && (
                      <button
                        onClick={() => handleResourceStatusChange(resource.id, 'arrived')}
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded"
                        disabled={!canEdit}
                      >
                        Arrive
                      </button>
                    )}
                    {!isTerminalStatus(resource.status) && (
                      <button
                        onClick={() => handleResourceStatusChange(resource.id, 'cancelled')}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded"
                        disabled={!canEdit}
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

