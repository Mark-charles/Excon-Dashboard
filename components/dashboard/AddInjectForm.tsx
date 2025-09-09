"use client"

import React, { useCallback, useState } from 'react'
import type { InjectType } from '@/lib/types'

export type AddInjectFormProps = {
  onAddInject: (
    title: string,
    dueTime: string,
    type: InjectType,
    to: string,
    from: string,
    audioDataUrl?: string | null,
    audioName?: string | null,
    autoPlayAudio?: boolean,
  ) => void
  onImportClick: () => void
  disabled?: boolean
}

const AddInjectForm: React.FC<AddInjectFormProps> = ({ onAddInject, onImportClick, disabled = false }) => {
  const [title, setTitle] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [type, setType] = useState<InjectType>('radio/phone')
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const [audioName, setAudioName] = useState('')
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null)
  const [autoPlay, setAutoPlay] = useState(false)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) return
      if (title.trim() && dueTime.trim() && to.trim() && from.trim()) {
        onAddInject(title, dueTime, type, to, from, audioDataUrl, audioName, autoPlay)
        setTitle('')
        setDueTime('')
        setType('radio/phone')
        setTo('')
        setFrom('')
        setAudioDataUrl(null)
        setAudioName('')
        setAutoPlay(false)
      }
    },
    [disabled, title, dueTime, to, from, type, onAddInject, audioDataUrl, audioName, autoPlay],
  )

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white">Add Injects</h3>
        <p className="text-sm text-gray-400">Add single inject or import multiple</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          required
          disabled={disabled}
        />
        <input
          type="text"
          placeholder="Due Time (HH:MM:SS)"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          required
          disabled={disabled}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InjectType)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
          disabled={disabled}
        >
          <option value="in person">In Person</option>
          <option value="radio/phone">Radio/Phone</option>
          <option value="electronic">Electronic</option>
          <option value="map inject">Map Inject</option>
          <option value="other">Other</option>
        </select>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
            required
            disabled={disabled}
          />
          <input
            type="text"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
            required
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
          <div className="flex items-center gap-2">
            <input
              id="inject-audio-file"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) {
                  const reader = new FileReader()
                  reader.onload = () => {
                    setAudioDataUrl(String(reader.result))
                    setAudioName(f.name)
                  }
                  reader.readAsDataURL(f)
                }
              }}
            />
            <label
              htmlFor="inject-audio-file"
              className={`px-3 py-2 ${disabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'} text-white rounded`}
            >
              {audioName ? 'Change Audio' : 'Attach Audio'}
            </label>
            {audioName && (
              <span className="text-gray-300 text-sm truncate max-w-[180px]" title={audioName}>
                {audioName}
              </span>
            )}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} disabled={disabled} />
            <span className="text-gray-300 text-sm">Auto-play at due time</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold"
            disabled={disabled}
          >
            Add Inject
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors flex items-center justify-center"
            title="Import from CSV/Excel"
            aria-label="Import injects from CSV or Excel"
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

export default React.memo(AddInjectForm)
