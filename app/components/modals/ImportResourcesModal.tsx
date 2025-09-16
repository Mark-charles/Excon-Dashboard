'use client'

import React, { useState } from 'react'
import type { ResourceItem } from '../shared/types'
import { formatHMS } from '../../utils/timeUtils'
import { getResourceStatusColor } from '../../utils/styleUtils'
import { downloadResourcesTemplate, processResourcesFile } from '../../utils/importExportUtils'

interface ImportResourcesModalProps {
  isOpen: boolean
  currentSeconds: number
  onClose: () => void
  onImport: (resources: ResourceItem[], mode: 'append' | 'replace') => void
}

interface ResourceFileDropZoneProps {
  onFileSelect: (file: File) => void
}

const ResourceFileDropZone: React.FC<ResourceFileDropZoneProps> = ({ onFileSelect }) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const file = files.find(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))
    if (file) {
      onFileSelect(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
    >
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-white mb-2">Drag and drop a CSV or Excel file here, or click to browse</p>
      <p className="text-gray-400 text-sm mb-4">Accepts .csv, .xlsx, .xls files</p>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileInput}
        className="hidden"
        id="file-input-resources"
      />
      <label
        htmlFor="file-input-resources"
        className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded cursor-pointer transition-colors"
      >
        Choose File
      </label>
    </div>
  )
}

interface ResourceValidationListProps {
  errors: string[]
}

const ResourceValidationList: React.FC<ResourceValidationListProps> = ({ errors }) => {
  if (errors.length === 0) return null

  return (
    <div className="mt-4">
      <h4 className="text-lg font-semibold text-red-400 mb-3">Validation Errors ({errors.length})</h4>
      <div className="max-h-32 overflow-y-auto bg-red-900 bg-opacity-20 border border-red-600 rounded p-3">
        {errors.map((error, index) => (
          <div key={index} className="text-red-400 text-sm mb-1">{error}</div>
        ))}
      </div>
    </div>
  )
}

interface ResourcePreviewTableProps {
  resources: ResourceItem[]
}

const ResourcePreviewTable: React.FC<ResourcePreviewTableProps> = ({ resources }) => {
  if (resources.length === 0) return null

  const displayItems = resources.slice(0, 50) // Show first 50 rows max

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-white mb-3">Preview ({resources.length} valid rows)</h4>
      <div className="overflow-x-auto max-h-64 border border-gray-600 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-white">Label</th>
              <th className="px-3 py-2 text-left text-white">ETA</th>
              <th className="px-3 py-2 text-left text-white">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((resource, index) => (
              <tr key={index} className="border-t border-gray-600">
                <td className="px-3 py-2 text-white">{resource.label}</td>
                <td className="px-3 py-2 text-white font-mono">{formatHMS(resource.etaSeconds)}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded text-xs capitalize ${getResourceStatusColor(resource.status)}`}>
                    {resource.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length > 50 && (
          <div className="p-2 text-center text-gray-400 text-xs border-t border-gray-600">
            ... and {resources.length - 50} more rows
          </div>
        )}
      </div>
    </div>
  )
}

const ImportResourcesModal: React.FC<ImportResourcesModalProps> = ({
  isOpen,
  currentSeconds,
  onClose,
  onImport
}) => {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [previewResources, setPreviewResources] = useState<ResourceItem[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleFileSelect = async (file: File) => {
    setImportFile(file)
    setIsProcessing(true)
    setValidationErrors([])
    
    const result = await processResourcesFile(file, currentSeconds)
    setPreviewResources(result.validResources)
    setValidationErrors(result.errors)
    setIsProcessing(false)
  }

  const handleImport = () => {
    if (validationErrors.length > 0 || previewResources.length === 0) return
    
    onImport(previewResources, importMode)
    handleClose()
  }

  const handleClose = () => {
    setImportFile(null)
    setPreviewResources([])
    setValidationErrors([])
    setImportMode('append')
    setIsProcessing(false)
    onClose()
  }

  const canImport = validationErrors.length === 0 && previewResources.length > 0 && !isProcessing

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="import-resources-title">
        <div className="p-6 border-b border-gray-600">
          <div className="flex justify-between items-center">
            <h3 id="import-resources-title" className="text-2xl font-bold text-white">Import Resources</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2">
            <button
              onClick={downloadResourcesTemplate}
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Download Template
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!importFile ? (
            <ResourceFileDropZone onFileSelect={handleFileSelect} />
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-white mb-2">File: <span className="font-mono text-purple-400">{importFile.name}</span></p>
                <button
                  onClick={() => {
                    setImportFile(null)
                    setPreviewResources([])
                    setValidationErrors([])
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm underline"
                >
                  Choose Different File
                </button>
              </div>

              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="text-white">Processing file...</div>
                </div>
              ) : (
                <div>
                  <ResourceValidationList errors={validationErrors} />
                  <ResourcePreviewTable resources={previewResources} />
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
                  <input
                    type="radio"
                    name="resourceImportMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                    className="mr-2"
                  />
                  <span className="text-white">Append (add to existing)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resourceImportMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                    className="mr-2"
                  />
                  <span className="text-white">Replace (remove all existing)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!canImport}
                className={`px-6 py-2 rounded font-semibold transition-colors ${
                  canImport
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Import {previewResources.length} Resource{previewResources.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportResourcesModal
