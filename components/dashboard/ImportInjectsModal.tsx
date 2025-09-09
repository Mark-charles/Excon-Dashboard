"use client"

import React from 'react'
import type { InjectItem, InjectType } from '@/lib/types'
import { formatHMS } from '@/lib/time'

export type InvalidInjectRow = {
  rowNum: number
  title: string
  dueTime: string
  type: string
  to: string
  from: string
  error: string
}

export type ImportInjectsModalProps = {
  open: boolean
  onClose: () => void
  isProcessing: boolean
  importMode: 'append' | 'replace'
  setImportMode: (mode: 'append' | 'replace') => void
  importFile: File | null
  onFileSelect: (file: File) => void
  onClearFile: () => void
  validationErrors: string[]
  invalidRows: InvalidInjectRow[]
  previewInjects: InjectItem[]
  onImport: () => void
  onDownloadTemplate: () => void
  getInjectTypeColor: (type: InjectType) => string
}

const ImportInjectsModal: React.FC<ImportInjectsModalProps> = ({
  open,
  onClose,
  isProcessing,
  importMode,
  setImportMode,
  importFile,
  onFileSelect,
  onClearFile,
  validationErrors,
  invalidRows,
  previewInjects,
  onImport,
  onDownloadTemplate,
  getInjectTypeColor,
}) => {
  if (!open) return null

  const canImport = validationErrors.length === 0 && previewInjects.length > 0 && !isProcessing

  const FileDropZone = () => {
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFiles = Array.from(e.dataTransfer.files)
      const file = droppedFiles.find((f) => f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))
      if (file) onFileSelect(file)
    }
    const handleDragOver = (e: React.DragEvent) => e.preventDefault()
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label="Drop CSV or Excel file to import injects"
      >
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
          className="hidden"
          id="injectsFileInput"
        />
        <label htmlFor="injectsFileInput" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors">
          Choose File
        </label>
        <p className="text-white mb-2">Drag and drop a CSV or Excel file here, or click to browse</p>
        <p className="text-gray-400 text-sm mb-4">Accepts .csv, .xlsx, .xls files</p>
      </div>
    )
  }

  const ValidationList = () => {
    if (validationErrors.length === 0) return null
    const displayErrors = validationErrors.slice(0, 50)
    const remaining = validationErrors.length - displayErrors.length
    return (
      <div className="mt-4" aria-live="polite">
        <h4 className="text-lg font-semibold text-red-400 mb-3">Validation Errors ({validationErrors.length})</h4>
        <div className="max-h-32 overflow-y-auto bg-red-900 bg-opacity-20 border border-red-600 rounded p-3">
          {displayErrors.map((error, index) => (
            <div key={index} className="text-red-400 text-sm mb-1">{error}</div>
          ))}
          {remaining > 0 && <div className="text-red-300 text-xs mt-2">... and {remaining} more. Fix top issues first.</div>}
        </div>
      </div>
    )
  }

  const PreviewTable = () => {
    if (previewInjects.length === 0) return null
    const displayItems = previewInjects.slice(0, 50)
    return (
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-white mb-3">Preview ({previewInjects.length} valid rows)</h4>
        <div className="overflow-x-auto max-h-64 border border-gray-600 rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-white">#</th>
                <th className="px-3 py-2 text-left text-white">Title</th>
                <th className="px-3 py-2 text-left text-white">Due Time</th>
                <th className="px-3 py-2 text-left text-white">Type</th>
                <th className="px-3 py-2 text-left text-white">To</th>
                <th className="px-3 py-2 text-left text-white">From</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((inject, index) => (
                <tr key={index} className="border-t border-gray-600">
                  <td className="px-3 py-2 text-white font-semibold">#{inject.number}</td>
                  <td className="px-3 py-2 text-white">{inject.title}</td>
                  <td className="px-3 py-2 text-white font-mono">{formatHMS(inject.dueSeconds)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs capitalize ${getInjectTypeColor(inject.type)}`}>{inject.type}</span>
                  </td>
                  <td className="px-3 py-2 text-white">{inject.to || '-'}</td>
                  <td className="px-3 py-2 text-white">{inject.from || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {previewInjects.length > 50 && (
            <div className="p-2 text-center text-gray-400 text-xs border-t border-gray-600">... and {previewInjects.length - 50} more rows</div>
          )}
        </div>
      </div>
    )
  }

  const InvalidRowsTable = () => {
    if (invalidRows.length === 0) return null
    const rows = invalidRows.slice(0, 50)
    return (
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-red-400 mb-3">Invalid Rows ({invalidRows.length})</h4>
        <div className="overflow-x-auto max-h-64 border border-red-600 rounded">
          <table className="w-full text-sm" aria-label="Invalid inject rows">
            <thead className="bg-red-900 bg-opacity-40 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-white">Row</th>
                <th className="px-3 py-2 text-left text-white">Title</th>
                <th className="px-3 py-2 text-left text-white">Due Time</th>
                <th className="px-3 py-2 text-left text-white">Type</th>
                <th className="px-3 py-2 text-left text-white">To</th>
                <th className="px-3 py-2 text-left text-white">From</th>
                <th className="px-3 py-2 text-left text-white">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-red-800 bg-red-950 bg-opacity-20">
                  <td className="px-3 py-2 text-red-300 font-mono">{r.rowNum}</td>
                  <td className="px-3 py-2 text-red-300">{r.title || '-'}</td>
                  <td className="px-3 py-2 text-red-300 font-mono">{r.dueTime || '-'}</td>
                  <td className="px-3 py-2 text-red-300">{r.type || '-'}</td>
                  <td className="px-3 py-2 text-red-300">{r.to || '-'}</td>
                  <td className="px-3 py-2 text-red-300">{r.from || '-'}</td>
                  <td className="px-3 py-2 text-red-200">{r.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-600">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white">Import Injects</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close import dialog">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2">
            <button onClick={onDownloadTemplate} className="text-blue-400 hover:text-blue-300 text-sm underline">
              Download Template
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!importFile ? (
            <FileDropZone />
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-white mb-2">
                  File: <span className="font-mono text-blue-400">{importFile.name}</span>
                </p>
                <button onClick={onClearFile} className="text-blue-400 hover:text-blue-300 text-sm underline">
                  Choose Different File
                </button>
              </div>
              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="text-white">Processing file...</div>
                </div>
              ) : (
                <div>
                  <ValidationList />
                  <PreviewTable />
                  <InvalidRowsTable />
                </div>
              )}
            </div>
          )}
        </div>
        {importFile && !isProcessing && (
          <div className="p-6 border-t border-gray-600">
            <div className="mb-4">
              <label className="text-white block mb-2">Import Mode:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name="importMode" value="append" checked={importMode === 'append'} onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')} className="mr-2" />
                  <span className="text-white">Append (add to existing)</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="importMode" value="replace" checked={importMode === 'replace'} onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')} className="mr-2" />
                  <span className="text-white">Replace (remove all existing)</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={onImport} disabled={!canImport} className={`px-6 py-2 rounded font-semibold transition-colors ${canImport ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                Import {previewInjects.length} Inject{previewInjects.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(ImportInjectsModal)

