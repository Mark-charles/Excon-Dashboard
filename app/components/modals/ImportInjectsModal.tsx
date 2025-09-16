'use client'

import React, { useState } from 'react'
import type { InjectItem } from '../shared/types'
import { formatHMS } from '../../utils/timeUtils'
import { downloadInjectsTemplate, processInjectsFile } from '../../utils/importExportUtils'

interface ImportInjectsModalProps {
  isOpen: boolean
  existingInjects: InjectItem[]
  onClose: () => void
  onImport: (injects: InjectItem[], mode: 'append' | 'replace') => void
}

interface FileDropZoneProps {
  onFileSelect: (file: File) => void
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileSelect }) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const file = files.find(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.docx'))
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
      className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
    >
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-white mb-2">Drag and drop a CSV, Excel, or Word (.docx) file here, or click to browse</p>
      <p className="text-gray-400 text-sm mb-4">Accepts .csv, .xlsx, .xls, .docx files</p>
      <input
        type="file"
        accept=".csv,.xlsx,.xls,.docx"
        onChange={handleFileInput}
        className="hidden"
        id="file-input-injects"
      />
      <label
        htmlFor="file-input-injects"
        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors"
      >
        Choose File
      </label>
    </div>
  )
}

interface ValidationListProps {
  errors: string[]
}

const ValidationList: React.FC<ValidationListProps> = ({ errors }) => {
  if (errors.length === 0) return null

  const actualErrors = errors.filter(e => !e.startsWith('WARNING:') && !e.startsWith('---'))
  const warnings = errors.filter(e => e.startsWith('WARNING:'))

  const renderIcon = (color: string) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l10 19H2l10-19z" fill={color} />
    </svg>
  )

  return (
    <div className="mt-4 space-y-4">
      {actualErrors.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            Validation Errors ({actualErrors.length})
          </h4>
          <div className="max-h-32 overflow-y-auto bg-red-900/20 border border-red-600/50 rounded-lg p-3">
            {actualErrors.map((error, index) => (
              <div key={index} className="text-red-400 text-sm mb-1 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">{renderIcon('#f87171')}</span>
                <span>{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            MSE Quality Warnings ({warnings.length})
          </h4>
          <div className="max-h-32 overflow-y-auto bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
            <div className="text-yellow-300 text-xs mb-2 italic">Warnings do not block import but may indicate data quality issues.</div>
            {warnings.map((warning, index) => (
              <div key={index} className="text-yellow-400 text-sm mb-1 flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">{renderIcon('#facc15')}</span>
                <span>{warning.replace('WARNING: ', '')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface PreviewTableProps {
  injects: InjectItem[]
}

const PreviewTable: React.FC<PreviewTableProps> = ({ injects }) => {
  if (injects.length === 0) return null

  const previewRows = injects.slice(0, 20)

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-white mb-3">MSE Preview ({injects.length} valid injects)</h4>
      <div className="overflow-x-auto max-h-96 border border-gray-600 rounded-lg shadow-xl">
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-blue-900/80 uppercase tracking-wide text-xs text-blue-100">
            <tr>
              <th className="px-3 py-2 text-center">Inject #</th>
              <th className="px-3 py-2 text-center">Elapsed</th>
              <th className="px-3 py-2 text-left">Inject</th>
              <th className="px-3 py-2 text-center">From</th>
              <th className="px-3 py-2 text-center">To</th>
              <th className="px-3 py-2 text-center">Type</th>
              <th className="px-3 py-2 text-left">Notes / Actions</th>
              <th className="px-3 py-2 text-center">Resources</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/80 divide-y divide-gray-700">
            {previewRows.map((inject, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-slate-900/60' : 'bg-gray-900/40'}>
                <td className="px-3 py-2 text-center text-blue-300 font-semibold">#{inject.number}</td>
                <td className="px-3 py-2 text-center font-mono text-emerald-300">{formatHMS(inject.dueSeconds)}</td>
                <td className="px-3 py-2 text-left text-white">{inject.title}</td>
                <td className="px-3 py-2 text-center">{inject.from || 'ExCon'}</td>
                <td className="px-3 py-2 text-center">{inject.to || 'All Units'}</td>
                <td className="px-3 py-2 text-center">{inject.type}</td>
                <td className="px-3 py-2 text-left">{inject.notes || '-'}</td>
                <td className="px-3 py-2 text-center text-emerald-300">{inject.resources || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {injects.length > 20 && (
          <div className="p-3 text-center text-gray-400 text-xs border-t border-gray-600 bg-gray-800/60">
            Showing first 20 of {injects.length} injects
          </div>
        )}
      </div>
    </div>
  )
}

const ImportInjectsModal: React.FC<ImportInjectsModalProps> = ({
  isOpen,
  existingInjects,
  onClose,
  onImport
}) => {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [previewInjects, setPreviewInjects] = useState<InjectItem[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleFileSelect = async (file: File) => {
    setImportFile(file)
    setIsProcessing(true)
    setValidationErrors([])
    
    const result = await processInjectsFile(file, existingInjects)
    setPreviewInjects(result.validInjects)
    setValidationErrors(result.errors)
    setIsProcessing(false)
  }

  const hasActualErrors = validationErrors.some(e => !e.startsWith('WARNING:') && !e.startsWith('---'))
  const canImport = !hasActualErrors && previewInjects.length > 0 && !isProcessing

  const handleImport = () => {
    if (hasActualErrors || previewInjects.length === 0) return
    
    onImport(previewInjects, importMode)
    handleClose()
  }

  const handleClose = () => {
    setImportFile(null)
    setPreviewInjects([])
    setValidationErrors([])
    setImportMode('append')
    setIsProcessing(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="import-injects-title">
        <div className="p-6 border-b border-gray-600">
          <div className="flex justify-between items-center">
            <h3 id="import-injects-title" className="text-2xl font-bold text-white">Import Injects</h3>
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
              onClick={downloadInjectsTemplate}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Download Template
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!importFile ? (
            <FileDropZone onFileSelect={handleFileSelect} />
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-white mb-2">File: <span className="font-mono text-blue-400">{importFile.name}</span></p>
                <button
                  onClick={() => {
                    setImportFile(null)
                    setPreviewInjects([])
                    setValidationErrors([])
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
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
                  <ValidationList errors={validationErrors} />
                  <PreviewTable injects={previewInjects} />
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
                    name="importMode"
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
                    name="importMode"
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
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Import {previewInjects.length} Inject{previewInjects.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportInjectsModal

