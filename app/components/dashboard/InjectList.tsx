'use client'

import React, { useState, useMemo } from 'react'
import type { InjectItem, InjectType, EditingState } from '../shared/types'
import { formatHMS, parseHMS } from '../../utils/timeUtils'
import { getInjectTypeGlyph } from '../../utils/iconHelpers'
import { getInjectTypeTextColor } from '../../utils/styleUtils'

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
  onCancelEdit: () => void
  onEditingValueChange: (value: string) => void
  onKeyPress: (e: React.KeyboardEvent) => void
  className?: string
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
  onCancelEdit,
  onEditingValueChange,
  onKeyPress,
  className
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
          className="px-2 py-1 bg-gray-700 text-white text-xs rounded border border-blue-400 focus:ring-1 focus:ring-blue-400"
          autoFocus
        >
          {selectOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )
    }

    // Multiline editing for Inject title and Notes
    if (field === 'title' || field === 'notes') {
      const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          onSaveEdit()
        } else if (e.key === 'Escape') {
          onCancelEdit()
        }
      }
      return (
        <textarea
          value={editingState.editingValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={handleKeyDown}
          rows={4}
          className="px-3 py-2 bg-gray-700 text-white text-sm rounded-md border border-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 min-w-0 w-full whitespace-pre-wrap break-words resize-none"
          autoFocus
        />
      )
    }

    return (
      <input
        type="text"
        value={editingState.editingValue}
        onChange={(e) => onEditingValueChange(e.target.value)}
        onBlur={onSaveEdit}
        onKeyDown={onKeyPress}
        className="px-3 py-2 bg-gray-700 text-white text-sm rounded-md border border-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 min-w-0 w-full"
        autoFocus
      />
    )
  }

  const baseBtn = "cursor-pointer hover:bg-gray-700/50 px-1 py-1 rounded transition-colors text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900";
  const btnClass = className ? `${baseBtn} ${className}` : `${baseBtn} truncate`;
  return (
    <button
      type="button"
      onClick={() => onStartEdit(inject.id, field, value)}
      className={btnClass}
      title="Click to edit"
      aria-label={`Edit ${field} for inject #${inject.number}`}
    >
      {displayValue || value}
    </button>
  )
}

const InjectList: React.FC<InjectListProps> = React.memo(({
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

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
        case 'notes':
          return { ...inject, notes: value }
        case 'resources':
          return { ...inject, resources: value }
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

  // Sort injects once for efficiency
  const sortedInjects = useMemo(() =>
    [...injects].sort((a, b) => a.dueSeconds - b.dueSeconds),
    [injects]
  )

  const columnTemplate = 'minmax(3.5rem, 0.6fr) minmax(5.5rem, 0.9fr) minmax(8rem, 1fr) minmax(8rem, 1fr) minmax(7rem, 1fr) minmax(18rem, 2.6fr) minmax(12rem, 1.6fr) minmax(8rem, 1.1fr) minmax(4.5rem, 0.7fr) minmax(6.5rem, 1fr)'

  const renderStatusIcon = (status: InjectItem['status']) => {
    if (status === 'completed') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-emerald-400" aria-label="Completed" title="Completed">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      )
    }
    if (status === 'missed') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-red-400" aria-label="Missed" title="Missed">
          <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
    if (status === 'skipped') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-orange-400" aria-label="Skipped" title="Skipped">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }

    return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="text-gray-400" aria-label="Pending" title="Pending">
        <circle cx="5" cy="5" r="4" fill="currentColor"/>
      </svg>
    )
  }

  const renderActions = (inject: InjectItem, sortedIndex: number, total: number) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onMoveInject(inject.id, 'up')}
        disabled={sortedIndex === 0}
        className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title="Move up"
        aria-label={`Move inject #${inject.number} up`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5l7 7H5l7-7z" fill="currentColor"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onMoveInject(inject.id, 'down')}
        disabled={sortedIndex === total - 1}
        className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title="Move down"
        aria-label={`Move inject #${inject.number} down`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 19l-7-7h14l-7 7z" fill="currentColor"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onToggleInjectStatus(inject.id)}
        disabled={inject.status === 'skipped'}
        className={`p-1 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          inject.status === 'completed'
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
        title={inject.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
        aria-label={inject.status === 'completed'
          ? `Mark inject #${inject.number} incomplete`
          : `Mark inject #${inject.number} complete`}
      >
        {inject.status === 'completed' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={() => onSkipInject(inject.id)}
        disabled={inject.status === 'skipped'}
        className="p-1 rounded-md bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        title="Skip"
        aria-label={`Skip inject #${inject.number}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M13 5v14" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onDeleteInject(inject.id)}
        className="p-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        title="Delete"
        aria-label={`Delete inject #${inject.number}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 7h12M9 7v12m6-12v12M10 5h4l1 2H9l1-2z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 shadow-2xl border border-gray-600/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-blue-500/50 shadow-lg"></div>
            <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-20"></div>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent tracking-tight">
            Master Schedule of Events
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-900/30 to-slate-800/50 px-5 py-3 rounded-xl border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-blue-300 font-medium">{injects.length} Total</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-300 font-medium">{injects.filter(i => i.status === 'completed').length} Complete</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-300 font-medium">{injects.filter(i => i.status === 'missed').length} Missed</span>
              </div>
            </div>
          </div>
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-700">
            <button
              className={`px-3 py-1 text-xs ${viewMode==='table'?'bg-blue-600 text-white':'bg-gray-800 text-gray-300'} hover:bg-blue-600 hover:text-white`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              Table
            </button>
            <button
              className={`px-3 py-1 text-xs ${viewMode==='cards'?'bg-blue-600 text-white':'bg-gray-800 text-gray-300'} hover:bg-blue-600 hover:text-white`}
              onClick={() => setViewMode('cards')}
              aria-label="Card view"
            >
              Cards
            </button>
          </div>
        </div>
      </div>
      
      {injects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4 inline-flex items-center justify-center text-blue-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="4" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 16h8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 16v3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="text-xl font-medium text-gray-300 mb-2">No Schedule Items</div>
          <div className="text-gray-400">Items will appear here when added to the Master Schedule of Events</div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-hidden">
          <div
            className="max-h-[700px] overflow-y-auto border border-gray-600 rounded-lg shadow-2xl"
            role="table"
            aria-label="Master Schedule of Events"
            aria-rowcount={sortedInjects.length + 1}
            tabIndex={0}
          >
            {/* MSE Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b-2 border-blue-500/70 z-10 shadow-lg backdrop-blur-sm" role="rowgroup">
              <div
                className="grid grid-cols-10 gap-2 px-3 py-4 text-sm font-bold text-white tracking-wide"
                style={{ gridTemplateColumns: columnTemplate }}
                role="row"
                aria-rowindex={1}
              >
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Inject<br/>Number</div>
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="ascending">Elapsed<br/>Time</div>
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Inject<br/>From</div>
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Inject<br/>To</div>
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Inject<br/>Type</div>
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Inject</div>
                <div className="text-left pl-2 text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Additional Notes/Actions</div>
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Resources</div>
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Completed</div>
                <div className="text-center text-blue-100 uppercase tracking-wider text-xs" role="columnheader" aria-sort="none">Actions</div>
              </div>
            </div>
            {/* MSE Body */}
            <div
              className="bg-gradient-to-b from-gray-900 to-slate-900"
              role="rowgroup"
            >
              {sortedInjects.map((inject, sortedIndex) => {
                const isUpcoming = inject.status !== 'completed' && inject.status !== 'missed' && inject.status !== 'skipped' && currentSeconds >= (inject.dueSeconds - 60) && currentSeconds < inject.dueSeconds
                return (
                <div
                  key={inject.id}
                  className={`
                    grid grid-cols-10 gap-2 px-3 py-5 border-b border-gray-700/40 hover:bg-blue-900/10 hover:border-blue-600/30 transition-all duration-200
                    ${inject.status === 'completed' ? 'bg-emerald-900/30' : ''}
                    ${inject.status === 'missed' ? 'bg-red-900/30' : ''}
                    ${inject.status !== 'completed' && inject.status !== 'missed' && currentSeconds < inject.dueSeconds ? 'bg-gray-900/20' : ''}
                    ${inject.status === 'skipped' ? 'opacity-60' : ''}
                    ${sortedIndex % 2 === 0 ? 'bg-slate-900/40' : 'bg-gray-900/20'}
                    ${isUpcoming ? 'ring-2 ring-yellow-400/60 animate-pulse' : ''}
                  `}
                  style={{ gridTemplateColumns: columnTemplate }}
                  role="row"
                  aria-rowindex={sortedIndex + 2}
                  aria-label={`Inject ${inject.number}: ${inject.title} at ${formatHMS(inject.dueSeconds)}, status: ${inject.status}`}
                  tabIndex={0}
                >
                  {/* Inject Number */}
                  <div className="flex justify-center items-center text-center" role="gridcell">
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
                      className="text-blue-400 font-bold text-sm whitespace-nowrap"
                    />
                  </div>
                    
                  {/* Elapsed Time */}
                  <div className="flex justify-center items-center text-center" role="gridcell">
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
                      className="font-mono text-green-400 font-medium text-sm whitespace-nowrap"
                    />
                  </div>
                    
                  {/* Inject From */}
                  <div className="flex justify-center items-center text-center" role="gridcell">
                    <EditableField
                      inject={inject}
                      field="from"
                      value={inject.from || ''}
                      displayValue={inject.from || 'ExCon'}
                      editingState={localEditingState}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditingValueChange={setLocalEditingValue}
                      onKeyPress={handleKeyPress}
                      className="text-gray-300 text-sm truncate w-full text-center"
                    />
                  </div>

                  {/* Inject To */}
                  <div className="flex justify-center items-center text-center" role="gridcell">
                    <EditableField
                      inject={inject}
                      field="to"
                      value={inject.to || ''}
                      displayValue={inject.to || 'All Units'}
                      editingState={localEditingState}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditingValueChange={setLocalEditingValue}
                      onKeyPress={handleKeyPress}
                      className="text-gray-300 text-sm truncate w-full text-center"
                    />
                  </div>

                  {/* Inject Type */}
                  <div className="flex justify-center items-center" role="gridcell">
                    {localEditingField?.id === inject.id && localEditingField?.field === 'type' ? (
                      <select
                        value={localEditingValue}
                        onChange={(e) => setLocalEditingValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyPress}
                        className="px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-400 focus:ring-1 focus:ring-blue-400 w-full"
                        autoFocus
                      >
                        <option value="in person">Face to Face</option>
                        <option value="radio/phone">Radio/Phone</option>
                        <option value="electronic">Electronic</option>
                        <option value="map inject">Map Inject</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(inject.id, 'type', inject.type)}
                        className={`cursor-pointer inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-700/50 hover:bg-gray-600/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 w-full justify-center ${getInjectTypeTextColor(inject.type)}`}
                        title="Click to edit inject type"
                        aria-label={`Edit type for inject #${inject.number}`}
                      >
                        <span className="text-sm drop-shadow-md">{getInjectTypeGlyph(inject.type, 'svg', 'small')}</span>
                        <span className="capitalize text-sm font-medium text-gray-200">
                          {inject.type === 'in person' ? 'Face to Face' :
                           inject.type === 'radio/phone' ? 'Radio/Phone' :
                           inject.type === 'map inject' ? 'Map Inject' :
                           inject.type.charAt(0).toUpperCase() + inject.type.slice(1)}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Inject Title (moved after type) */}
                  <div className="flex items-start justify-start pl-2" role="gridcell">
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
                      className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words w-full"
                    />
                  </div>

                  {/* Additional Notes/Actions */}
                  <div className="flex items-start justify-start pl-2" role="gridcell">
                    <EditableField
                      inject={inject}
                      field="notes"
                      value={inject.notes || ''}
                      displayValue={inject.notes || ''}
                      editingState={localEditingState}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditingValueChange={setLocalEditingValue}
                      onKeyPress={handleKeyPress}
                      className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words w-full"
                    />
                  </div>

                  {/* Resources */}
                  <div className="flex justify-center items-center text-center" role="gridcell">
                    <div className="flex items-center gap-2 justify-center w-full">
                      {inject.resources ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0">
                            <path d="M8 17l7-7a2.5 2.5 0 10-3.5-3.5L5 9a4 4 0 106 6l6-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          </svg>
                          <EditableField
                            inject={inject}
                            field="resources"
                            value={inject.resources}
                            displayValue={inject.resources}
                            editingState={localEditingState}
                            onStartEdit={handleStartEdit}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onEditingValueChange={setLocalEditingValue}
                            onKeyPress={handleKeyPress}
                            className="text-emerald-400 text-sm font-medium truncate"
                          />
                        </>
                      ) : (
                        <EditableField
                          inject={inject}
                          field="resources"
                          value={inject.resources || ''}
                          displayValue={inject.resources || ''}
                          editingState={localEditingState}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onEditingValueChange={setLocalEditingValue}
                          onKeyPress={handleKeyPress}
                          className="text-gray-400 text-sm truncate w-full text-center"
                        />
                      )}
                    </div>
                  </div>
                    
                  {/* Completed Status (icon-only) */}
                  <div className="flex justify-center items-center" role="gridcell">
                    {renderStatusIcon(inject.status)}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center items-center" role="gridcell">
                    {renderActions(inject, sortedIndex, sortedInjects.length)}
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedInjects.map((inject, sortedIndex) => {
            const isUpcoming = inject.status !== 'completed' && inject.status !== 'missed' && inject.status !== 'skipped' && currentSeconds >= (inject.dueSeconds - 60) && currentSeconds < inject.dueSeconds
            return (
              <div
                key={inject.id}
                className={`rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 transition-colors shadow-inner ${
                  inject.status === 'completed' ? 'bg-emerald-900/30' : ''
                } ${
                  inject.status === 'missed' ? 'bg-red-900/30' : ''
                } ${
                  inject.status !== 'completed' && inject.status !== 'missed' && currentSeconds < inject.dueSeconds ? 'bg-gray-900/20' : ''
                } ${isUpcoming ? 'ring-2 ring-yellow-400/60 animate-pulse' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                  <span className="font-mono text-sm text-green-300">{formatHMS(inject.dueSeconds)}</span>
                  <span className="text-blue-300 font-semibold">#{inject.number}</span>
                  <span>From <span className="text-gray-100">{inject.from || 'ExCon'}</span></span>
                  <span>To <span className="text-gray-100">{inject.to || 'All Units'}</span></span>
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-700/40 ${getInjectTypeTextColor(inject.type)}`}>
                    <span>{getInjectTypeGlyph(inject.type, 'svg', 'small')}</span>
                    <span className="capitalize">{inject.type}</span>
                  </span>
                  <div className="ml-auto flex items-center gap-2 text-sm text-gray-200">
                    {renderStatusIcon(inject.status)}
                    <span className="capitalize">{inject.status}</span>
                  </div>
                </div>

                <div className="mt-3 text-white text-sm whitespace-pre-wrap break-words">
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
                    className="whitespace-pre-wrap break-words"
                  />
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
                  <div className="whitespace-pre-wrap break-words">
                    <span className="text-gray-400">Notes:</span>{' '}
                    <EditableField
                      inject={inject}
                      field="notes"
                      value={inject.notes || ''}
                      displayValue={inject.notes || '-'}
                      editingState={localEditingState}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditingValueChange={setLocalEditingValue}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    <span className="text-gray-400">Resources:</span>{' '}
                    <EditableField
                      inject={inject}
                      field="resources"
                      value={inject.resources || ''}
                      displayValue={inject.resources || '-'}
                      editingState={localEditingState}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditingValueChange={setLocalEditingValue}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="uppercase tracking-wide">Actions</span>
                  </div>
                  {renderActions(inject, sortedIndex, sortedInjects.length)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

InjectList.displayName = 'InjectList'

export default InjectList
