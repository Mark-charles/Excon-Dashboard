"use client"

import { useState } from 'react'
import * as XLSX from 'xlsx'
import type { InjectItem } from '@/lib/types'
import { normalizeHeader } from '@/lib/csv'
import { parseHMS } from '@/lib/time'
import { mapInjectType, generateId, renumberInjects } from '@/lib/helpers'

export function useInjectsImport(params: {
  currentSeconds: number
  injects: InjectItem[]
  setInjects: (next: InjectItem[] | ((prev: InjectItem[]) => InjectItem[])) => void
}) {
  const { currentSeconds, injects, setInjects } = params

  const [open, setOpen] = useState(false)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewInjects, setPreviewInjects] = useState<InjectItem[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [invalidInjectRows, setInvalidInjectRows] = useState<{
    rowNum: number; title: string; dueTime: string; type: string; to: string; from: string; error: string
  }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const onFileSelect = async (file: File) => {
    setImportFile(file)
    setIsProcessing(true)
    setValidationErrors([])
    setInvalidInjectRows([])
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

      const titleIdx = normalizedHeaders.findIndex(h => h.includes('title') || h.includes('name') || h.includes('description'))
      const dueTimeIdx = normalizedHeaders.findIndex(h => h.includes('duetime') || h.includes('time') || h.includes('due') || h.includes('second') || h.includes('sec'))
      const typeIdx = normalizedHeaders.findIndex(h => h.includes('type') || h.includes('category'))
      const toIdx = normalizedHeaders.findIndex(h => h.includes('to') || h.includes('recipient'))
      const fromIdx = normalizedHeaders.findIndex(h => h.includes('from') || h.includes('sender'))
      if (titleIdx === -1 || dueTimeIdx === -1) {
        setValidationErrors(['Required columns not found. Please ensure you have Title and DueTime columns.'])
        setIsProcessing(false)
        return
      }
      const errors: string[] = []
      const invalidRows: {rowNum:number, title:string, dueTime:string, type:string, to:string, from:string, error:string}[] = []
      const validInjects = [] as InjectItem[]
      (dataRows as unknown[][]).forEach((row: unknown[], rowIndex: number) => {
        const rowNum = rowIndex + 2
        const title = ('' + (row[titleIdx] ?? '')).trim()
        const dueTimeStr = ('' + (row[dueTimeIdx] ?? '')).trim()
        const typeStr = ('' + (row[typeIdx] ?? 'other')).trim()
        const toStr = ('' + (row[toIdx] ?? '')).trim()
        const fromStr = ('' + (row[fromIdx] ?? '')).trim()
        if (!title) {
          const msg = `Row ${rowNum}: Title is required`
          errors.push(msg)
          invalidRows.push({ rowNum, title, dueTime: dueTimeStr, type: typeStr, to: toStr, from: fromStr, error: msg })
          return
        }
        let dueSeconds: number | null = null
        if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(dueTimeStr)) {
          dueSeconds = parseHMS(dueTimeStr)
        } else {
          const num = Number(dueTimeStr)
          if (!isNaN(num) && num >= 0) {
            dueSeconds = num > 360 ? Math.floor(num) : currentSeconds + Math.round(num * 60)
          }
        }
        if (dueSeconds === null) {
          const msg = `Row ${rowNum}: Invalid time "${dueTimeStr}". Use minutes (e.g., 15), HH:MM:SS (e.g., 01:30:00), or seconds.`
          errors.push(msg)
          invalidRows.push({ rowNum, title, dueTime: dueTimeStr, type: typeStr, to: toStr, from: fromStr, error: msg })
          return
        }
        const type = mapInjectType(typeStr)
        validInjects.push({
          id: generateId(),
          number: injects.length + validInjects.length + 1,
          title,
          dueSeconds,
          type,
          status: 'pending',
          to: toStr,
          from: fromStr,
        })
      })
      setPreviewInjects(validInjects)
      setValidationErrors(errors)
      setInvalidInjectRows(invalidRows)
    } catch {
      setValidationErrors(['Error reading file. Please ensure it is a valid CSV or Excel file.'])
    }
    setIsProcessing(false)
  }

  const clearFile = () => {
    setImportFile(null)
    setPreviewInjects([])
    setValidationErrors([])
    setInvalidInjectRows([])
  }

  const commitImport = () => {
    if (validationErrors.length > 0 || previewInjects.length === 0) return
    if (importMode === 'replace') {
      setInjects(renumberInjects(previewInjects))
    } else {
      const existingKeys = new Set(injects.map(i => `${i.title}:${i.dueSeconds}`))
      const newInjects = previewInjects.filter(inject => !existingKeys.has(`${inject.title}:${inject.dueSeconds}`))
      setInjects(prev => renumberInjects([...(prev as InjectItem[]), ...newInjects]))
      const duplicateCount = previewInjects.length - newInjects.length
      // eslint-disable-next-line no-console
      console.log(`Imported ${newInjects.length} inject(s). Skipped ${validationErrors.length} invalid and ${duplicateCount} duplicate row(s).`)
    }
    setOpen(false)
    clearFile()
    setImportMode('append')
  }

  const downloadTemplate = () => {
    const templateData = [
      ['Title', 'Due (minutes)', 'Type', 'To', 'From'],
      ['Fire reported at Location A', '10', 'radio/phone', 'Fire Chief', 'Control'],
      ['Evacuation request from Site B', '25', 'in person', 'Site Manager', 'Emergency Team'],
      ['Media inquiry about incident', '40', 'electronic', 'Media Liaison', 'Dispatch'],
      ['Update incident map display', '50', 'map inject', 'GIS Coordinator', 'Operations'],
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Injects Template')
    XLSX.writeFile(workbook, 'injects_template.csv', { bookType: 'csv' })
  }

  return {
    open, setOpen,
    importMode, setImportMode,
    importFile,
    onFileSelect,
    clearFile,
    isProcessing,
    validationErrors,
    invalidInjectRows,
    previewInjects,
    commitImport,
    downloadTemplate,
  }
}

