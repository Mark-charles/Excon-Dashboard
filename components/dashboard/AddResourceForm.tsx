"use client"

import React, { useCallback, useState } from 'react'
import type { ResourceKind } from '@/lib/types'

export type AddResourceFormProps = {
  onAddResource: (label: string, minutes: number, kind: ResourceKind) => void
  onImportClick: () => void
  disabled?: boolean
}

const AddResourceForm: React.FC<AddResourceFormProps> = ({ onAddResource, onImportClick, disabled = false }) => {
  const [label, setLabel] = useState('')
  const [etaMinutes, setEtaMinutes] = useState('')
  const [kind, setKind] = useState<ResourceKind>('vehicle')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) return
      const minutes = parseInt(etaMinutes, 10)
      if (label.trim() && !isNaN(minutes) && minutes >= 0) {
        onAddResource(label, minutes, kind)
        setLabel('')
        setEtaMinutes('')
        setKind('vehicle')
      }
    },
    [disabled, label, etaMinutes, kind, onAddResource],
  )

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white">Add Resources</h3>
        <p className="text-sm text-gray-400">Add single resource or import multiple</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Resource Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          required
          disabled={disabled}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ResourceKind)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
            aria-label="Resource kind"
            disabled={disabled}
          >
            <option value="person">Person/Position</option>
            <option value="vehicle">Vehicle/Unit</option>
            <option value="group">Task Force/Strike Team</option>
            <option value="air">Air Support</option>
            <option value="capability">Capability</option>
            <option value="supply">Supplies/Food</option>
          </select>
          <input
            type="number"
            placeholder="ETA (minutes)"
            value={etaMinutes}
            onChange={(e) => setEtaMinutes(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
            min="0"
            required
            disabled={disabled}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-semibold"
            disabled={disabled}
          >
            Add Resource
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors flex items-center justify-center"
            title="Import from CSV/Excel"
            aria-label="Import resources from CSV or Excel"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

export default React.memo(AddResourceForm)

