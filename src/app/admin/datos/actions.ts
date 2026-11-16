'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import * as XLSX from 'xlsx'

async function checkAuth(action: 'view' | 'create' | 'edit' | 'delete') {
  const session = await requireAdminAuth('vouchers', action)
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    throw new Error('Acceso no autorizado: Módulo exclusivo para el rol de Contabilidad')
  }
  return session
}

function parseDate(val: any): string | null {
  if (!val) return null
  if (val instanceof Date) {
    const y = val.getUTCFullYear()
    const m = String(val.getUTCMonth() + 1).padStart(2, '0')
    const d = String(val.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000))
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const str = String(val).trim()
  if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
  }
  return str || null
}

function parseNum(val: any): number {
  if (!val) return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const clean = String(val).replace(/[^0-9.-]+/g, '')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

export interface ExcelAnalysisResult {
  totalRows: number
  newProperties: number
  updatedProperties: number
  unchangedProperties: number
  totalVouchers: number
  detectedMonths: string[]
  detectedYear: number
  detectedCompanies: string[]
  warnings: string[]
  previewRows: {
    idx: number
    action: 'NUEVO' | 'ACTUALIZAR' | 'IDÉNTICO'
    building: string
    unitNumber: string
    propertyType: string
    tenantName: string
    baseRent: number
    totalRent: number
    companyCode: string
    month: string
    paymentStatus: string
    paymentDate: string | null
    changes?: string[]
  }[]
}

/**
 * 1. Analiza el archivo Excel y devuelve un resumen de cambios antes de aplicar nada
 */
export async function analyzeExcelFile(base64Data: string): Promise<{ success?: boolean; analysis?: ExcelAnalysisResult; error?: string }> {
  await checkAuth('view')

  try {
    const buffer = Buffer.from(base64Data, 'base64')
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })

    // Buscar hoja BASE CONSOLIDADA o usar la primera
    const sheetName = wb.SheetNames.includes('BASE CONSOLIDADA') ? 'BASE CONSOLIDADA' : wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]
    if (!ws) {
      return { error: 'El archivo Excel no contiene ninguna hoja válida con datos.' }
    }

    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
    if (rows.length === 0) {
      return { error: 'La hoja seleccionada está vacía.' }
    }

    // Cargar empresas de la base de datos para mapeo
    const dbCompanies = await prisma.ownerCompany.findMany()
    const companyCodeMap = new Map<string, string>()
    for (const c of dbCompanies) {
      companyCodeMap.set(c.code.toUpperCase(), c.id)
      companyCodeMap.set(c.name.toUpperCase(), c.id)
    }

    // Cargar todos los contratos actuales de la base de datos
    const dbContracts = await prisma.rentalContract.findMany({
      include: {
        company: true,
        vouchers: true,
      },
    })

    // Mapa de contratos existentes por clave (Edificio + Unidad)
    const existingMap = new Map<string, typeof dbContracts[0]>()
    for (const c of dbContracts) {
      const key = `${c.building.trim().toUpperCase()}|${c.unitNumber.trim().toUpperCase()}`
      existingMap.set(key, c)
    }

    let newProperties = 0
    let updatedProperties = 0
    let unchangedProperties = 0
    let totalVouchers = 0
    const monthsSet = new Set<string>()
    const companiesSet = new Set<string>()
    const warnings: string[] = []
    let detectedYear = 2026

    const previewRows: ExcelAnalysisResult['previewRows'] = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const building = String(r['EDIFICIO'] || '').trim().toUpperCase()
      const storageNo = String(r['BODEGA N°'] || r['BODEGA'] || '').trim()
      const parkingNo = String(r['ESTACIONAMIENTO N°'] || r['ESTACIONAMIENTO'] || '').trim()
      let unitNo = String(r['N°'] || r['N° UNIDAD'] || '').trim()

      if (!unitNo) {
        if (storageNo) unitNo = `B-${storageNo}`
        else if (parkingNo) unitNo = `E-${parkingNo}`
        else unitNo = `U-${i + 1}`
      }

      if (!building) {
        warnings.push(`Fila ${i + 2}: Edificio vacío, se omitirá o requiere revisión.`)
        continue
      }

      const tenantName = String(r['ARRENDATARIO'] || '').trim()
      const propertyType = String(r['TIPO INMUEBLE'] || 'Departamento').trim()
      const rawCompany = String(r['EMPRESA'] || r['NOMBRE EMPRESA'] || '').trim().toUpperCase()
      if (rawCompany) companiesSet.add(rawCompany)

      const month = String(r['MES'] || 'NOVIEMBRE').trim().toUpperCase()
      if (month) monthsSet.add(month)

      const yearVal = parseNum(r['AÑO'])
      if (yearVal >= 2020) detectedYear = yearVal

      const baseRent = parseNum(r['ARRIENDO 2026'] || r['ARRIENDO BASE'] || r['VALOR T'] || 0)
      const totalRent = parseNum(r['VALOR T'] || r['TOTAL'] || baseRent)
      const paymentDate = parseDate(r['FECHA PAGO'] || r['FECHA INGRESO'])

      const lookupKey = `${building}|${unitNo.toUpperCase()}`
      const existing = existingMap.get(lookupKey)

      let action: 'NUEVO' | 'ACTUALIZAR' | 'IDÉNTICO' = 'NUEVO'
      const changes: string[] = []

      if (!existing) {
        newProperties++
        action = 'NUEVO'
      } else {
        // Comparar cambios relevantes
        if (existing.tenantName.trim().toLowerCase() !== tenantName.trim().toLowerCase()) {
          changes.push(`Arrendatario: ${existing.tenantName} → ${tenantName}`)
        }
        if (Math.round(existing.totalRent) !== Math.round(totalRent)) {
          changes.push(`Monto: $${existing.totalRent.toLocaleString('es-CL')} → $${totalRent.toLocaleString('es-CL')}`)
        }
        if (rawCompany && existing.company?.code !== rawCompany) {
          changes.push(`Empresa: ${existing.company?.code || 'N/A'} → ${rawCompany}`)
        }

        if (changes.length > 0) {
          updatedProperties++
          action = 'ACTUALIZAR'
        } else {
          unchangedProperties++
          action = 'IDÉNTICO'
        }
      }

      totalVouchers++

      let paymentStatus = 'Pendiente'
      if (paymentDate) {
        paymentStatus = 'Pagado'
      } else if (r['ESTADO PAGO']) {
        paymentStatus = String(r['ESTADO PAGO']).trim()
      }

      if (i < 50) {
        previewRows.push({
          idx: i + 1,
          action,
          building,
          unitNumber: unitNo,
          propertyType,
          tenantName: tenantName || (r['ESTADO'] === 'Disponible' ? 'DISPONIBLE' : 'SIN ARRENDATARIO'),
          baseRent,
          totalRent,
          companyCode: rawCompany,
          month,
          paymentStatus,
          paymentDate,
          changes: changes.length > 0 ? changes : undefined,
        })
      }
    }

    return {
      success: true,
      analysis: {
        totalRows: rows.length,
        newProperties,
        updatedProperties,
        unchangedProperties,
        totalVouchers,
        detectedMonths: Array.from(monthsSet),
        detectedYear,
        detectedCompanies: Array.from(companiesSet),
        warnings: warnings.slice(0, 10),
        previewRows,
      },
    }
  } catch (err: any) {
    console.error('Error al analizar archivo Excel:', err)
    return { error: err.message || 'Error inesperado al leer el archivo Excel.' }
  }
}

/**
 * 2. Ejecuta la importación definitiva a la base de datos
 */
export async function executeExcelImport(
  base64Data: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{
  success?: boolean
  createdContracts?: number
  updatedContracts?: number
  createdVouchers?: number
  updatedVouchers?: number
  error?: string
}> {
  await checkAuth('create')

  try {
    const buffer = Buffer.from(base64Data, 'base64')
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })

    const sheetName = wb.SheetNames.includes('BASE CONSOLIDADA') ? 'BASE CONSOLIDADA' : wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]
    if (!ws) {
      return { error: 'No se encontró una hoja válida para importar.' }
    }

    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
    if (rows.length === 0) {
      return { error: 'El archivo no contiene filas.' }
    }

    // Mapa de empresas en la BD
    const dbCompanies = await prisma.ownerCompany.findMany()
    const companyMap = new Map<string, string>()
    for (const c of dbCompanies) {
      companyMap.set(c.code.toUpperCase(), c.id)
      companyMap.set(c.name.toLowerCase(), c.id)
      if (c.code === 'JR') companyMap.set('jose retamal', c.id)
      if (c.code === 'BC') companyMap.set('buses cipreses', c.id)
      if (c.code === 'GP') companyMap.set('grand prix', c.id)
      if (c.code === 'RB') companyMap.set('retamal y bustos', c.id)
      if (c.code === 'AMB') companyMap.set('amb', c.id)
      if (c.code === 'CANDY') companyMap.set('candy spa', c.id)
      if (c.code === 'NYS') companyMap.set('nys ltda', c.id)
    }

    // Si el modo es "replace", limpiamos vouchers y contratos existentes
    if (mode === 'replace') {
      await prisma.leaseVoucher.deleteMany({})
      await prisma.rentalContract.deleteMany({})
    }

    // Mapa de contratos existentes en BD
    const existingContracts = await prisma.rentalContract.findMany()
    const contractCache = new Map<string, string>() // key -> id
    for (const c of existingContracts) {
      const key = `${c.building.trim().toUpperCase()}|${c.unitNumber.trim().toUpperCase()}`
      contractCache.set(key, c.id)
    }

    // Mapa de vouchers existentes en BD para el año detectado (evita miles de consultas findFirst)
    const existingVouchersList = mode === 'replace' ? [] : await prisma.leaseVoucher.findMany({
      select: { id: true, contractId: true, month: true, year: true, receiptNumber: true, invoiceNumber: true, paymentDate: true, bank: true, comment: true }
    })
    const voucherCache = new Map<string, typeof existingVouchersList[0]>()
    for (const v of existingVouchersList) {
      voucherCache.set(`${v.contractId}|${v.month.toUpperCase()}|${v.year}`, v)
    }

    let createdContracts = 0
    let updatedContracts = 0
    let createdVouchers = 0
    let updatedVouchers = 0

    const newVouchersToBatch: any[] = []

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx]
      const building = String(r['EDIFICIO'] || '').trim().toUpperCase()
      if (!building) continue

      const storageNo = String(r['BODEGA N°'] || r['BODEGA'] || '').trim()
      const parkingNo = String(r['ESTACIONAMIENTO N°'] || r['ESTACIONAMIENTO'] || '').trim()
      let unitNo = String(r['N°'] || r['N° UNIDAD'] || '').trim()
      if (!unitNo) {
        if (storageNo) unitNo = `B-${storageNo}`
        else if (parkingNo) unitNo = `E-${parkingNo}`
        else unitNo = `U-${idx + 1}`
      }

      const rawComp = String(r['EMPRESA'] || r['NOMBRE EMPRESA'] || r['Nuevo asignatario'] || '').trim()
      const companyId = companyMap.get(rawComp.toUpperCase()) || companyMap.get(rawComp.toLowerCase()) || null

      const tenantName = String(r['ARRENDATARIO'] || '').trim()
      const tenantRut = String(r['RUT ARRENDATARIO'] || r['RUT'] || '').trim()
      const tenantPhone = String(r['TELÉFONO ARRENDATARIO'] || r['TELÉFONO'] || '').trim()
      const tenantEmail = String(r['CORREO'] || '').trim().toLowerCase()
      const propertyType = String(r['TIPO INMUEBLE'] || 'Departamento').trim() || 'Departamento'
      const rol = String(r['ROL'] || '').trim()
      const address = String(r['DIRECCIÓN INMUEBLE'] || r['DIRECCION'] || '').trim()
      const contractDate = parseDate(r['FECHA CONTRATO'])
      const renewalPeriod = String(r['RENOVACIÓN'] || '').trim()
      const newAssignee = String(r['NUEVO ASIGNATARIO'] || r['Nuevo asignatario'] || '').trim()

      const rawStatus = String(r['ESTADO'] || '').trim()
      const status = rawStatus.toLowerCase() === 'disponible' || (!tenantName && rawStatus !== 'Ocupado') ? 'Disponible' : 'Ocupado'

      // Valores financieros
      const baseRent = parseNum(r['ARRIENDO 2026'] || r['ARRIENDO BASE'] || 0)
      const adjustmentPercentage = parseNum(r['% REAJUSTE'])
      const adjustmentAmount = parseNum(r['REAJUSTE'])
      const valorT = parseNum(r['VALOR T']) || (baseRent + adjustmentAmount)
      const totalMonth = parseNum(r['TOTAL']) || valorT
      const guaranteeAmount = parseNum(r['GARANT'])
      const expensesCharge = parseNum(r['GASTOS COMUNES CARGO'])
      const expensesPayment = parseNum(r['GASTOS COMUNES ABONO'])
      const previousRent = parseNum(r['ARRIENDO 20252'] || r['ARRIENDO ANTERIOR'])

      // Contactos aval
      const otherContactInfo = String(r['OTROS DATOS DE CONTACTO'] || '').trim()
      const guarantorRelation = String(r['RELACIÓN CON ARRENDATARIO'] || r['AVAL / CONTACTO'] || '').trim()
      const guarantorPhone = String(r['TELÉFONO CONTACTO'] || '').trim()
      const guarantorEmail = String(r['CORREO CONTACTO'] || r['CORREO_1'] || '').trim().toLowerCase()

      const lookupKey = `${building}|${unitNo.toUpperCase()}`
      let contractId = contractCache.get(lookupKey)

      if (!contractId) {
        // Crear nuevo contrato / propiedad
        const created = await prisma.rentalContract.create({
          data: {
            companyId,
            newAssignee: newAssignee || null,
            building,
            unitNumber: unitNo,
            propertyType,
            rol: rol || null,
            address: address || null,
            storageNumber: storageNo || null,
            parkingNumber: parkingNo || null,
            contractDate: contractDate || null,
            renewalPeriod: renewalPeriod || null,
            status,
            tenantName: tenantName || (status === 'Disponible' ? 'DISPONIBLE' : 'POR ASIGNAR'),
            tenantRut: tenantRut || null,
            tenantPhone: tenantPhone || null,
            tenantEmail: tenantEmail || null,
            otherContactInfo: otherContactInfo || null,
            guarantorRelation: guarantorRelation || null,
            guarantorPhone: guarantorPhone || null,
            guarantorEmail: guarantorEmail || null,
            baseRent,
            adjustmentPercentage,
            adjustmentAmount,
            totalRent: valorT,
            guaranteeAmount: guaranteeAmount || null,
            expensesCharge: expensesCharge || null,
            expensesPayment: expensesPayment || null,
            previousRent: previousRent || null,
          },
        })
        contractId = created.id
        contractCache.set(lookupKey, contractId)
        createdContracts++
      } else if (mode === 'merge') {
        // Actualizar contrato existente sólo en modo merge
        await prisma.rentalContract.update({
          where: { id: contractId },
          data: {
            companyId: companyId || undefined,
            newAssignee: newAssignee || undefined,
            propertyType,
            rol: rol || undefined,
            address: address || undefined,
            storageNumber: storageNo || undefined,
            parkingNumber: parkingNo || undefined,
            contractDate: contractDate || undefined,
            renewalPeriod: renewalPeriod || undefined,
            status,
            tenantName: tenantName || undefined,
            tenantRut: tenantRut || undefined,
            tenantPhone: tenantPhone || undefined,
            tenantEmail: tenantEmail || undefined,
            baseRent,
            adjustmentPercentage,
            adjustmentAmount,
            totalRent: valorT,
            guaranteeAmount: guaranteeAmount || undefined,
            expensesCharge: expensesCharge || undefined,
            expensesPayment: expensesPayment || undefined,
            previousRent: previousRent || undefined,
          },
        })
        updatedContracts++
      }

      // Datos del Voucher mensual
      const month = String(r['MES'] || 'NOVIEMBRE').trim().toUpperCase()
      const year = parseNum(r['AÑO']) || 2026
      const receiptNumber = String(r['N° RECIBO'] || '').trim()
      const invoiceNumber = String(r['FACTURA'] || '').trim()
      const paymentDate = parseDate(r['FECHA PAGO'] || r['FECHA INGRESO'])

      const transferAmount = parseNum(r['TRANSFERENCIA'])
      const cashAmount = parseNum(r['EFECTIVO'])
      const depositAmount = parseNum(r['DEPOSITO'])
      const accountsReceivable = parseNum(r['CUENTAS X COBRAR'])
      const collectedAmount = parseNum(r['RECAUDACIÓN']) || (transferAmount + cashAmount + depositAmount)
      const pendingBalance = parseNum(r['SALDO PENDIENTE'])
      const bank = String(r['BANCO'] || '').trim()
      const comment = String(r['COMENTARIO'] || r['COMENTARIOS'] || '').trim()

      let paymentStatus = String(r['ESTADO PAGO'] || '').trim()
      if (!paymentStatus) {
        if (paymentDate || transferAmount > 0 || cashAmount > 0 || depositAmount > 0 || (collectedAmount >= totalMonth && totalMonth > 0)) {
          paymentStatus = 'Pagado'
        } else if (status === 'Disponible' || (totalMonth === 0 && !tenantName)) {
          paymentStatus = 'Disponible'
        } else {
          paymentStatus = 'Pendiente'
        }
      }

      const voucherKey = `${contractId}|${month}|${year}`
      const existingVoucher = voucherCache.get(voucherKey)

      if (existingVoucher) {
        await prisma.leaseVoucher.update({
          where: { id: existingVoucher.id },
          data: {
            receiptNumber: receiptNumber || existingVoucher.receiptNumber,
            invoiceNumber: invoiceNumber || existingVoucher.invoiceNumber,
            baseRent,
            adjustmentPercent: adjustmentPercentage,
            adjustmentAmount,
            totalRent: valorT,
            guaranteeAmount: guaranteeAmount || null,
            totalMonth,
            paymentStatus,
            paymentDate: paymentDate || existingVoucher.paymentDate,
            transferAmount,
            cashAmount,
            depositAmount,
            accountsReceivable,
            collectedAmount: paymentDate && collectedAmount === 0 ? totalMonth : collectedAmount,
            pendingBalance: paymentDate ? 0 : pendingBalance,
            bank: bank || existingVoucher.bank,
            comment: comment || existingVoucher.comment,
          },
        })
        updatedVouchers++
      } else {
        newVouchersToBatch.push({
          contractId,
          companyId,
          month,
          year,
          receiptNumber: receiptNumber || null,
          invoiceNumber: invoiceNumber || null,
          baseRent,
          adjustmentPercent: adjustmentPercentage,
          adjustmentAmount,
          totalRent: valorT,
          guaranteeAmount: guaranteeAmount || null,
          totalMonth,
          paymentStatus,
          paymentDate: paymentDate || null,
          transferAmount,
          cashAmount,
          depositAmount,
          accountsReceivable,
          collectedAmount: paymentDate && collectedAmount === 0 ? totalMonth : collectedAmount,
          pendingBalance: paymentDate ? 0 : (totalMonth - collectedAmount),
          bank: bank || null,
          comment: comment || null,
        })
      }
    }

    // Inserción en lotes de todos los vouchers nuevos (extremadamente veloz)
    const BATCH_SIZE = 350
    for (let b = 0; b < newVouchersToBatch.length; b += BATCH_SIZE) {
      const slice = newVouchersToBatch.slice(b, b + BATCH_SIZE)
      const res = await prisma.leaseVoucher.createMany({
        data: slice,
      })
      createdVouchers += res.count
    }

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/datos')

    return {
      success: true,
      createdContracts,
      updatedContracts,
      createdVouchers,
      updatedVouchers,
    }
  } catch (err: any) {
    console.error('Error al ejecutar importación de Excel:', err)
    return { error: err.message || 'Error inesperado al importar datos desde Excel.' }
  }
}
