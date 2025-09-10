"use client"

import { useState } from 'react'
import * as XLSX from 'xlsx'
import type { ResourceItem, ResourceKind, ResourceStatus } from '@/lib/types'
import { normalizeHeader } from '@/lib/csv'
import { parseHMS } from '@/lib/time'
import { generateId } from '@/lib/helpers'

export function useResourcesImport(params: {
  currentSeconds: number
  resources: ResourceItem[]
  setResources: (next: ResourceItem[] | ((prev: ResourceItem[]) => ResourceItem[])) => void
}) {
  const { currentSeconds, resources, setResources } = params

  const [open, setOpen] = useState(false)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewResources, setPreviewResources] = useState<ResourceItem[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [invalidResourceRows, setInvalidResourceRows] = useState<{ rowNum:number, label:string, eta:string, status?:string, error:string }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const onFileSelect = async (file: File) => {
    setImportFile(file)
    setIsProcessing(true)
    setValidationErrors([])
    setInvalidResourceRows([])
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
      if (jsonData.length < 2) {
        setValidationErrors(['File must contain at least one header row and one data row'])
        setIsProcessing(false)
        return
      }
      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)
      const normalizedHeaders = headers.map(h => normalizeHeader(String(h)))

      const labelIdx = normalizedHeaders.findIndex(h => h.includes('label') || h.includes('name') || h.includes('resource'))
      const etaIdx = normalizedHeaders.findIndex(h => h.includes('eta') || h.includes('minutes') || h.includes('time') || h.includes('second') || h.includes('sec'))
      const statusIdx = normalizedHeaders.findIndex(h => h.includes('status'))
      const kindIdx = normalizedHeaders.findIndex(h => h.includes('kind') || h.includes('type') || h.includes('category'))
      if (labelIdx === -1 || etaIdx === -1) {
        setValidationErrors(['Required columns not found. Please ensure you have Label and ETA columns.'])
        setIsProcessing(false)
        return
      }
      const errors: string[] = []
      const invalidRows: { rowNum:number, label:string, eta:string, status?:string, error:string }[] = []
      const validResources = [] as ResourceItem[]
      ;(dataRows as unknown[][]).forEach((row: unknown[], rowIndex) => {
        const rowNum = rowIndex + 2
        const label = String(row[labelIdx] || '').trim()
        const etaStr = String(row[etaIdx] || '').trim()
        const statusStr = String(row[statusIdx] || 'requested').trim().toLowerCase()
        const kindStr = kindIdx !== -1 ? String(row[kindIdx] || '').trim() : ''
        if (!label) {
          const msg = `Row ${rowNum}: Label is required`
          errors.push(msg)
          invalidRows.push({ rowNum, label, eta: etaStr, status: statusStr, error: msg })
          return
        }
        let etaSecondsAbs: number | null = null
        if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(etaStr)) {
          etaSecondsAbs = parseHMS(etaStr)
        } else {
          const etaHeader = normalizedHeaders[etaIdx] || ''
          const num = Number(etaStr)
          if (!isNaN(num) && num >= 0) {
            if (etaHeader.includes('second') || etaHeader.includes('sec')) {
              etaSecondsAbs = Math.floor(num)
            } else {
              etaSecondsAbs = currentSeconds + Math.round(num * 60)
            }
          }
        }
        if (etaSecondsAbs === null) {
          const msg = `Row ${rowNum}: Invalid ETA "${etaStr}". Use minutes (e.g., 15), HH:MM:SS (e.g., 01:30:00), or seconds.`
          errors.push(msg)
          invalidRows.push({ rowNum, label, eta: etaStr, status: statusStr, error: msg })
          return
        }
        let status: ResourceStatus = 'requested'
        if (['requested', 'tasked', 'enroute', 'arrived', 'cancelled'].includes(statusStr)) {
          status = statusStr as ResourceStatus
        }
        let kind: ResourceKind | undefined
        const kNorm = kindStr.toLowerCase()
        if (['person','vehicle','group','air','capability','supply'].includes(kNorm)) {
          kind = kNorm as ResourceKind
        } else {
          const lower = label.toLowerCase()
          if (/(officer|chief|president|planner|liaison)/.test(lower)) kind = 'person'
          else if (/(task\s*force|strike\s*team|group)/.test(lower)) kind = 'group'
          else if (/(heli|air|plane|chopper)/.test(lower)) kind = 'air'
          else if (/(drone|uav|robot|capability)/.test(lower)) kind = 'capability'
          else if (/(food|catering|water|suppl|meals|rations|feed)/.test(lower)) kind = 'supply'
          else kind = 'vehicle'
        }
        validResources.push({ id: generateId(), label, etaSeconds: etaSecondsAbs, status, kind, createdAtSeconds: currentSeconds })
      })
      setPreviewResources(validResources)
      setValidationErrors(errors)
      setInvalidResourceRows(invalidRows)
    } catch {
      setValidationErrors(['Error reading file. Please ensure it is a valid CSV or Excel file.'])
    }
    setIsProcessing(false)
  }

  const clearFile = () => {
    setImportFile(null)
    setPreviewResources([])
    setValidationErrors([])
    setInvalidResourceRows([])
  }

  const commitImport = () => {
    if (validationErrors.length > 0 || previewResources.length === 0) return
    if (importMode === 'replace') {
      setResources(previewResources)
    } else {
      const existingKeys = new Set(resources.map(r => `${r.label}:${r.etaSeconds}`))
      const newResources = previewResources.filter(resource => !existingKeys.has(`${resource.label}:${resource.etaSeconds}`))
      setResources(prev => ([...(prev as ResourceItem[]), ...newResources]))
      const duplicateCount = previewResources.length - newResources.length
      console.log(`Imported ${newResources.length} resource(s). Skipped ${validationErrors.length} invalid and ${duplicateCount} duplicate row(s).`)
    }
    setOpen(false)
    clearFile()
    setImportMode('append')
  }

  return {
    open, setOpen,
    importMode, setImportMode,
    importFile,
    onFileSelect,
    clearFile,
    isProcessing,
    validationErrors,
    invalidResourceRows,
    previewResources,
    commitImport,
  }
}

