'use client'

import React, { useState, useCallback } from 'react'
import type { InjectType } from '../shared/types'

interface AddInjectFormProps {
  onAddInject: (
    title: string,
    dueTime: string,
    type: InjectType,
    to: string,
    from: string,
    notes: string,
    resources: string,
  ) => void
  onImportClick: () => void
}

const AddInjectForm = React.memo<AddInjectFormProps>(({ onAddInject, onImportClick }) => {
  const [title, setTitle] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [type, setType] = useState<InjectType>('in person')
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const [notes, setNotes] = useState('')
  const [resources, setResources] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && dueTime && to.trim() && from.trim()) {
      onAddInject(title, dueTime, type, to, from, notes, resources)
      setTitle('')
      setDueTime('')
      setType('in person')
      setTo('')
      setFrom('')
      setNotes('')
      setResources('')
    }
  }, [title, dueTime, type, to, from, notes, resources, onAddInject])

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white">Add to Master Schedule of Events</h3>
        <p className="text-sm text-gray-400">Add a single MSE item or import multiple</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Inject Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="text"
          placeholder="Due Time (HH:MM:SS)"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          required
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InjectType)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
        >
          <option value="in person">In Person</option>
          <option value="radio/phone">Radio/Phone</option>
          <option value="electronic">Electronic</option>
          <option value="map inject">Map Inject</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          placeholder="Inject From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="text"
          placeholder="Inject To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          required
        />
        <textarea
          placeholder="Additional Notes/Actions"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded min-h-[80px]"
        />
        <input
          type="text"
          placeholder="Resources (filename or reference)"
          value={resources}
          onChange={(e) => setResources(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            Add MSE Item
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

AddInjectForm.displayName = 'AddInjectForm'

export default AddInjectForm
