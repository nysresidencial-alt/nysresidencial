'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClientUser, ClientDocument } from '@prisma/client'
import { addClientDocument, deleteClientDocument } from '@/app/admin/clientes/actions'
import { 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Download, 
  Loader2, 
  Plus, 
  Calendar,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientDocumentManagerProps {
  client: ClientUser & { documents: ClientDocument[] }
}

export function ClientDocumentManager({ client }: ClientDocumentManagerProps) {
  const router = useRouter()
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Document form fields
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Contrato')
  const [externalUrl, setExternalUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('category', category)
    formData.append('notes', notes)

    if (uploadMode === 'file') {
      if (!selectedFile) {
        setError('Por favor selecciona un archivo PDF o documento para subir.')
        setIsSubmitting(false)
        return
      }
      formData.append('file', selectedFile)
    } else {
      if (!externalUrl) {
        setError('Por favor pega el enlace de OneDrive o enlace web.')
        setIsSubmitting(false)
        return
      }
      formData.append('externalUrl', externalUrl)
    }

    const result = await addClientDocument(client.id, formData)

    if (result.success) {
      setTitle('')
      setExternalUrl('')
      setNotes('')
      setSelectedFile(null)
      setSuccessMsg('¡Documento agregado con éxito a la carpeta del cliente!')
      setIsSubmitting(false)
      setTimeout(() => setSuccessMsg(null), 3000)
      router.refresh()
    } else {
      setError(result.error || 'Ocurrió un error al agregar el documento.')
      setIsSubmitting(false)
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento de la carpeta del cliente?')) {
      return
    }

    setDeletingId(docId)
    const result = await deleteClientDocument(docId, client.id)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'No se pudo eliminar el documento.')
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-8">
      
      {/* Upload Box Card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="border-b border-border pb-4 mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Adjuntar Nuevo Documento para {client.name}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Puedes subir directamente un archivo PDF o pegar un enlace seguro a una carpeta/archivo de OneDrive. El cliente podrá verlo de inmediato en su Oficina Virtual.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl mb-4 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl mb-4 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddDocument} className="space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-2xl w-fit border border-border">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                uploadMode === 'file'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Archivo PDF Directo</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode('link')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                uploadMode === 'link'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Vincular Enlace OneDrive / Web</span>
            </button>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">Título del Documento *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ej: Contrato de Arriendo 2026 - Departamento Amalfi"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Categoría *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer font-medium"
              >
                <option value="Contrato">Contrato de Arriendo / Promesa</option>
                <option value="Escritura">Escritura Notarial</option>
                <option value="Certificado">Certificado de Dominio / Gravámenes</option>
                <option value="Tasación">Informe de Tasación Comercial</option>
                <option value="Liquidación">Liquidación de Arriendo / Pago</option>
                <option value="Plano">Planimetría / Ficha Técnica</option>
                <option value="Otro">Otro Documento</option>
              </select>
            </div>

            {uploadMode === 'file' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Seleccionar Archivo PDF *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Archivo: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Enlace Compartido (OneDrive / Web) *</label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  required
                  placeholder="https://1drv.ms/b/s!... o enlace web"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Pega el link de lectura o descarga generado desde tu OneDrive o nube.
                </p>
              </div>
            )}

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">Nota / Comentario para el Cliente (Opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Copia firmada ante Notaría Talca con vigencia 1 año."
                className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

          </div>

          <div className="flex items-center justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-7 shadow-sm cursor-pointer text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  <span>Subiendo documento...</span>
                </>
              ) : (
                <span>Guardar y Publicar en Oficina Virtual</span>
              )}
            </Button>
          </div>

        </form>
      </div>

      {/* Documents List */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <span>Documentos en la Carpeta ({client.documents.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estos son los documentos visibles actualmente para {client.name} en su portal privado.
            </p>
          </div>
        </div>

        {client.documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-foreground">Esta carpeta aún no tiene documentos</p>
            <p className="text-xs text-muted-foreground mt-0.5">Utiliza el formulario superior para subir o vincular el primer archivo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {client.documents.map((doc) => {
              const formattedDate = new Date(doc.createdAt).toLocaleDateString('es-CL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })

              return (
                <div
                  key={doc.id}
                  className="bg-background border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all shadow-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {doc.category}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {doc.isExternal ? 'OneDrive / Web' : doc.fileType}
                      </span>
                      {doc.fileSize && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {doc.fileSize}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                      {doc.title}
                    </h4>

                    {doc.notes && (
                      <p className="text-xs text-muted-foreground italic">
                        &ldquo;{doc.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Subido el {formattedDate}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer border border-border"
                    >
                      {doc.isExternal ? (
                        <>
                          <span>Abrir Enlace</span>
                          <ExternalLink className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <span>Descargar</span>
                          <Download className="w-3 h-3" />
                        </>
                      )}
                    </a>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-full cursor-pointer"
                      title="Eliminar documento"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
