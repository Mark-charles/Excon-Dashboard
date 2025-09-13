'use client'

import React, { useState } from 'react'
import type { InjectItem, InjectType, EditingState } from '../shared/types'
import { formatHMS, parseHMS, isCurrentInject } from '../../utils/timeUtils'
import { getInjectStatusColor, getInjectTypeColor } from '../../utils/styleUtils'

interface InjectListProps {
  injects: InjectItem[]
  currentSeconds: number
  onUpdateInjects: (updatedInjects: InjectItem[]) => void
  onToggleInjectStatus: (injectId: string) => void
  onMoveInject: (id: string, direction: 'up' | 'down') => void
  onSkipInject: (id: string) => void
  onDeleteInject: (id: string) => void
}

interface EditableFieldProps {
  inject: InjectItem
  field: string
  value: string | number
  displayValue?: string
  isSelect?: boolean
  selectOptions?: string[]
  editingState: EditingState
  onStartEdit: (id: string, field: string, currentValue: string | number) => void
  onSaveEdit: () => void
  onEditingValueChange: (value: string) => void
  onKeyPress: (e: React.KeyboardEvent) => void
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  inject, 
  field, 
  value, 
  displayValue, 
  isSelect = false, 
  selectOptions = [],
  editingState,
  onStartEdit,
  onSaveEdit,
  onEditingValueChange,
  onKeyPress
}) => {
  const isEditing = editingState.editingField?.id === inject.id && editingState.editingField?.field === field
  
  if (isEditing) {
    if (isSelect) {
      return (
        <select
          value={editingState.editingValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={onKeyPress}
          className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500"
          autoFocus
        >
          {selectOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )
    }
    
    return (
      <input
        type="text"
        value={editingState.editingValue}
        onChange={(e) => onEditingValueChange(e.target.value)}
        onBlur={onSaveEdit}
        onKeyDown={onKeyPress}
        className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500"
        autoFocus
      />
    )
  }
  
  return (
    <div
      onClick={() => onStartEdit(inject.id, field, value)}
      className="cursor-pointer hover:bg-gray-700 hover:bg-opacity-50 px-2 py-1 rounded transition-colors"
      title="Click to edit"
    >
      {displayValue || value}
    </div>
  )
}

const InjectList: React.FC<InjectListProps> = ({
  injects,
  currentSeconds,
  
  onUpdateInjects,
  onToggleInjectStatus,
  onMoveInject,
  onSkipInject,
  onDeleteInject
}) => {
  const [localEditingField, setLocalEditingField] = useState<{id: string, field: string} | null>(null)
  const [localEditingValue, setLocalEditingValue] = useState<string>('')

  const handleStartEdit = (id: string, field: string, currentValue: string | number) => {
    setLocalEditingField({ id, field })
    setLocalEditingValue(String(currentValue))
  }

  const handleCancelEdit = () => {
    setLocalEditingField(null)
    setLocalEditingValue('')
  }

  const handleSaveEdit = () => {
    if (!localEditingField) return

    const { id, field } = localEditingField
    const value = localEditingValue.trim()

    const updated = injects.map(inject => {
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
          if (!['in person', 'radio/phone', 'electronic', 'map inject', 'other'].includes(value)) return inject
          return { ...inject, type: value as InjectType }
        case 'to':
          return { ...inject, to: value }
        case 'from':
          return { ...inject, from: value }
        default:
          return inject
      }
    })

    onUpdateInjects(updated)
    setLocalEditingField(null)
    setLocalEditingValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const localEditingState = {
    editingField: localEditingField,
    editingValue: localEditingValue
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-white mb-4">Inject Status</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Due Time</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">From</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">To</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Title</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...injects].sort((a, b) => a.dueSeconds - b.dueSeconds).map((inject, sortedIndex) => (
              <tr 
                key={inject.id} 
                className={`border-t border-gray-600 ${
                  isCurrentInject(currentSeconds, inject.dueSeconds) ? 'bg-yellow-900 bg-opacity-30' : ''
                } ${inject.status === 'skipped' ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3 text-sm font-mono text-white font-semibold">
                  <EditableField
                    inject={inject}
                    field="number"
                    value={inject.number}
                    displayValue={`#${inject.number}`}
                    editingState={localEditingState}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onEditingValueChange={setLocalEditingValue}
                    onKeyPress={handleKeyPress}
                  />
                </td>
                <td className="px-4 py-3 text-sm font-mono text-white">
                  <EditableField
                    inject={inject}
                    field="dueTime"
                    value={formatHMS(inject.dueSeconds)}
                    displayValue={formatHMS(inject.dueSeconds)}
                    editingState={localEditingState}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onEditingValueChange={setLocalEditingValue}
                    onKeyPress={handleKeyPress}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  <EditableField
                    inject={inject}
                    field="from"
                    value={inject.from || ''}
                    displayValue={inject.from || '-'}
                    editingState={localEditingState}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onEditingValueChange={setLocalEditingValue}
                    onKeyPress={handleKeyPress}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  <EditableField
                    inject={inject}
                    field="to"
                    value={inject.to || ''}
                    displayValue={inject.to || '-'}
                    editingState={localEditingState}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onEditingValueChange={setLocalEditingValue}
                    onKeyPress={handleKeyPress}
                  />
                </td>
                <td className="px-4 py-3">
                  {localEditingField?.id === inject.id && localEditingField?.field === 'type' ? (
                    <select
                      value={localEditingValue}
                      onChange={(e) => setLocalEditingValue(e.target.value)}
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
                      className="cursor-pointer hover:bg-gray-700 hover:bg-opacity-50 px-2 py-1 rounded transition-colors"
                      title="Click to edit"
                    >
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getInjectTypeColor(inject.type)}`}>
                        {inject.type}
                      </span>
                    </div>
                  )}
                </td>
                <td className={`px-4 py-3 text-sm text-white ${inject.status === 'skipped' ? 'line-through' : ''}`}>
                  <EditableField
                    inject={inject}
                    field="title"
                    value={inject.title}
                    displayValue={inject.title}
                    editingState={localEditingState}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onEditingValueChange={setLocalEditingValue}
                    onKeyPress={handleKeyPress}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getInjectStatusColor(inject.status)}`}>
                    {inject.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {/* Move Up/Down */}
                    <button
                      onClick={() => onMoveInject(inject.id, 'up')}
                      disabled={sortedIndex === 0}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded icon-btn"
                      title="Move up" aria-label="Move up" data-label="^"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => onMoveInject(inject.id, 'down')}
                      disabled={sortedIndex === injects.length - 1}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded icon-btn"
                      title="Move down" aria-label="Move down" data-label="v"
                    >
                      ↓
                    </button>
                    
                    {/* Complete/Incomplete */}
                    <button
                      onClick={() => onToggleInjectStatus(inject.id)}
                      disabled={inject.status === 'skipped'}
                      className={`px-2 py-1 text-xs font-semibold rounded transition-colors disabled:opacity-50 icon-btn ${
                        inject.status === 'completed' 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={inject.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                      aria-label={inject.status === 'completed' ? 'Undo complete' : 'Mark complete'}
                      data-label={inject.status === 'completed' ? 'Undo' : 'Done'}
                    >
                      {inject.status === 'completed' ? '↶' : '✓'}
                    </button>
                    
                    {/* Skip */}
                    <button
                      onClick={() => onSkipInject(inject.id)}
                      disabled={inject.status === 'skipped' || inject.status === 'completed'}
                      className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded icon-btn"
                      title="Skip inject" aria-label="Skip inject" data-label="Skip"
                    >
                      ⊘
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={() => onDeleteInject(inject.id)}
                      className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded icon-btn"
                      title="Delete inject" aria-label="Delete inject" data-label="Del"
                    >
                      🗑
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
