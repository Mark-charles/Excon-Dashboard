'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { InjectItem, ResourceItem, FilterState } from '../shared/types'
import { formatHMS, parseHMS } from '../../utils/timeUtils'
import { getInjectTypeGlyph } from '../../utils/iconHelpers'
import { getResourceInitials } from '../../utils/resourceUtils'

interface TimelineProps {
  injects: InjectItem[]
  resources: ResourceItem[]
  currentSeconds: number
  exerciseFinishTime: string
  filterState: FilterState
}

const Timeline: React.FC<TimelineProps> = ({
  injects,
  resources,
  currentSeconds,
  exerciseFinishTime,
  filterState
}) => {
  // Measure container width for responsive timeline
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [timelineWidth, setTimelineWidth] = useState<number>(1200)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      // Allow the timeline to shrink on small screens for better mobile behavior
      const width = Math.max(300, el.clientWidth - 24)
      setTimelineWidth(width)
    }
    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Filter items based on current filter state
  const filteredInjects = useMemo(() => injects.filter(inject => {
    if (!filterState.showInjects) return false
    if (inject.type === 'in person' && !filterState.showInPerson) return false
    if (inject.type === 'radio/phone' && !filterState.showRadioPhone) return false
    if (inject.type === 'electronic' && !filterState.showElectronic) return false
    if (inject.type === 'map inject' && !filterState.showMapInject) return false
    if (inject.type === 'other' && !filterState.showOther) return false
    return true
  }), [injects, filterState])

  const filteredResources = useMemo(() => resources.filter(resource => {
    if (!filterState.showResources) return false
    if (resource.status === 'requested' && !filterState.showRequestedStatus) return false
    if (resource.status === 'tasked' && !filterState.showTaskedStatus) return false
    if (resource.status === 'enroute' && !filterState.showEnrouteStatus) return false
    if (resource.status === 'arrived' && !filterState.showArrivedStatus) return false
    if (resource.status === 'cancelled' && !filterState.showCancelledStatus) return false
    return true
  }), [resources, filterState])

  // Determine the end time based on exercise finish time or fallback to max content time
  const finishTimeSeconds = exerciseFinishTime && parseHMS(exerciseFinishTime) !== null ? parseHMS(exerciseFinishTime)! : 0
  const maxContentSeconds = Math.max(
    ...injects.map(i => i.dueSeconds),
    ...resources.map(r => r.etaSeconds),
    0
  )
  
  // Use exercise finish time if set, otherwise use content max + 30 minutes, minimum 1 hour
  const timelineEndSeconds = finishTimeSeconds > 0 
    ? finishTimeSeconds 
    : Math.max(maxContentSeconds + 1800, 3600) // +30 min buffer, min 1 hour
  
  const getTimelinePosition = useCallback((seconds: number): number => {
    return (seconds / timelineEndSeconds) * (timelineWidth - 40) + 20 // Account for padding
  }, [timelineEndSeconds, timelineWidth])
  
  const nowPosition = getTimelinePosition(currentSeconds)

  // Calculate time intervals for markers
  const getTimeIntervals = () => {
    const totalMinutes = timelineEndSeconds / 60
    let intervalMinutes: number
    
    if (totalMinutes <= 60) intervalMinutes = 10
    else if (totalMinutes <= 180) intervalMinutes = 30
    else if (totalMinutes <= 360) intervalMinutes = 60
    else intervalMinutes = 120
    
    const intervals = []
    for (let minutes = 0; minutes <= totalMinutes; minutes += intervalMinutes) {
      intervals.push({
        seconds: minutes * 60,
        label: formatHMS(minutes * 60)
      })
    }
    return intervals
  }

  const timeIntervals = getTimeIntervals()

  // Calculate vertical offset for overlapping items at same time
  const getVerticalOffset = (timeSeconds: number, itemId: string) => {
    const sameTimeItems = [...filteredInjects, ...filteredResources]
      .filter(item => {
        const itemTime = 'dueSeconds' in item ? item.dueSeconds : item.etaSeconds
        return Math.abs(itemTime - timeSeconds) < 120 // Within 2 minutes
      })
      .sort((a, b) => {
        // Sort by ID for consistent ordering
        const aId = 'dueSeconds' in a ? a.id : a.id
        const bId = 'dueSeconds' in b ? b.id : b.id
        return aId.localeCompare(bId)
      })
    
    const itemIndex = sameTimeItems.findIndex(item => {
      const id = 'dueSeconds' in item ? item.id : item.id
      return id === itemId
    })
    
    return itemIndex * 14 // 14px vertical spacing
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700" ref={containerRef}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="text-3xl font-bold text-white tracking-tight">Exercise Timeline</h3>
        </div>
        
        {/* Compact Legend */}
        <div className="flex items-center gap-6 text-xs text-gray-400 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-600/50">
          <div className="text-blue-400 font-medium">Inject Types:</div>
          <div className="flex items-center gap-1">
            <span className="text-blue-400">{getInjectTypeGlyph('in person', 'svg', 'small')}</span>
            <span>In Person</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-400">{getInjectTypeGlyph('radio/phone', 'svg', 'small')}</span>
            <span>Radio</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-purple-400">{getInjectTypeGlyph('electronic', 'svg', 'small')}</span>
            <span>Electronic</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-400">{getInjectTypeGlyph('map inject', 'svg', 'small')}</span>
            <span>Map</span>
          </div>
        </div>
      </div>
      
      <div className="relative w-full">
        {/* Main Timeline Container - Fixed Height for Scalability */}
        <div 
          className="relative bg-gradient-to-b from-gray-950 to-gray-900 rounded-lg border border-gray-600/50 mx-auto shadow-xl"
          style={{ 
            width: `${timelineWidth}px`,
            height: '120px' // Fixed height regardless of item count
          }}
        >
          {/* Timeline Track */}
          <div className="absolute top-1/2 left-5 right-5 h-2 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-full transform -translate-y-1/2">
            
            {/* Current Time Indicator */}
            <div 
              className="absolute top-1/2 w-0.5 h-16 bg-yellow-400 transform -translate-y-1/2 -translate-x-1/2 z-30 shadow-lg"
              style={{ left: `${nowPosition - 20}px` }}
            >
              <div className="absolute -top-8 -left-6 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                NOW
              </div>
            </div>

            {/* Exercise End Indicator */}
            <div 
              className="absolute top-1/2 w-0.5 h-16 bg-red-400 transform -translate-y-1/2 -translate-x-1/2 z-20"
              style={{ left: `${timelineWidth - 40}px` }}
            >
              <div className="absolute -top-8 -left-4 bg-red-400 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                END
              </div>
            </div>

            {/* Event Dots - High Density Visualization */}
            {filteredInjects.map((inject) => {
              const position = getTimelinePosition(inject.dueSeconds)
              const verticalOffset = getVerticalOffset(inject.dueSeconds, inject.id)
              const timeUntilDue = inject.dueSeconds - currentSeconds
              const isDueSoon = inject.status === 'pending' && timeUntilDue >= 0 && timeUntilDue <= 60

              return (
                <div
                  key={`inject-${inject.id}`}
                  className="absolute group cursor-pointer z-10"
                  style={{ 
                    left: `${position - 20}px`, 
                    top: `${-8 - verticalOffset}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {/* Inject Icon */}
                  <div
                    className={`
                      transition-all duration-200 hover:scale-125 p-1 rounded-full drop-shadow
                      ${inject.status === 'completed' ? 'text-emerald-300 bg-emerald-400/20' :
                        inject.status === 'missed' ? 'text-red-300 bg-red-400/20 animate-pulse' :
                        inject.status === 'skipped' ? 'text-orange-300 bg-orange-400/20' :
                        isDueSoon ? 'text-orange-200 bg-orange-500/30 ring-2 ring-orange-400/70 animate-pulse' :
                        'text-blue-300 bg-blue-400/20'}
                    `}
                  >
                    {getInjectTypeGlyph(inject.type, 'svg', 'small')}
                  </div>
                  
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 text-sm max-w-xs">
                      <div className="font-bold text-blue-400">#{inject.number} {inject.title}</div>
                      <div className="text-xs text-gray-300 mt-1 space-y-1">
                        <div><span className="text-yellow-400">Time:</span> {formatHMS(inject.dueSeconds)}</div>
                        <div><span className="text-yellow-400">Type:</span> {inject.type}</div>
                        <div><span className="text-yellow-400">To:</span> {inject.to || 'All units'}</div>
                        <div><span className="text-yellow-400">From:</span> {inject.from || 'Exercise Control'}</div>
                        <div><span className="text-yellow-400">Status:</span> <span className="capitalize">{inject.status}</span></div>
                        {inject.notes ? (
                          <div><span className="text-yellow-400">Notes:</span> {inject.notes}</div>
                        ) : null}
                        {inject.resources ? (
                          <div><span className="text-yellow-400">Resources:</span> {inject.resources}</div>
                        ) : null}
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Resource Dots */}
            {filteredResources.map((resource) => {
              const position = getTimelinePosition(resource.etaSeconds)
              const verticalOffset = getVerticalOffset(resource.etaSeconds, resource.id)
              
              return (
                <div
                  key={`resource-${resource.id}`}
                  className="absolute group cursor-pointer z-10"
                  style={{ 
                    left: `${position - 20}px`, 
                    top: `${8 + verticalOffset}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {/* Resource Icon */}
                  <div 
                    className={`
                      transition-all duration-200 hover:scale-125 p-1 rounded-full drop-shadow
                      ${resource.status === 'arrived' ? 'text-emerald-300 bg-emerald-400/20' :
                        resource.status === 'enroute' ? 'text-blue-300 bg-blue-400/20 animate-pulse' :
                        resource.status === 'tasked' ? 'text-amber-300 bg-amber-400/20 animate-pulse' :
                        resource.status === 'cancelled' ? 'text-red-300 bg-red-400/20' : 
                        'text-gray-300 bg-gray-400/20'}
                    `}
                  >
                    <div
                      className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 font-semibold flex items-center justify-center text-xs uppercase"
                    >
                      {getResourceInitials(resource.label)}
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 text-sm max-w-xs">
                      <div className="font-bold text-emerald-400">{resource.label}</div>
                      <div className="text-xs text-gray-300 mt-1 space-y-1">
                        <div><span className="text-yellow-400">ETA:</span> {formatHMS(resource.etaSeconds)}</div>
                        {resource.kind && <div><span className="text-yellow-400">Type:</span> {resource.kind}</div>}
                        <div><span className="text-yellow-400">Status:</span> <span className="capitalize">{resource.status}</span></div>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-900"></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Time Markers */}
        <div className="relative mt-4" style={{ width: `${timelineWidth}px`, margin: '0 auto' }}>
          <div className="relative h-8 border-t border-gray-700">
            {timeIntervals.map((interval) => (
              <div 
                key={interval.seconds}
                className="absolute top-0 transform -translate-x-1/2" 
                style={{ left: `${getTimelinePosition(interval.seconds)}px` }}
              >
                <div className="w-px h-4 bg-gray-500"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 font-mono whitespace-nowrap">
                  {interval.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="flex justify-center gap-6 mt-4 text-sm text-gray-400">
          <div>Total Injects: <span className="text-white font-medium">{filteredInjects.length}</span></div>
          <div>Total Resources: <span className="text-white font-medium">{filteredResources.length}</span></div>
          <div>Exercise Duration: <span className="text-white font-medium">{formatHMS(timelineEndSeconds)}</span></div>
        </div>
      </div>
    </div>
  )
}

export default Timeline
