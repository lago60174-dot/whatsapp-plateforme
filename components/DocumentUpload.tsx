'use client'

import { useState, useRef } from 'react'
import type { Document } from '@/types'

type DocumentUploadProps = {
  companyId: string
  documents: Document[]
  onUpload: (doc: Document) => void
}

export default function DocumentUpload({ companyId, documents, onUpload }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.pdf')) {
      setError('Seuls les fichiers PDF sont acceptés')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10 Mo)')
      return
    }

    setUploading(true)
    setError('')
    setProgress('Envoi du fichier...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      setProgress('Extraction du texte...')
      const res = await fetch(`/api/companies/${companyId}/documents`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors du traitement')
        return
      }

      setProgress(`✓ ${data.chunksCreated} fragments indexés`)
      onUpload(data.document)

      setTimeout(() => setProgress(''), 3000)
    } catch {
      setError('Erreur réseau. Réessaie.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
  }

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${uploading ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />

        {uploading ? (
          <div>
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-green-700 font-medium">{progress}</p>
            <p className="text-xs text-gray-400 mt-1">Ne ferme pas cette page...</p>
          </div>
        ) : (
          <div>
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-700">Glisse un PDF ici</p>
            <p className="text-xs text-gray-400 mt-1">ou clique pour sélectionner · Max 10 Mo</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Liste des documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Documents indexés ({documents.length})
          </p>
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{doc.file_name}</p>
                <p className="text-xs text-gray-400">
                  {formatSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className="badge-active text-xs">Indexé</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
