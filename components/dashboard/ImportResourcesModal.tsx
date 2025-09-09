"use client"

import React from 'react'
import type { ResourceItem } from '@/lib/types'

export type InvalidResourceRow = {
  rowNum: number
  label: string
  eta: string
  status?: string
  error: string
}

export type ImportResourcesModalProps = {
  open: boolean
  onClose: () => void
  isProcessing: boolean
  importMode: 'append' | 'replace'
  setImportMode: (mode: 'append' | 'replace') => void
  importFile: File | null
  onFileSelect: (file: File) => void
  onClearFile: () => void
  validationErrors: string[]
  invalidRows: InvalidResourceRow[]
  previewResources: ResourceItem[]
  onImport: () => void
  currentSeconds: number
}

const ImportResourcesModal: React.FC<ImportResourcesModalProps> = ({
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
  previewResources,
  onImport,
  currentSeconds,
}) => {
  if (!open) return null
  const canImport = validationErrors.length === 0 && previewResources.length > 0 && !isProcessing

  const ResourceFileDropZone = () => {
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFiles = Array.from(e.dataTransfer.files)
      const file = droppedFiles.find((f) => f.name.endsWith('.xlsx') || f.name.endsWith('.csv'))
      if (file) onFileSelect(file)
    }
    const handleDragOver = (e: React.DragEvent) => e.preventDefault()
    return (
      <div onDrop={handleDrop} onDragOver={handleDragOver} className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
          className="hidden"
          id="resourceFileInput"
        />
        <label htmlFor="resourceFileInput" className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded cursor-pointer transition-colors">
          Choose File
        </label>
        <p className="text-gray-400 text-sm mt-2">Supports .xlsx and .csv files</p>
        <p className="text-gray-400 text-xs mt-1">ETA can be minutes, HH:MM:SS from start, or seconds.</p>
      </div>
    )
  }

  const ResourceValidationList = () => {
    if (validationErrors.length === 0) return null
    return (
      <div className="mb-4">
        <h4 className="text-red-400 font-semibold mb-2">Validation Errors:</h4>
        <ul className="text-red-400 text-sm space-y-1">
          {validationErrors.map((error, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-red-500">-</span>
              <span>{error}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const ResourcePreviewTable = () => {
    if (previewResources.length === 0) return null
    return (
      <div className="mb-4">
        <h4 className="text-white font-semibold mb-2">Preview ({previewResources.length} resources):</h4>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-600 rounded" aria-label="Preview resources">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2 text-left text-white border-b border-gray-600">Label</th>
                <th className="p-2 text-left text-white border-b border-gray-600">ETA</th>
                <th className="p-2 text-left text-white border-b border-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {previewResources.slice(0, 10).map((resource, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="p-2 text-white">{resource.label}</td>
                  <td className="p-2 text-white">{Math.max(0, Math.round((resource.etaSeconds - currentSeconds) / 60))} min</td>
                  <td className="p-2">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-600 text-gray-100">{resource.status}</span>
                  </td>
                </tr>
              ))}
              {previewResources.length > 10 && (
                <tr>
                  <td colSpan={3} className="p-2 text-gray-400 text-center text-sm">
                    ... and {previewResources.length - 10} more resources
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ResourceInvalidRowsTable = () => {
    if (invalidRows.length === 0) return null
    const rows = invalidRows.slice(0, 50)
    return (
      <div className="mb-4">
        <h4 className="text-red-400 font-semibold mb-2">Invalid Rows ({invalidRows.length})</h4>
        <div className="overflow-x-auto">
          <table className="w-full border border-red-700 rounded" aria-label="Invalid resource rows">
            <thead>
              <tr className="bg-red-900 bg-opacity-40">
                <th className="p-2 text-left text-white">Row</th>
                <th className="p-2 text-left text-white">Label</th>
                <th className="p-2 text-left text-white">ETA</th>
                <th className="p-2 text-left text-white">Status</th>
                <th className="p-2 text-left text-white">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-red-800 bg-red-950 bg-opacity-20">
                  <td className="p-2 text-red-300 font-mono">{r.rowNum}</td>
                  <td className="p-2 text-red-300">{r.label || '-'}</td>
                  <td className="p-2 text-red-300">{r.eta || '-'}</td>
                  <td className="p-2 text-red-300 capitalize">{r.status || '-'}</td>
                  <td className="p-2 text-red-200">{r.error}</td>
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
            <h3 className="text-2xl font-bold text-white">Import Resources</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close import dialog">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!importFile ? (
            <ResourceFileDropZone />
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-white mb-2">
                  File: <span className="font-mono text-purple-400">{importFile.name}</span>
                </p>
                <button onClick={onClearFile} className="text-purple-400 hover:text-purple-300 text-sm underline">
                  Choose Different File
                </button>
              </div>
              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="text-white">Processing file...</div>
                </div>
              ) : (
                <div>
                  <ResourceValidationList />
                  <ResourcePreviewTable />
                  <ResourceInvalidRowsTable />
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
                  <input type="radio" name="resourceImportMode" value="append" checked={importMode === 'append'} onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')} className="mr-2" />
                  <span className="text-white">Append (add to existing)</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="resourceImportMode" value="replace" checked={importMode === 'replace'} onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')} className="mr-2" />
                  <span className="text-white">Replace (remove all existing)</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={onImport} disabled={!canImport} className={`px-6 py-2 rounded font-semibold transition-colors ${canImport ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                Import {previewResources.length} Resource{previewResources.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(ImportResourcesModal)

