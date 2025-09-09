"use client"

import React from 'react'
import { User, Phone, Cpu, MapPin, Tag, ClipboardCheck, Truck, Clock, CheckCircle2 } from 'lucide-react'

export type TimelineFilterBarProps = {
  showInjects: boolean
  setShowInjects: (v: boolean) => void
  showResources: boolean
  setShowResources: (v: boolean) => void

  showInPerson: boolean
  setShowInPerson: (v: boolean) => void
  showRadioPhone: boolean
  setShowRadioPhone: (v: boolean) => void
  showElectronic: boolean
  setShowElectronic: (v: boolean) => void
  showMapInject: boolean
  setShowMapInject: (v: boolean) => void
  showOther: boolean
  setShowOther: (v: boolean) => void

  showRequestedStatus: boolean
  setShowRequestedStatus: (v: boolean) => void
  showTaskedStatus: boolean
  setShowTaskedStatus: (v: boolean) => void
  showEnrouteStatus: boolean
  setShowEnrouteStatus: (v: boolean) => void
  showArrivedStatus: boolean
  setShowArrivedStatus: (v: boolean) => void
  showCancelledStatus: boolean
  setShowCancelledStatus: (v: boolean) => void
}

const TimelineFilterBar: React.FC<TimelineFilterBarProps> = ({
  showInjects,
  setShowInjects,
  showResources,
  setShowResources,
  showInPerson,
  setShowInPerson,
  showRadioPhone,
  setShowRadioPhone,
  showElectronic,
  setShowElectronic,
  showMapInject,
  setShowMapInject,
  showOther,
  setShowOther,
  showRequestedStatus,
  setShowRequestedStatus,
  showTaskedStatus,
  setShowTaskedStatus,
  showEnrouteStatus,
  setShowEnrouteStatus,
  showArrivedStatus,
  setShowArrivedStatus,
  showCancelledStatus,
  setShowCancelledStatus,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap gap-6">
        {/* Type Filters */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white">Show Types</h4>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="checkbox" checked={showInjects} onChange={(e) => setShowInjects(e.target.checked)} className="mr-2" />
              <span className="text-white text-sm">Injects</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showResources} onChange={(e) => setShowResources(e.target.checked)} className="mr-2" />
              <span className="text-white text-sm">Resources</span>
            </label>
          </div>
        </div>

        {/* Inject Type Filters */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white">Inject Type</h4>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center">
              <input type="checkbox" checked={showInPerson} onChange={(e) => setShowInPerson(e.target.checked)} className="mr-2" />
              <span className="inline-flex items-center gap-1 text-blue-400"><User size={14} className="inline" /> In Person</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showRadioPhone} onChange={(e) => setShowRadioPhone(e.target.checked)} className="mr-2" />
              <span className="inline-flex items-center gap-1 text-green-400"><Phone size={14} className="inline" /> Radio/Phone</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showElectronic} onChange={(e) => setShowElectronic(e.target.checked)} className="mr-2" />
              <span className="inline-flex items-center gap-1 text-purple-400"><Cpu size={14} className="inline" /> Electronic</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showMapInject} onChange={(e) => setShowMapInject(e.target.checked)} className="mr-2" />
              <span className="text-red-400 text-sm"><MapPin size={14} className="inline" /> Map Inject</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showOther} onChange={(e) => setShowOther(e.target.checked)} className="mr-2" />
              <span className="text-orange-400 text-sm"><Tag size={14} className="inline" /> Other</span>
            </label>
          </div>
        </div>

        {/* Resource Status Filters */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-white">Resource Status</h4>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center">
              <input type="checkbox" checked={showRequestedStatus} onChange={(e) => setShowRequestedStatus(e.target.checked)} className="mr-2" />
              <span className="text-gray-400 text-sm"><Clock size={14} className="inline" /> Requested</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showTaskedStatus} onChange={(e) => setShowTaskedStatus(e.target.checked)} className="mr-2" />
              <span className="text-amber-400 text-sm"><ClipboardCheck size={14} className="inline" /> Tasked</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showEnrouteStatus} onChange={(e) => setShowEnrouteStatus(e.target.checked)} className="mr-2" />
              <span className="text-blue-400 text-sm"><Truck size={14} className="inline" /> Enroute</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showArrivedStatus} onChange={(e) => setShowArrivedStatus(e.target.checked)} className="mr-2" />
              <span className="text-green-400 text-sm"><CheckCircle2 size={14} className="inline" /> Arrived</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={showCancelledStatus} onChange={(e) => setShowCancelledStatus(e.target.checked)} className="mr-2" />
              <span className="text-red-400 text-sm"><Tag size={14} className="inline" /> Cancelled</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(TimelineFilterBar)

