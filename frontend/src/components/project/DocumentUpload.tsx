'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Upload, 
  FileText,
  Link,
  Image,
  File,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface DocumentUploadProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (document: {
    name: string
    type: 'pdf' | 'doc' | 'link' | 'image'
    size?: string
    url?: string
    description?: string
  }) => void
}

export function DocumentUpload({ isOpen, onClose, onUpload }: DocumentUploadProps) {
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  if (!isOpen) return null

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const getFileType = (file: File): 'pdf' | 'doc' | 'image' => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return 'image'
    return 'doc'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    setIsUploading(true)
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (uploadType === 'file' && selectedFile) {
      onUpload({
        name: selectedFile.name,
        type: getFileType(selectedFile),
        size: formatFileSize(selectedFile.size),
        description: description || undefined
      })
    } else if (uploadType === 'link' && linkUrl) {
      onUpload({
        name: linkTitle || linkUrl,
        type: 'link',
        url: linkUrl,
        description: description || undefined
      })
    }

    setIsUploading(false)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setSelectedFile(null)
    setLinkUrl('')
    setLinkTitle('')
    setDescription('')
    setUploadType('file')
  }

  const isValid = () => {
    if (uploadType === 'file') return selectedFile !== null
    if (uploadType === 'link') return linkUrl.trim() !== ''
    return false
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-dark-800 border-dark-600">
        <CardHeader className="border-b border-dark-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">
              Upload Document
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Upload Type Selector */}
          <div className="flex space-x-2 bg-dark-700 p-1 rounded-lg">
            <button
              onClick={() => setUploadType('file')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                uploadType === 'file'
                  ? 'bg-redpill-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
            <button
              onClick={() => setUploadType('link')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                uploadType === 'link'
                  ? 'bg-redpill-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }`}
            >
              <Link className="w-4 h-4" />
              <span>Add Link</span>
            </button>
          </div>

          {/* File Upload */}
          {uploadType === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      {selectedFile.type.includes('pdf') && <FileText className="w-12 h-12 text-red-400" />}
                      {selectedFile.type.includes('image') && <Image className="w-12 h-12 text-purple-400" />}
                      {!selectedFile.type.includes('pdf') && !selectedFile.type.includes('image') && <File className="w-12 h-12 text-blue-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{selectedFile.name}</p>
                      <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-white font-medium mb-2">Choose a file to upload</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Supports PDF, DOC, DOCX, images, and more
                    </p>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="secondary" className="cursor-pointer">
                        Choose File
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              {/* File Type Info */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: FileText, label: 'Documents', types: 'PDF, DOC, TXT', color: 'text-red-400' },
                  { icon: Image, label: 'Images', types: 'PNG, JPG, GIF', color: 'text-purple-400' },
                  { icon: File, label: 'Other', types: 'Any file type', color: 'text-blue-400' }
                ].map((item, index) => (
                  <div key={index} className="bg-dark-700 rounded-lg p-3">
                    <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.types}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link Upload */}
          {uploadType === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  URL <span className="text-red-400">*</span>
                </label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/document"
                  className="bg-dark-700 border-dark-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Title (optional)
                </label>
                <Input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Give this link a descriptive name"
                  className="bg-dark-700 border-dark-600 text-white"
                />
              </div>

              {/* Link Preview */}
              {linkUrl && (
                <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                  <div className="flex items-center space-x-3">
                    <Link className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">
                        {linkTitle || linkUrl}
                      </p>
                      <p className="text-sm text-gray-400">{linkUrl}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description to help others understand this document..."
              className="bg-dark-700 border-dark-600 text-white"
              rows={3}
            />
          </div>

          {/* AI Processing Info */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-400 mb-1">AI Processing</p>
                <p className="text-sm text-gray-300">
                  Uploaded documents will be automatically processed by our AI to extract key insights, 
                  generate summaries, and make them searchable in conversations.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dark-700">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!isValid() || isUploading}
              className="redpill-button-primary"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadType === 'file' ? 'Upload Document' : 'Add Link'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}