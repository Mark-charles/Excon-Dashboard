"use client"

import React, { useState } from 'react'
import TimelineFilterBar from '@/components/dashboard/TimelineFilterBar'
import Timeline from '@/components/dashboard/Timeline'
import InjectList from '@/components/dashboard/InjectList'
import { useDashboardStore } from '@/lib/store'
import { parseHMS } from '@/lib/time'

export type DashboardTimelineProps = {
  canEdit: boolean
  audioEnabled: boolean
  onToggleAudio: () => void
  onExportInjects: () => void
}

const DashboardTimeline: React.FC<DashboardTimelineProps> = ({
  canEdit,
  audioEnabled,
  onToggleAudio,
  onExportInjects,
}) => {
  const currentSeconds = useDashboardStore(s => s.currentSeconds)
  const exerciseFinishTime = useDashboardStore(s => s.exerciseFinishTime)
  const injects = useDashboardStore(s => s.injects)
  const resources = useDashboardStore(s => s.resources)

  const [showInjects, setShowInjects] = useState(true)
  const [showResources, setShowResources] = useState(true)
  const [showInPerson, setShowInPerson] = useState(true)
  const [showRadioPhone, setShowRadioPhone] = useState(true)
  const [showElectronic, setShowElectronic] = useState(true)
  const [showMapInject, setShowMapInject] = useState(true)
  const [showOther, setShowOther] = useState(true)
  const [showRequestedStatus, setShowRequestedStatus] = useState(true)
  const [showTaskedStatus, setShowTaskedStatus] = useState(true)
  const [showEnrouteStatus, setShowEnrouteStatus] = useState(true)
  const [showArrivedStatus, setShowArrivedStatus] = useState(true)
  const [showCancelledStatus, setShowCancelledStatus] = useState(true)

  return (
    <div className="space-y-4">
      <TimelineFilterBar
        showInjects={showInjects}
        setShowInjects={setShowInjects}
        showResources={showResources}
        setShowResources={setShowResources}
        showInPerson={showInPerson}
        setShowInPerson={setShowInPerson}
        showRadioPhone={showRadioPhone}
        setShowRadioPhone={setShowRadioPhone}
        showElectronic={showElectronic}
        setShowElectronic={setShowElectronic}
        showMapInject={showMapInject}
        setShowMapInject={setShowMapInject}
        showOther={showOther}
        setShowOther={setShowOther}
        showRequestedStatus={showRequestedStatus}
        setShowRequestedStatus={setShowRequestedStatus}
        showTaskedStatus={showTaskedStatus}
        setShowTaskedStatus={setShowTaskedStatus}
        showEnrouteStatus={showEnrouteStatus}
        setShowEnrouteStatus={setShowEnrouteStatus}
        showArrivedStatus={showArrivedStatus}
        setShowArrivedStatus={setShowArrivedStatus}
        showCancelledStatus={showCancelledStatus}
        setShowCancelledStatus={setShowCancelledStatus}
      />
      {showInjects && (
        <Timeline
          currentSeconds={currentSeconds}
          finishSeconds={
            typeof exerciseFinishTime === 'string' && exerciseFinishTime
              ? parseHMS(exerciseFinishTime) ?? undefined
              : undefined
          }
          injects={injects.filter(i => {
            if (i.type === 'in person' && !showInPerson) return false
            if (i.type === 'radio/phone' && !showRadioPhone) return false
            if (i.type === 'electronic' && !showElectronic) return false
            if (i.type === 'map inject' && !showMapInject) return false
            if (i.type === 'other' && !showOther) return false
            return true
          })}
          resources={resources.filter(r => {
            if (r.status === 'requested' && !showRequestedStatus) return false
            if (r.status === 'tasked' && !showTaskedStatus) return false
            if (r.status === 'enroute' && !showEnrouteStatus) return false
            if (r.status === 'arrived' && !showArrivedStatus) return false
            if (r.status === 'cancelled' && !showCancelledStatus) return false
            return true
          })}
        />
      )}
      {showInjects && (
        <InjectList
          canEdit={canEdit}
          audioEnabled={audioEnabled}
          onToggleAudio={onToggleAudio}
          onExportCSV={onExportInjects}
        />
      )}
    </div>
  )
}

export default DashboardTimeline

