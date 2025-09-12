'use client'

import React from 'react'
import type { InjectItem, ResourceItem, FilterState } from '../shared/types'
import { formatHMS, parseHMS } from '../../utils/timeUtils'
import { getInjectTypeEmoji, getInjectTypeTextColor, getResourceStatusEmoji, getResourceStatusTextColor } from '../../utils/styleUtils'

interface TimelineProps {
  injects: InjectItem[]
  resources: ResourceItem[]
  currentSeconds: number
  exerciseFinishTime: string
  filterState: FilterState
}

interface TimelineStack {
  items: (InjectItem | ResourceItem)[]
  position: number
  timeSeconds: number
}

const Timeline: React.FC<TimelineProps> = ({
  injects,
  resources,
  currentSeconds,
  exerciseFinishTime,
  filterState
}) => {
  // Filter items based on current filter state
  const filteredInjects = injects.filter(inject => {
    if (!filterState.showInjects) return false
    if (inject.type === 'in person' && !filterState.showInPerson) return false
    if (inject.type === 'radio/phone' && !filterState.showRadioPhone) return false
    if (inject.type === 'electronic' && !filterState.showElectronic) return false
    if (inject.type === 'map inject' && !filterState.showMapInject) return false
    if (inject.type === 'other' && !filterState.showOther) return false
    return true
  })

  const filteredResources = resources.filter(resource => {
    if (!filterState.showResources) return false
    if (resource.status === 'requested' && !filterState.showRequestedStatus) return false
    if (resource.status === 'tasked' && !filterState.showTaskedStatus) return false
    if (resource.status === 'enroute' && !filterState.showEnrouteStatus) return false
    if (resource.status === 'arrived' && !filterState.showArrivedStatus) return false
    if (resource.status === 'cancelled' && !filterState.showCancelledStatus) return false
    return true
  })

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
  
  // Timeline fills full container width (responsive)
  const timelineWidth = 1000 // Wider to accommodate many injects
  const getTimelinePosition = (seconds: number): number => {
    return (seconds / timelineEndSeconds) * (timelineWidth - 32) + 16 // Account for padding
  }
  
  // Get the end position for the red line
  const getEndPosition = (): number => {
    return timelineWidth - 16 // Right edge minus padding
  }

  const nowPosition = getTimelinePosition(currentSeconds)

  // Calculate time intervals for markers - much more granular
  const getTimeIntervals = () => {
    const totalMinutes = timelineEndSeconds / 60
    let intervalMinutes: number
    
    // Much finer granular scaling
    if (totalMinutes <= 15) intervalMinutes = 2 // Every 2 minutes for very short exercises
    else if (totalMinutes <= 30) intervalMinutes = 5 // Every 5 minutes for 30 min exercises
    else if (totalMinutes <= 60) intervalMinutes = 5 // Every 5 minutes for 1 hour exercises
    else if (totalMinutes <= 120) intervalMinutes = 10 // Every 10 minutes for 2 hour exercises  
    else if (totalMinutes <= 240) intervalMinutes = 15 // Every 15 minutes for 4 hour exercises
    else if (totalMinutes <= 480) intervalMinutes = 30 // Every 30 minutes for 8 hour exercises
    else intervalMinutes = 60 // Every hour for very long exercises

    const intervals = []
    for (let minutes = 0; minutes <= totalMinutes; minutes += intervalMinutes) {
      intervals.push(minutes * 60) // Convert back to seconds
    }
    return intervals
  }

  const timeIntervals = getTimeIntervals()

  // Smart inject stacking - group injects that are close together
  const stackInjects = (items: (InjectItem | ResourceItem)[]): TimelineStack[] => {
    const stackedItems: TimelineStack[] = []
    
    const sortedItems = [...items].sort((a, b) => {
      const aTime = 'dueSeconds' in a ? a.dueSeconds : a.etaSeconds
      const bTime = 'dueSeconds' in b ? b.dueSeconds : b.etaSeconds
      return aTime - bTime
    })

    const STACK_THRESHOLD = timelineWidth * 0.03 // Items within 3% of timeline width get stacked

    sortedItems.forEach(item => {
      const itemTime = 'dueSeconds' in item ? item.dueSeconds : item.etaSeconds
      const itemPosition = getTimelinePosition(itemTime)
      
      // Find existing stack within threshold
      const existingStack = stackedItems.find(stack => 
        Math.abs(stack.position - itemPosition) < STACK_THRESHOLD
      )
      
      if (existingStack) {
        existingStack.items.push(item)
      } else {
        stackedItems.push({
          items: [item],
          position: itemPosition,
          timeSeconds: itemTime
        })
      }
    })

    return stackedItems
  }

  // Combine and stack all items
  const allItems = [...filteredInjects, ...filteredResources]
  const stackedItems = stackInjects(allItems)

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Timeline</h3>
        <div className="flex gap-4 text-sm flex-wrap">
          <span className="text-blue-400">👤 In Person</span>
          <span className="text-green-400">📞 Radio/Phone</span>
          <span className="text-purple-400">💻 Electronic</span>
          <span className="text-red-400">🗺️ Map Inject</span>
          <span className="text-orange-400">❓ Other</span>
          <span className="text-gray-400">🚛 Resources</span>
        </div>
      </div>
      
      <div className="relative w-full pt-6">
        {/* Main Timeline Bar */}
        <div 
          className="relative bg-gray-900 rounded-lg border-2 border-gray-600 mx-auto"
          style={{ 
            width: `${timelineWidth}px`,
            height: `${Math.max(120, stackedItems.length > 0 ? Math.max(...stackedItems.map(stack => stack.items.length)) * 30 + 80 : 120)}px`
          }}
        >
          {/* Background timeline track */}
          <div className="absolute top-1/2 left-4 right-4 h-2 bg-gray-700 rounded-full transform -translate-y-1/2">
            
            {/* Moving yellow "now" line */}
            <div 
              className="absolute top-1/2 w-1 bg-yellow-400 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg z-20"
              style={{ 
                left: `${nowPosition}px`,
                height: `${Math.max(120, stackedItems.length > 0 ? Math.max(...stackedItems.map(stack => stack.items.length)) * 30 + 80 : 120) - 40}px`
              }}
            >
              <div className="absolute -top-10 -left-6 w-12 px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded text-center whitespace-nowrap">
                NOW
              </div>
            </div>

            {/* Red end line */}
            <div 
              className="absolute top-1/2 w-1 bg-red-500 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg z-10"
              style={{ 
                left: `${getEndPosition()}px`,
                height: `${Math.max(120, stackedItems.length > 0 ? Math.max(...stackedItems.map(stack => stack.items.length)) * 30 + 80 : 120) - 40}px`
              }}
            >
              <div className="absolute -top-10 -left-6 w-12 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded text-center whitespace-nowrap">
                END
              </div>
            </div>

            {/* Stacked Items */}
            {stackedItems.map((stack, stackIndex) => (
              <div key={stackIndex} className="absolute" style={{ left: `${stack.position}px` }}>
                {stack.items.length === 1 ? (
                  // Single item
                  <div
                    className={`absolute top-1/2 text-xl transform -translate-y-1/2 -translate-x-1/2 cursor-pointer z-15 ${'dueSeconds' in stack.items[0] 
                      ? getInjectTypeTextColor(stack.items[0].type)
                      : getResourceStatusTextColor(stack.items[0].status)}`}
                    title={'dueSeconds' in stack.items[0] 
                      ? `#${stack.items[0].number} ${stack.items[0].title} - ${formatHMS(stack.items[0].dueSeconds)} (${stack.items[0].type}) - To: ${stack.items[0].to || 'N/A'} From: ${stack.items[0].from || 'N/A'} (${stack.items[0].status})`
                      : `${stack.items[0].label} - ETA: ${formatHMS(stack.items[0].etaSeconds)} (${stack.items[0].status})`}
                  >
                    {'dueSeconds' in stack.items[0] 
                      ? getInjectTypeEmoji(stack.items[0].type)
                      : getResourceStatusEmoji(stack.items[0].status)}
                  </div>
                ) : (
                  // Stacked items
                  <>
                    {stack.items.map((item, itemIndex) => (
                      <div
                        key={'dueSeconds' in item ? item.id : item.id}
                        className={`absolute text-lg transform -translate-x-1/2 cursor-pointer z-15 ${'dueSeconds' in item 
                          ? getInjectTypeTextColor(item.type)
                          : getResourceStatusTextColor(item.status)}`}
                        style={{ 
                          top: `${40 + (itemIndex - stack.items.length / 2) * 28}px`
                        }}
                        title={'dueSeconds' in item 
                          ? `#${item.number} ${item.title} - ${formatHMS(item.dueSeconds)} (${item.type}) - To: ${item.to || 'N/A'} From: ${item.from || 'N/A'} (${item.status})`
                          : `${item.label} - ETA: ${formatHMS(item.etaSeconds)} (${item.status})`}
                      >
                        {'dueSeconds' in item 
                          ? getInjectTypeEmoji(item.type)
                          : getResourceStatusEmoji(item.status)}
                      </div>
                    ))}
                    {/* Stack indicator */}
                    <div className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-400 flex items-center justify-center text-xs font-bold text-white z-5">
                      {stack.items.length}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time markers below timeline */}
        <div className="relative mt-4 mx-auto" style={{ width: `${timelineWidth}px` }}>
          {timeIntervals.map(seconds => (
            <div 
              key={seconds}
              className="absolute text-sm text-gray-400 font-mono transform -translate-x-1/2"
              style={{ left: `${getTimelinePosition(seconds)}px` }}
            >
              {formatHMS(seconds)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Timeline