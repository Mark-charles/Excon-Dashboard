"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { InjectItem, InjectType, ResourceItem, ResourceStatus } from '@/lib/types'
import { formatHMS } from '@/lib/time'
import { User, Phone, Cpu, MapPin, Tag, Truck, Users, Plane, Cog, Package, ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react'

export type TimelineProps = {
  injects: InjectItem[]
  resources: ResourceItem[]
  currentSeconds: number
  // Optionally bound the timeline to a finish time; otherwise derived from data
  finishSeconds?: number
}

const typeColor: Record<InjectType, string> = {
  'in person': 'bg-blue-500',
  'radio/phone': 'bg-green-500',
  'electronic': 'bg-purple-500',
  'map inject': 'bg-red-500',
  'other': 'bg-orange-500',
}

const Timeline: React.FC<TimelineProps> = ({ injects, resources, currentSeconds, finishSeconds }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect
        setWidth(cr.width)
        setHeight(cr.height)
      }
    })
    ro.observe(el)
    setWidth(el.clientWidth)
    setHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const total = useMemo(() => {
    const maxInject = injects.reduce((m, i) => Math.max(m, i.dueSeconds), 0)
    const maxRes = resources.reduce((m, r) => Math.max(m, r.etaSeconds), 0)
    const max = Math.max(maxInject, maxRes)
    return Math.max(finishSeconds ?? 0, max)
  }, [injects, resources, finishSeconds])

  const safeTotal = Math.max(total, 60) // ensure non-zero timeline
  const progress = Math.max(0, Math.min(1, currentSeconds / safeTotal))

  // Choose a tick interval based on width so labels don't overlap
  const idealTickCount = Math.max(3, Math.floor((width || 600) / 70))
  const approxSecondsPerTick = safeTotal / idealTickCount
  const minute = 60
  const candidates = [5*minute, 10*minute, 15*minute, 30*minute, 60*minute, 2*60*minute, 3*60*minute]
  const tickEvery = candidates.find(c => c >= approxSecondsPerTick) || candidates[candidates.length-1]
  const ticks: number[] = []
  for (let t = 0; t <= safeTotal + 1; t += tickEvery) ticks.push(Math.min(t, safeTotal))

  // Simple lane assignment to avoid overlaps: greedy pack by x-distance
  const assignLanes = (xs: number[], threshold = 14) => {
    const lanesLast: number[] = []
    const indices: number[] = []
    for (const x of xs) {
      let lane = lanesLast.findIndex((last) => x - last >= threshold)
      if (lane === -1) {
        lane = lanesLast.length
        lanesLast.push(x)
      } else {
        lanesLast[lane] = x
      }
      indices.push(lane)
    }
    return indices
  }

  const centerY = height > 0 ? height / 2 : 56 // fallback ~h-28/2
  const laneStep = 12 // px between stacked icons

  const injectPositions = useMemo(() => {
    if (width === 0) return [] as { x: number; inj: InjectItem }[]
    const arr = [...injects]
      .sort((a, b) => a.dueSeconds - b.dueSeconds)
      .map((inj) => ({ x: Math.max(0, Math.min(width, (inj.dueSeconds / safeTotal) * width)), inj }))
    const lanes = assignLanes(arr.map((p) => p.x))
    return arr.map((p, i) => ({ ...p, lane: lanes[i] })) as Array<{ x: number; inj: InjectItem; lane: number }>
  }, [injects, width, safeTotal])

  const resourcePositions = useMemo(() => {
    if (width === 0) return [] as { x: number; r: ResourceItem }[]
    const arr = [...resources]
      .sort((a, b) => a.etaSeconds - b.etaSeconds)
      .map((r) => ({ x: Math.max(0, Math.min(width, (r.etaSeconds / safeTotal) * width)), r }))
    const lanes = assignLanes(arr.map((p) => p.x))
    return arr.map((p, i) => ({ ...p, lane: lanes[i] })) as Array<{ x: number; r: ResourceItem; lane: number }>
  }, [resources, width, safeTotal])

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2 text-xs text-gray-300">
        <span>0:00</span>
        <span>{formatHMS(Math.min(currentSeconds, safeTotal))}</span>
        <span>{formatHMS(safeTotal)}</span>
      </div>
      <div ref={containerRef} className="relative h-32 w-full select-none">
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-gray-700 rounded" />

        {/* Tick marks */}
        {width > 0 && ticks.map((t) => {
          const left = (t / safeTotal) * width
          return (
            <div key={t} className="absolute" style={{ left, bottom: 0 }}>
              <div className="absolute -translate-x-1/2 bottom-4 w-px h-4 bg-gray-500" />
              <div className="absolute -translate-x-1/2 bottom-0 text-[10px] text-gray-400 font-mono">
                {formatHMS(t)}
              </div>
            </div>
          )
        })}

        {/* Inject markers (above the track) with stacking lanes */}
        {width > 0 && injectPositions.map(({ x, inj, lane }) => {
          const Icon = (() => {
            switch (inj.type) {
              case 'in person': return User
              case 'radio/phone': return Phone
              case 'electronic': return Cpu
              case 'map inject': return MapPin
              default: return Tag
            }
          })()
          const topPx = Math.max(4, centerY - 16 - lane * laneStep)
          return (
            <div key={inj.id} className="absolute -translate-x-1/2" style={{ left: x, top: topPx }} title={`#${inj.number} ${inj.title} @ ${formatHMS(inj.dueSeconds)}`}>
              <Icon className={`h-4 w-4 ${typeColor[inj.type] || 'text-gray-400'} text-white rounded-full p-[2px]`} />
            </div>
          )
        })}

        {/* Resource markers (below the track) with stacking lanes */}
        {width > 0 && resourcePositions.map(({ x, r, lane }) => {
          const KindIcon = (() => {
            switch (r.kind) {
              case 'person': return User
              case 'vehicle': return Truck
              case 'group': return Users
              case 'air': return Plane
              case 'capability': return Cog
              case 'supply': return Package
              default: return Truck
            }
          })()
          const statusColor: Record<ResourceStatus, string> = {
            requested: 'text-gray-300',
            tasked: 'text-amber-400',
            enroute: 'text-blue-400',
            arrived: 'text-green-400',
            cancelled: 'text-red-400',
          }
          const topPx = Math.min(height - 12, centerY + 16 + lane * laneStep)
          return (
            <div key={r.id} className="absolute -translate-x-1/2" style={{ left: x, top: topPx }} title={`${r.label} (${r.kind || 'resource'}) ${r.status} ETA ${formatHMS(r.etaSeconds)}`}>
              <KindIcon className={`h-4 w-4 ${statusColor[r.status]}`} />
            </div>
          )
        })}

        {/* Current time cursor */}
        {width > 0 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-yellow-400"
            style={{ left: `${progress * 100}%` }}
            aria-label="Current time"
          />
        )}
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-300">
        <span className="inline-flex items-center gap-1"><User className="h-3 w-3 text-blue-400" /> Inject: In Person</span>
        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-green-400" /> Inject: Radio/Phone</span>
        <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3 text-purple-400" /> Inject: Electronic</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-red-400" /> Inject: Map</span>
        <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3 text-orange-400" /> Inject: Other</span>
        <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3 text-gray-300" /> Res: Requested</span>
        <span className="inline-flex items-center gap-1"><ClipboardCheck className="h-3 w-3 text-amber-400" /> Res: Tasked</span>
        <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3 text-blue-400" /> Res: Enroute</span>
        <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /> Res: Arrived</span>
        <span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400" /> Res: Cancelled</span>
      </div>
    </div>
  )
}

export default React.memo(Timeline)


