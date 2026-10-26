'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { importClientsBatch } from '@/app/admin/clientes/actions'
import { FileSpreadsheet, Upload, Download, Loader2, X, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImportClientsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{
    created: number
    skipped: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function downloadTemplate() {
    // Generar archivo CSV compatible con Excel (con BOM UTF-8)
    const headers = ['Nombre Completo', 'RUT', 'Correo', 'Telefono', 'Clave', 'Notas']
    const exampleRows = [
      ['Juan Perez Soto', '12.345.678-9', 'juan.perez@gmail.com', '+56 9 1234 5678', 'Juan2026', 'Comprador Depto Las Rastras'],
      ['Maria Silva Gomez', '9.876.543-2', 'maria.silva@gmail.com', '+56 9 8765 4321', 'Maria2026', 'Arrendataria Parcela Los Lirios'],
      ['Carlos Rojas Munoz', '15.678.901-3', 'carlos.rojas@gmail.com', '+56 9 5555 6666', '', 'Si dejas la clave vacia se le asigna su RUT'],
    ]

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...exampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')),
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_clientes_nys.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function parseCSV(text: string) {
    // Normalizar saltos de línea
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return []

    // Detectar separador (; o ,)
    const headerLine = lines[0]
    const delimiter = headerLine.includes(';') ? ';' : ','

    const results: Array<{
      name: string
      rut?: string
      email?: string
      phone?: string
      password?: string
      notes?: string
    }> = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // Regex para separar respetando comillas
      const regex = new RegExp(`(?:^|\\${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"\\${delimiter}]*))`, 'g')
      const matches: string[] = []
      let match
      while ((match = regex.exec(line)) !== null) {
        let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2]
        matches.push((val || '').trim())
      }

      if (matches.length > 0 && matches[0]) {
        results.push({
          name: matches[0],
          rut: matches[1] || undefined,
          email: matches[2] || undefined,
          phone: matches[3] || undefined,
          password: matches[4] || undefined,
          notes: matches[5] || undefined,
        })
      }
    }

    return results
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    setSummary(null)

    try {
      const text = await file.text()
      const parsedData = parseCSV(text)

      if (parsedData.length === 0) {
        setError('No se encontraron registros de clientes en el archivo o el formato no es válido.')
        setIsLoading(false)
        return
      }

      const res = await importClientsBatch(parsedData)
      if (res.success) {
        setSummary({
          created: res.createdCount || 0,
          skipped: res.skippedCount || 0,
          errors: res.errors || [],
        })
        router.refresh()
      } else {
        setError(res.error || 'Ocurrió un error al procesar el archivo.')
      }
    } catch (err: any) {
      console.error('Error reading CSV:', err)
      setError('Error al leer el archivo. Asegúrate de que sea un archivo CSV válido.')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true)
          setError(null)
          setSummary(null)
        }}
        variant="outline"
        className="rounded-full px-4 border-border font-semibold text-xs sm:text-sm cursor-pointer hover:bg-muted"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
        <span>Carga Masiva (Excel/CSV)</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Carga Masiva de Clientes</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sube varios clientes a la vez con un archivo Excel o CSV para habilitarles su Oficina Virtual.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paso 1: Descarga de plantilla */}
            <div className="bg-muted/50 border border-border/80 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-foreground">1. Descarga la plantilla</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Plantilla preparada con las columnas requeridas (Nombre, RUT, Correo, etc.)
                </p>
              </div>

              <Button
                type="button"
                onClick={downloadTemplate}
                size="sm"
                variant="outline"
                className="rounded-full text-xs font-semibold gap-1.5 shrink-0 bg-background hover:bg-muted"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar CSV</span>
              </Button>
            </div>

            {/* Paso 2: Subida de archivo */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-foreground mb-1.5">2. Selecciona tu archivo completado</h4>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                  disabled={isLoading}
                />

                <label
                  htmlFor="csv-file-input"
                  className={`border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-background transition-all ${
                    isLoading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-xs font-bold text-foreground">Procesando y registrando clientes...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-foreground block">
                          Haz clic para seleccionar el archivo CSV
                        </span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          Compatible con Excel (Guardar como CSV UTF-8)
                        </span>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {summary && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>¡Carga completada!</span>
                  </div>
                  <p className="text-xs text-foreground">
                    Se crearon <strong className="text-emerald-600 dark:text-emerald-400">{summary.created}</strong> clientes con éxito.
                    {summary.skipped > 0 && ` (${summary.skipped} omitidos por estar duplicados o vacíos)`}
                  </p>
                  {summary.errors.length > 0 && (
                    <div className="text-[11px] text-muted-foreground max-h-24 overflow-y-auto space-y-1 pt-1 border-t border-emerald-500/20">
                      {summary.errors.map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-full text-xs px-5"
              >
                Cerrar
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
