'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Database,
  Building,
  User,
  DollarSign,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react'
import { analyzeExcelFile, executeExcelImport, ExcelAnalysisResult } from '@/app/admin/datos/actions'

export function DataManagementManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [base64File, setBase64File] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')

  // Estados de proceso
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ExcelAnalysisResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success?: boolean
    createdContracts?: number
    updatedContracts?: number
    createdVouchers?: number
    updatedVouchers?: number
    error?: string
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Procesar archivo seleccionado
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Por favor selecciona un archivo Excel válido (.xlsx o .xls).')
      return
    }

    setSelectedFile(file)
    setErrorMessage(null)
    setAnalysisResult(null)
    setImportResult(null)
    setIsAnalyzing(true)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        setBase64File(base64)

        const res = await analyzeExcelFile(base64)
        setIsAnalyzing(false)

        if (res.error) {
          setErrorMessage(res.error)
        } else if (res.analysis) {
          setAnalysisResult(res.analysis)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setIsAnalyzing(false)
      setErrorMessage('Error al leer el archivo Excel: ' + err.message)
    }
  }

  // Ejecutar importación definitiva
  async function handleConfirmImport() {
    if (!base64File) return

    if (
      importMode === 'replace' &&
      !confirm(
        '⚠️ ATENCIÓN: El modo "Reemplazo Total" eliminará las propiedades y liquidaciones actuales para sustituirlas con el archivo. ¿Estás seguro de continuar?'
      )
    ) {
      return
    }

    setIsImporting(true)
    setErrorMessage(null)

    try {
      const res = await executeExcelImport(base64File, importMode)
      setIsImporting(false)

      if (res.error) {
        setErrorMessage(res.error)
      } else {
        setImportResult(res)
      }
    } catch (err: any) {
      setIsImporting(false)
      setErrorMessage('Error al importar datos: ' + err.message)
    }
  }

  // Reiniciar estado para cargar otro archivo
  function handleReset() {
    setSelectedFile(null)
    setBase64File(null)
    setAnalysisResult(null)
    setImportResult(null)
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. HEADER CENTRADO Y EJECUTIVO */}
      <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold border border-primary/20">
          <Database className="w-3.5 h-3.5" />
          <span>Gestión de Datos & Migración</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Carga y Descarga de Datos (Excel)
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          Descarga la base de datos con la estructura oficial del sistema, adapta los datos de arriendos y súbelos para actualizar automáticamente propiedades y vouchers.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="cursor-pointer font-bold">
            &times;
          </button>
        </div>
      )}

      {/* 2. SECCIÓN: DESCARGAR / EXPORTAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: Base de Datos Actual */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                EXPORTACIÓN COMPLETA
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Datos Reales en BD
              </span>
            </div>
            <h3 className="text-base font-extrabold text-foreground mt-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Descargar Base de Datos Actual</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Exporta un archivo Excel con todas las propiedades, contratos y vouchers registrados actualmente en el sistema, listo para editar o usar de respaldo.
            </p>
          </div>

          <a
            href="/api/admin/datos/export"
            download
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-all shadow-2xs hover:scale-[1.01]"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Descargar Base de Datos (.xlsx)</span>
          </a>
        </div>

        {/* Card B: Plantilla Vacía */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                ESTRUCTURA OFICIAL
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                Plantilla Limpia
              </span>
            </div>
            <h3 className="text-base font-extrabold text-foreground mt-2 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-primary" />
              <span>Descargar Plantilla Vacía</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Descarga el formato modelo con los encabezados exactos que requiere el sistema y 2 filas de ejemplo, más la pestaña de guía de llenado.
            </p>
          </div>

          <a
            href="/api/admin/datos/export?template=true"
            download
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all shadow-2xs hover:scale-[1.01]"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Descargar Plantilla Modelo (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* 3. SECCIÓN: CARGAR / IMPORTAR ARCHIVO EXCEL */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            ACTUALIZACIÓN & MIGRACIÓN
          </span>
          <h2 className="text-lg font-extrabold text-foreground mt-1 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            <span>Cargar Datos desde Excel (.xlsx)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Arrastra tu archivo Excel con la estructura de propiedades y liquidaciones para que el sistema analice los cambios antes de ingresarlos.
          </p>
        </div>

        {/* Zona de Drop / Selección de Archivo */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary mx-auto flex items-center justify-center transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Haz clic para seleccionar o arrastra tu archivo Excel aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos compatibles: .xlsx o .xls con la hoja &quot;BASE CONSOLIDADA&quot;
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              className="hidden"
            />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground block">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Archivo listo para importar
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cambiar archivo
            </button>
          </div>
        )}

        {/* Loader de Análisis */}
        {isAnalyzing && (
          <div className="p-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-xs font-bold text-foreground">
              Analizando archivo y comparando con la base de datos...
            </p>
          </div>
        )}

        {/* RESUMEN DEL ANÁLISIS PREVIO A LA IMPORTACIÓN */}
        {analysisResult && !importResult && (
          <div className="space-y-4 pt-2 border-t border-border/60">
            {/* Tarjetas de Métricas de Cambios */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  Nuevas Propiedades
                </span>
                <span className="text-2xl font-black mt-0.5 block">
                  +{analysisResult.newProperties}
                </span>
                <span className="text-[10px] opacity-80 block">Se darán de alta</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  A Actualizar
                </span>
                <span className="text-2xl font-black mt-0.5 block">
                  {analysisResult.updatedProperties}
                </span>
                <span className="text-[10px] opacity-80 block">Cambios de arriendo/datos</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  Sin Cambios
                </span>
                <span className="text-2xl font-black mt-0.5 block">
                  {analysisResult.unchangedProperties}
                </span>
                <span className="text-[10px] opacity-80 block">Idénticos en BD</span>
              </div>

              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  Vouchers / Mes
                </span>
                <span className="text-2xl font-black mt-0.5 block">
                  {analysisResult.totalVouchers}
                </span>
                <span className="text-[10px] opacity-80 block truncate">
                  {analysisResult.detectedMonths.join(', ') || 'Periodo activo'}
                </span>
              </div>
            </div>

            {/* Opciones de Importación */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
              <span className="text-xs font-bold text-foreground block">
                Modo de Aplicación:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    importMode === 'merge'
                      ? 'border-primary bg-primary/5 text-foreground font-bold shadow-2xs'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-0.5 text-primary"
                  />
                  <div>
                    <span className="block font-bold">Sincronizar y Actualizar (Recomendado)</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Actualiza valores de contratos existentes e inserta los nuevos sin borrar nada.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    importMode === 'replace'
                      ? 'border-rose-500 bg-rose-500/5 text-foreground font-bold shadow-2xs'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 text-rose-500"
                  />
                  <div>
                    <span className="block font-bold text-rose-600 dark:text-rose-400">Reemplazo Total</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Limpia la base de datos y monta 100% los registros del nuevo Excel.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Previsualización de Filas de Ejemplo */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Previsualización de los primeros registros a procesar:
              </span>

              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Edificio / Unidad</th>
                      <th className="py-2.5 px-3">Arrendatario</th>
                      <th className="py-2.5 px-3 text-right">Monto</th>
                      <th className="py-2.5 px-3">Empresa</th>
                      <th className="py-2.5 px-3">Mes</th>
                      <th className="py-2.5 px-3">Pago Cartola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analysisResult.previewRows.slice(0, 10).map((row) => (
                      <tr key={row.idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              row.action === 'NUEVO'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : row.action === 'ACTUALIZAR'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {row.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-foreground">
                          {row.building} · {row.unitNumber}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-medium text-foreground block">{row.tenantName}</span>
                          {row.changes && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                              {row.changes.join(' | ')}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-foreground">
                          ${row.totalRent.toLocaleString('es-CL')}
                        </td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">
                          {row.companyCode || '-'}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {row.month}
                        </td>
                        <td className="py-2 px-3">
                          {row.paymentDate ? (
                            <span className="text-emerald-600 font-bold font-mono">
                              {row.paymentDate}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón de Confirmación Definitiva */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isImporting}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-60"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importando registros a la base de datos...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Confirmar e Importar {analysisResult.totalRows} Registros
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* RESULTADO DE LA IMPORTACIÓN COMPLETADA */}
        {importResult && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-foreground space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">
                  ¡Importación completada con éxito!
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Los datos del archivo Excel fueron procesados y guardados en la base de datos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-500/20">
              <div className="p-3 rounded-xl bg-background border border-border text-xs">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Propiedades Creadas
                </span>
                <span className="text-xl font-black text-foreground mt-0.5 block">
                  +{importResult.createdContracts ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border text-xs">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Propiedades Actualizadas
                </span>
                <span className="text-xl font-black text-foreground mt-0.5 block">
                  {importResult.updatedContracts ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border text-xs">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Vouchers Creados
                </span>
                <span className="text-xl font-black text-foreground mt-0.5 block">
                  +{importResult.createdVouchers ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border text-xs">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Vouchers Actualizados
                </span>
                <span className="text-xl font-black text-foreground mt-0.5 block">
                  {importResult.updatedVouchers ?? 0}
                </span>
              </div>
            </div>

            {/* Accesos rápidos a las vistas */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 transition-colors"
              >
                <span>Ver en Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/admin/arriendos"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs transition-colors"
              >
                <span>Ver Propiedades</span>
              </Link>

              <Link
                href="/admin/vouchers"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs transition-colors"
              >
                <span>Ver Vouchers</span>
              </Link>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                Cargar otro archivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
