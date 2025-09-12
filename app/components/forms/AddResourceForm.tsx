'use client'

import React, { useState, useCallback } from 'react'

interface AddResourceFormProps {
  onAddResource: (label: string, minutes: number) => void
  onImportClick: () => void
}

const AddResourceForm = React.memo<AddResourceFormProps>(({ onAddResource, onImportClick }) => {
  const [label, setLabel] = useState('')
  const [etaMinutes, setEtaMinutes] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const minutes = parseInt(etaMinutes, 10)
    if (label.trim() && !isNaN(minutes) && minutes >= 0) {
      onAddResource(label, minutes)
      setLabel('')
      setEtaMinutes('')
    }
  }, [label, etaMinutes, onAddResource])

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
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="number"
          placeholder="ETA (minutes)"
          value={etaMinutes}
          onChange={(e) => setEtaMinutes(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          min="0"
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
          >
            Add Resource
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center justify-center"
            title="Import from CSV/Excel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
})

AddResourceForm.displayName = 'AddResourceForm'

export default AddResourceForm