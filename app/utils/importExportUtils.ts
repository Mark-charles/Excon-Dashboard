import * as XLSX from 'xlsx'
import type { InjectItem, ResourceItem } from '../components/shared/types'
import { parseHMS } from './timeUtils'
import { generateId, normalizeHeader, mapInjectType } from './validation'

export const downloadInjectsTemplate = (): void => {
  const templateData = [
    ['Title', 'DueTime', 'Type', 'To', 'From'],
    ['Fire reported at Location A', '00:10:00', 'radio/phone', 'Fire Chief', 'Control'],
    ['Evacuation request from Site B', '00:25:00', 'in person', 'Site Manager', 'Emergency Team'],
    ['Media inquiry about incident', '00:40:00', 'electronic', 'Media Liaison', 'Dispatch'],
    ['Update incident map display', '00:50:00', 'map inject', 'GIS Coordinator', 'Operations']
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Injects Template')
  XLSX.writeFile(workbook, 'injects_template.csv')
}

export const downloadResourcesTemplate = (): void => {
  const templateData = [
    ['Label', 'ETA (minutes)', 'Status'],
    ['Fire Engine 1', '15', 'requested'],
    ['Ambulance 2', '20', 'requested'],
    ['Police Unit 3', '10', 'requested'],
    ['Command Unit', '5', 'requested']
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resources Template')
  XLSX.writeFile(workbook, 'resources_template.csv')
}

export interface InjectImportResult {
  validInjects: InjectItem[]
  errors: string[]
}

export const processInjectsFile = async (file: File, existingInjects: InjectItem[]): Promise<InjectImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
    
    if (jsonData.length < 2) {
      return {
        validInjects: [],
        errors: ['File must contain at least one header row and one data row']
      }
    }
    
    const headers = jsonData[0] as string[]
    const dataRows = jsonData.slice(1)
    
    // Normalize headers for matching
    const normalizedHeaders = headers.map(h => normalizeHeader(String(h)))
    
    // Find column indices
    const titleIdx = normalizedHeaders.findIndex(h => 
      h.includes('title') || h.includes('name') || h.includes('description')
    )
    const dueTimeIdx = normalizedHeaders.findIndex(h => 
      h.includes('duetime') || h.includes('time') || h.includes('due')
    )
    const typeIdx = normalizedHeaders.findIndex(h => 
      h.includes('type') || h.includes('category')
    )
    const toIdx = normalizedHeaders.findIndex(h => 
      h.includes('to') || h.includes('recipient')
    )
    const fromIdx = normalizedHeaders.findIndex(h => 
      h.includes('from') || h.includes('sender')
    )
    
    if (titleIdx === -1 || dueTimeIdx === -1) {
      return {
        validInjects: [],
        errors: ['Required columns not found. Please ensure you have Title and DueTime columns.']
      }
    }
    
    // Process rows and validate
    const errors: string[] = []
    const validInjects = [] as InjectItem[]
    
    (dataRows as unknown[][]).forEach((row: unknown[], rowIndex) => {
      const rowNum = rowIndex + 2 // +2 because we start from row 1 and skip header
      
      const title = String(row[titleIdx] || '').trim()
      const dueTimeStr = String(row[dueTimeIdx] || '').trim()
      const typeStr = String(row[typeIdx] || 'other').trim()
      const toStr = String(row[toIdx] || '').trim()
      const fromStr = String(row[fromIdx] || '').trim()
      
      // Validate title
      if (!title) {
        errors.push(`Row ${rowNum}: Title is required`)
        return
      }
      
      // Validate and parse due time
      const dueSeconds = parseHMS(dueTimeStr)
      if (dueSeconds === null) {
        errors.push(`Row ${rowNum}: Invalid time format "${dueTimeStr}". Use HH:MM:SS format.`)
        return
      }
      
      // Parse type
      const type = mapInjectType(typeStr)
      
      validInjects.push({
        id: generateId(),
        number: existingInjects.length + validInjects.length + 1,
        title,
        dueSeconds,
        type,
        status: 'pending',
        to: toStr,
        from: fromStr
      })
    })
    
    return { validInjects, errors }
    
  } catch {
    return {
      validInjects: [],
      errors: ['Error reading file. Please ensure it is a valid CSV or Excel file.']
    }
  }
}

export interface ResourceImportResult {
  validResources: ResourceItem[]
  errors: string[]
}

export const processResourcesFile = async (file: File, currentSeconds: number): Promise<ResourceImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
    
    if (jsonData.length < 2) {
      return {
        validResources: [],
        errors: ['File must contain at least one header row and one data row']
      }
    }
    
    const headers = jsonData[0] as string[]
    const dataRows = jsonData.slice(1)
    
    // Normalize headers for matching
    const normalizedHeaders = headers.map(h => normalizeHeader(String(h)))
    
    // Find column indices
    const labelIdx = normalizedHeaders.findIndex(h => 
      h.includes('label') || h.includes('name') || h.includes('resource')
    )
    const etaIdx = normalizedHeaders.findIndex(h => 
      h.includes('eta') || h.includes('minutes') || h.includes('time')
    )
    const statusIdx = normalizedHeaders.findIndex(h => 
      h.includes('status')
    )
    
    if (labelIdx === -1 || etaIdx === -1) {
      return {
        validResources: [],
        errors: ['Required columns not found. Please ensure you have Label and ETA columns.']
      }
    }
    
    // Process rows and validate
    const errors: string[] = []
    const validResources = [] as ResourceItem[]
    
    (dataRows as unknown[][]).forEach((row: unknown[], rowIndex) => {
      const rowNum = rowIndex + 2 // +2 because we start from row 1 and skip header
      
      const label = String(row[labelIdx] || '').trim()
      const etaStr = String(row[etaIdx] || '').trim()
      const statusStr = String(row[statusIdx] || 'requested').trim().toLowerCase()
      
      // Validate label
      if (!label) {
        errors.push(`Row ${rowNum}: Label is required`)
        return
      }
      
      // Validate and parse ETA
      const etaMinutes = parseInt(etaStr, 10)
      if (isNaN(etaMinutes) || etaMinutes < 0) {
        errors.push(`Row ${rowNum}: Invalid ETA "${etaStr}". Must be a positive number of minutes.`)
        return
      }
      
      // Parse status
      let status: ResourceItem['status'] = 'requested'
      if (['requested', 'tasked', 'enroute', 'arrived', 'cancelled'].includes(statusStr)) {
        status = statusStr as ResourceItem['status']
      }
      
      validResources.push({
        id: generateId(),
        label,
        etaSeconds: currentSeconds + (etaMinutes * 60),
        status
      })
    })
    
    return { validResources, errors }
    
  } catch {
    return {
      validResources: [],
      errors: ['Error reading file. Please ensure it is a valid CSV or Excel file.']
    }
  }
}