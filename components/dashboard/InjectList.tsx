"use client"

import React, { useState } from 'react'
import {
  FileDown,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Slash,
  Play as PlayIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  User,
  Phone,
  Cpu,
  MapPin,
  Tag,
} from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { formatHMS, parseHMS } from '@/lib/time'
import { renumberInjects } from '@/lib/helpers'
import type { InjectItem, InjectType, InjectStatus } from '@/lib/types'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ring-offset-gray-800'

const getInjectStatusColor = (status: InjectStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-gray-500 text-white'
    case 'completed':
      return 'bg-green-500 text-white'
    case 'missed':
      return 'bg-red-500 text-white'
    case 'skipped':
      return 'bg-orange-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getInjectTypeTextColor = (type: InjectType): string => {
  switch (type) {
    case 'in person':
      return 'text-blue-400'
    case 'radio/phone':
      return 'text-green-400'
    case 'electronic':
      return 'text-purple-400'
    case 'map inject':
      return 'text-red-400'
    case 'other':
      return 'text-orange-400'
    default:
      return 'text-gray-400'
  }
}

const getInjectTypeIcon = (type: InjectType) => {
  const props = { size: 16, className: 'inline align-middle' }
  switch (type) {
    case 'in person':
      return <User {...props} />
    case 'radio/phone':
      return <Phone {...props} />
    case 'electronic':
      return <Cpu {...props} />
    case 'map inject':
      return <MapPin {...props} />
    case 'other':
      return <Tag {...props} />
    default:
      return <Tag {...props} />
  }
}

const isCurrentInject = (inject: InjectItem, currentSeconds: number): boolean => {
  const timeDiff = Math.abs(currentSeconds - inject.dueSeconds)
  return timeDiff <= 30
}

export type InjectListProps = {
  canEdit: boolean
  audioEnabled: boolean
  onToggleAudio: () => void
  onExportCSV: () => void
}

const InjectList: React.FC<InjectListProps> = ({
  canEdit,
  audioEnabled,
  onToggleAudio,
  onExportCSV,
}) => {
  const injects = useDashboardStore(s => s.injects)
  const setInjects = useDashboardStore(s => s.setInjects)
  const currentSeconds = useDashboardStore(s => s.currentSeconds)

  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const handleToggleInjectStatus = (injectId: string) => {
    setInjects(prevInjects =>
      prevInjects.map(inject =>
        inject.id === injectId
          ? {
              ...inject,
              status:
                inject.status === 'completed' ? ('pending' as const) : ('completed' as const),
            }
          : inject
      )
    )
  }

  const handleDeleteInject = (id: string) => {
    setInjects(prev => renumberInjects(prev.filter(inject => inject.id !== id)))
  }

  const handleSkipInject = (id: string) => {
    setInjects(prev =>
      prev.map(inject =>
        inject.id === id ? { ...inject, status: 'skipped' as const } : inject
      )
    )
  }

  const handleMoveInject = (id: string, direction: 'up' | 'down') => {
    setInjects(prev => {
      const sorted = [...prev].sort((a, b) => a.dueSeconds - b.dueSeconds)
      const index = sorted.findIndex(inject => inject.id === id)

      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === sorted.length - 1) return prev

      const newIndex = direction === 'up' ? index - 1 : index + 1
      const targetInject = sorted[newIndex]
      const currentInject = sorted[index]

      const newDueSeconds = targetInject.dueSeconds
      const targetNewDueSeconds = currentInject.dueSeconds

      return renumberInjects(
        prev.map(inject => {
          if (inject.id === id) return { ...inject, dueSeconds: newDueSeconds }
          if (inject.id === targetInject.id)
            return { ...inject, dueSeconds: targetNewDueSeconds }
          return inject
        })
      )
    })
  }

  const handlePlayInjectAudio = (injectId: string) => {
    const inject = injects.find(i => i.id === injectId)
    if (!inject || !inject.audioDataUrl) return
    try {
      const audio = new Audio(inject.audioDataUrl)
      void audio.play()
    } catch {}
  }

  const handleStartEdit = (id: string, field: string, currentValue: string | number) => {
    if (!canEdit) return
    setEditingField({ id, field })
    setEditingValue(String(currentValue))
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditingValue('')
  }

  const handleSaveEdit = () => {
    if (!editingField) return
    const { id, field } = editingField
    const value = editingValue.trim()

    setInjects(prev => {
      const updated = prev.map(inject => {
        if (inject.id !== id) return inject

        switch (field) {
          case 'number': {
            const newNumber = parseInt(value)
            if (isNaN(newNumber) || newNumber < 1) return inject
            return { ...inject, number: newNumber }
          }
          case 'dueTime': {
            const dueSeconds = parseHMS(value)
            if (dueSeconds === null) return inject
            return { ...inject, dueSeconds }
          }
          case 'title':
            if (!value) return inject
            return { ...inject, title: value }
          case 'type':
            if (!['in person', 'radio/phone', 'electronic', 'map inject', 'other'].includes(value))
              return inject
            return { ...inject, type: value as InjectType }
          case 'to':
            return { ...inject, to: value }
          case 'from':
            return { ...inject, from: value }
          default:
            return inject
        }
      })

      if (field === 'dueTime') {
        return renumberInjects(updated)
      }
      return updated
    })

    setEditingField(null)
    setEditingValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const EditableField = ({
    inject,
    field,
    value,
    displayValue,
    isSelect = false,
    selectOptions = [],
  }: {
    inject: InjectItem
    field: string
    value: string | number
    displayValue?: string
    isSelect?: boolean
    selectOptions?: string[]
  }) => {
    const isEditing = editingField?.id === inject.id && editingField?.field === field

    if (isEditing) {
      if (isSelect) {
        return (
          <select
            value={editingValue}
            onChange={e => setEditingValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyPress}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500"
            autoFocus
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      }

      return (
        <input
          type="text"
          value={editingValue}
          onChange={e => setEditingValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyPress}
          className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500"
          autoFocus
        />
      )
    }

    const onKey = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleStartEdit(inject.id, field, value)
      }
    }
    const fieldLabel: Record<string, string> = {
      number: 'number',
      dueTime: 'due time',
      title: 'title',
      type: 'type',
      to: 'to',
      from: 'from',
    }
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleStartEdit(inject.id, field, value)}
        onKeyDown={onKey}
        className="cursor-pointer hover:bg-gray-700 hover:bg-opacity-50 px-2 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ring-offset-gray-800"
        title="Click to edit"
        aria-label={`Edit ${fieldLabel[field] || field} for inject #${inject.number}`}
      >
        {displayValue || value}
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-white">Inject Status</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Export Injects (Import CSV)"
            aria-label="Export Injects (Import CSV)"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleAudio}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
            aria-pressed={audioEnabled}
            aria-label={audioEnabled ? 'Mute audio alerts' : 'Unmute audio alerts'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Injects table">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-2 py-3 text-left text-sm font-semibold text-white w-10">#</th>
              <th className="px-2 py-3 text-left text-sm font-semibold text-white w-28">Due</th>
              <th className="px-2 py-3 text-left text-sm font-semibold text-white hidden md:table-cell w-28">From</th>
              <th className="px-2 py-3 text-left text-sm font-semibold text-white hidden md:table-cell w-28">To</th>
              <th className="px-2 py-3 text-left text-sm font-semibold text-white">Title</th>
              <th className="px-2 py-3 text-left text-sm font-semibold text-white w-12">Type</th>
              <th className="px-2 py-3 text-left text-sm font-semibold text-white w-24">Status</th>
              <th className="px-2 py-3 text-left text-sm font-semibold text-white w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...injects].sort((a, b) => a.dueSeconds - b.dueSeconds).map((inject, sortedIndex) => (
              <tr
                key={inject.id}
                className={`border-t border-gray-600 ${
                  isCurrentInject(inject, currentSeconds) ? 'bg-yellow-900 bg-opacity-30' : ''
                } ${inject.status === 'skipped' ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3 text-sm font-mono text-white font-semibold">
                  <EditableField
                    inject={inject}
                    field="number"
                    value={inject.number}
                    displayValue={`#${inject.number}`}
                  />
                </td>
                <td className="px-2 py-3 text-sm font-mono text-white">
                  <EditableField
                    inject={inject}
                    field="dueTime"
                    value={formatHMS(inject.dueSeconds)}
                    displayValue={formatHMS(inject.dueSeconds)}
                  />
                </td>
                <td className="px-2 py-3 text-sm text-white hidden md:table-cell">
                  <EditableField
                    inject={inject}
                    field="from"
                    value={inject.from || ''}
                    displayValue={inject.from || '-'}
                  />
                </td>
                <td className="px-2 py-3 text-sm text-white hidden md:table-cell">
                  <EditableField
                    inject={inject}
                    field="to"
                    value={inject.to || ''}
                    displayValue={inject.to || '-'}
                  />
                </td>
                <td className={`px-2 py-3 text-sm text-white ${inject.status === 'skipped' ? 'line-through' : ''}`}>
                  <EditableField
                    inject={inject}
                    field="title"
                    value={inject.title}
                    displayValue={inject.title}
                  />
                </td>
                <td className="px-2 py-3">
                  {editingField?.id === inject.id && editingField?.field === 'type' ? (
                    <select
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={handleKeyPress}
                      className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500"
                      autoFocus
                    >
                      <option value="in person">in person</option>
                      <option value="radio/phone">radio/phone</option>
                      <option value="electronic">electronic</option>
                      <option value="map inject">map inject</option>
                      <option value="other">other</option>
                    </select>
                  ) : (
                    <div
                      onClick={() => handleStartEdit(inject.id, 'type', inject.type)}
                      className="cursor-pointer hover:bg-gray-700 hover:bg-opacity-50 px-2 py-1 rounded transition-colors inline-flex items-center justify-center"
                      title="Click to edit"
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getInjectTypeTextColor(
                          inject.type
                        )}`}
                      >
                        {getInjectTypeIcon(inject.type)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getInjectStatusColor(
                      inject.status
                    )}`}
                  >
                    {inject.status}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleInjectStatus(inject.id)}
                      disabled={!canEdit || inject.status === 'skipped'}
                      className={`p-1 rounded text-white disabled:opacity-50 ${focusRing} ${
                        inject.status === 'completed'
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title={
                        inject.status === 'completed'
                          ? 'Mark incomplete'
                          : 'Mark complete'
                      }
                      aria-label={
                        inject.status === 'completed'
                          ? `Mark inject #${inject.number} incomplete`
                          : `Mark inject #${inject.number} complete`
                      }
                    >
                      {inject.status === 'completed' ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSkipInject(inject.id)}
                      disabled={!canEdit || inject.status === 'skipped' || inject.status === 'completed'}
                      className={`p-1 rounded bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-600 disabled:opacity-50 ${focusRing}`}
                      title="Skip inject"
                      aria-label={`Skip inject #${inject.number}`}
                    >
                      <Slash className="w-4 h-4" />
                    </button>
                    {inject.audioDataUrl && (
                      <button
                        onClick={() => handlePlayInjectAudio(inject.id)}
                        className={`p-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white ${focusRing}`}
                        title="Play attached audio"
                        aria-label={`Play audio for inject #${inject.number}`}
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleMoveInject(inject.id, 'up')}
                      disabled={!canEdit || sortedIndex === 0}
                      className={`p-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white ${focusRing}`}
                      title="Move up"
                      aria-label={`Move inject #${inject.number} up`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveInject(inject.id, 'down')}
                      disabled={!canEdit || sortedIndex === injects.length - 1}
                      className={`p-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white ${focusRing}`}
                      title="Move down"
                      aria-label={`Move inject #${inject.number} down`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteInject(inject.id)}
                      className={`p-1 rounded bg-red-600 hover:bg-red-700 text-white ${focusRing}`}
                      disabled={!canEdit}
                      title="Delete inject"
                      aria-label={`Delete inject #${inject.number}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InjectList

