import 'dotenv/config'
import * as XLSX from 'xlsx'
import prisma from '../src/lib/db'

function parseDate(val: any): string | null {
  if (!val) return null
  if (val instanceof Date) {
    const y = val.getUTCFullYear()
    const m = String(val.getUTCMonth() + 1).padStart(2, '0')
    const d = String(val.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof val === 'number') {
    // Excel serial date to JS Date
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

async function run() {
  console.log('--- NyS Residencial: Importación Masiva Excel Real ---')
  const excelPath = 'C:/Users/Luciano/.gemini/antigravity/brain/bbf6713c-3f07-4a32-a042-74c1009a46f4/.user_uploaded/media_1794860133114_eb975fa5.xlsx'

  console.log('1. Leyendo archivo Excel:', excelPath)
  const wb = XLSX.readFile(excelPath, { cellDates: true })
  const sheet = wb.Sheets['BASE CONSOLIDADA'] || wb.Sheets[wb.SheetNames[0]]
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  console.log(`Total de filas leídas: ${rows.length}`)

  // 2. Obtener empresas de la BD
  const companies = await prisma.ownerCompany.findMany()
  console.log(`Empresas propietarias en BD: ${companies.length}`)
  const companyMap = new Map<string, string>()
  for (const c of companies) {
    companyMap.set(c.code.toUpperCase(), c.id)
    companyMap.set(c.name.toLowerCase().trim(), c.id)
    if (c.code === 'JR') companyMap.set('jose retamal', c.id)
    if (c.code === 'BC') companyMap.set('buses cipreses', c.id)
    if (c.code === 'GP') companyMap.set('grand prix', c.id)
    if (c.code === 'RB') companyMap.set('retamal y bustos', c.id)
    if (c.code === 'AMB') {
      companyMap.set('amb', c.id)
      companyMap.set('ana maría bustos', c.id)
      companyMap.set('ana maria bustos', c.id)
    }
    if (c.code === 'JFR') companyMap.set('jfr propiedades', c.id)
    if (c.code === 'CANDY') companyMap.set('candy spa', c.id)
    if (c.code === 'NYS') companyMap.set('nys ltda', c.id)
  }

  function resolveCompanyId(rawEmp: string, rawNom: string): string | null {
    const nomLower = rawNom.trim().toLowerCase()
    const empUpper = rawEmp.trim().toUpperCase()
    if (nomLower && companyMap.has(nomLower)) return companyMap.get(nomLower)!
    if (empUpper && companyMap.has(empUpper)) return companyMap.get(empUpper)!
    if (nomLower.includes('cipreses')) return companyMap.get('buses cipreses') || null
    if (nomLower.includes('retamal y bustos')) return companyMap.get('retamal y bustos') || null
    if (nomLower.includes('retamal')) return companyMap.get('jose retamal') || null
    if (nomLower.includes('grand prix')) return companyMap.get('grand prix') || null
    if (nomLower.includes('jfr')) return companyMap.get('jfr propiedades') || null
    if (nomLower.includes('amb') || nomLower.includes('ana mar')) return companyMap.get('amb') || null
    return null
  }

  // 3. Limpiar Base de Datos (Únicamente Vouchers y Contratos de Arriendo)
  console.log('2. Limpiando vouchers y contratos de arriendo anteriores...')
  const deletedVouchers = await prisma.leaseVoucher.deleteMany({})
  const deletedContracts = await prisma.rentalContract.deleteMany({})
  console.log(`Eliminados: ${deletedVouchers.count} vouchers y ${deletedContracts.count} contratos anteriores.`)

  // 4. Agrupar filas para identificar cada Contrato/Propiedad única
  // Tomamos los datos más recientes o más completos (e.g. ordenados por mes)
  interface ContractAcc {
    building: string
    unitNumber: string
    storageNumber: string | null
    parkingNumber: string | null
    propertyType: string
    rol: string | null
    address: string | null
    contractDate: string | null
    renewalPeriod: string | null
    newAssignee: string | null
    companyId: string | null
    status: string
    tenantName: string
    tenantRut: string | null
    tenantPhone: string | null
    tenantEmail: string | null
    otherContactInfo: string | null
    guarantorRelation: string | null
    guarantorPhone: string | null
    guarantorEmail: string | null
    baseRent: number
    adjustmentPercentage: number
    adjustmentAmount: number
    totalRent: number
    guaranteeAmount: number | null
    expensesCharge: number | null
    expensesPayment: number | null
    previousRent: number | null
  }

  const contractsMap = new Map<string, ContractAcc>()

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const building = String(r['EDIFICIO'] || '').trim().toUpperCase()
    if (!building) continue

    const storageNo = String(r['BODEGA N°'] || r['BODEGA'] || '').trim() || null
    const parkingNo = String(r['ESTACIONAMIENTO N°'] || r['ESTACIONAMIENTO'] || '').trim() || null
    let unitNo = String(r['N°'] || r['N° UNIDAD'] || '').trim()
    if (!unitNo) {
      if (storageNo) unitNo = `B-${storageNo}`
      else if (parkingNo) unitNo = `E-${parkingNo}`
      else unitNo = `U-${i + 1}`
    }

    const key = `${building}|${unitNo.toUpperCase()}`
    const rawEmp = String(r['EMPRESA'] || '').trim()
    const rawNom = String(r['NOMBRE EMPRESA'] || '').trim()
    const companyId = resolveCompanyId(rawEmp, rawNom)

    const tenantName = String(r['ARRENDATARIO'] || '').trim()
    const tenantRut = String(r['RUT ARRENDATARIO'] || r['RUT'] || '').trim() || null
    const tenantPhone = String(r['TELÉFONO ARRENDATARIO'] || r['TELÉFONO'] || '').trim() || null
    const tenantEmail = String(r['CORREO'] || '').trim().toLowerCase() || null
    const propertyType = String(r['TIPO INMUEBLE'] || 'Departamento').trim() || 'Departamento'
    const rol = String(r['ROL'] || '').trim() || null
    const address = String(r['DIRECCIÓN INMUEBLE'] || r['DIRECCION'] || '').trim() || null
    const contractDate = parseDate(r['FECHA CONTRATO'])
    const renewalPeriod = String(r['RENOVACIÓN'] || '').trim() || null
    const newAssignee = String(r['NUEVO ASIGNATARIO'] || r['Nuevo asignatario'] || '').trim() || null

    const rawStatus = String(r['ESTADO'] || '').trim()
    const status = rawStatus.toLowerCase() === 'disponible' || (!tenantName && rawStatus !== 'Ocupado')
      ? 'Disponible'
      : (rawStatus || 'Ocupado')

    const baseRent = parseNum(r['ARRIENDO 2026'] || r['ARRIENDO BASE'] || 0)
    const adjustmentPercentage = parseNum(r['% REAJUSTE'])
    const adjustmentAmount = parseNum(r['REAJUSTE'])
    const valorT = parseNum(r['VALOR T']) || (baseRent + adjustmentAmount)
    const guaranteeAmount = parseNum(r['GARANT']) || null
    const expensesCharge = parseNum(r['GASTOS COMUNES CARGO']) || null
    const expensesPayment = parseNum(r['GASTOS COMUNES ABONO']) || null
    const previousRent = parseNum(r['ARRIENDO 20252'] || r['ARRIENDO ANTERIOR']) || null

    const otherContactInfo = String(r['OTROS DATOS DE CONTACTO'] || '').trim() || null
    const guarantorRelation = String(r['RELACIÓN CON ARRENDATARIO'] || r['AVAL / CONTACTO'] || '').trim() || null
    const guarantorPhone = String(r['TELÉFONO CONTACTO'] || '').trim() || null
    const guarantorEmail = String(r['CORREO CONTACTO'] || r['CORREO_1'] || '').trim().toLowerCase() || null

    const existing = contractsMap.get(key)
    if (!existing) {
      contractsMap.set(key, {
        building,
        unitNumber: unitNo,
        storageNumber: storageNo,
        parkingNumber: parkingNo,
        propertyType,
        rol,
        address,
        contractDate,
        renewalPeriod,
        newAssignee,
        companyId,
        status,
        tenantName: tenantName || (status === 'Disponible' ? 'DISPONIBLE' : 'POR ASIGNAR'),
        tenantRut,
        tenantPhone,
        tenantEmail,
        otherContactInfo,
        guarantorRelation,
        guarantorPhone,
        guarantorEmail,
        baseRent,
        adjustmentPercentage,
        adjustmentAmount,
        totalRent: valorT,
        guaranteeAmount,
        expensesCharge,
        expensesPayment,
        previousRent,
      })
    } else {
      // Si la fila posterior tiene datos más completos de arrendatario o montos vigentes, actualizar
      if (tenantName && tenantName !== 'DISPONIBLE') {
        existing.tenantName = tenantName
        if (tenantRut) existing.tenantRut = tenantRut
        if (tenantPhone) existing.tenantPhone = tenantPhone
        if (tenantEmail) existing.tenantEmail = tenantEmail
        if (status) existing.status = status
      }
      if (valorT > 0) {
        existing.baseRent = baseRent || existing.baseRent
        existing.adjustmentPercentage = adjustmentPercentage || existing.adjustmentPercentage
        existing.adjustmentAmount = adjustmentAmount || existing.adjustmentAmount
        existing.totalRent = valorT
      }
      if (companyId && !existing.companyId) existing.companyId = companyId
      if (otherContactInfo) existing.otherContactInfo = otherContactInfo
      if (guarantorRelation) existing.guarantorRelation = guarantorRelation
      if (guarantorPhone) existing.guarantorPhone = guarantorPhone
      if (guarantorEmail) existing.guarantorEmail = guarantorEmail
      if (contractDate) existing.contractDate = contractDate
      if (renewalPeriod) existing.renewalPeriod = renewalPeriod
      if (newAssignee) existing.newAssignee = newAssignee
    }
  }

  console.log(`3. Insertando ${contractsMap.size} contratos físicos / unidades...`)
  const contractIdMap = new Map<string, string>() // key -> DB ID

  // Insertar contratos de forma transaccional o secuencial rápida
  for (const [key, cData] of contractsMap.entries()) {
    const created = await prisma.rentalContract.create({
      data: cData,
    })
    contractIdMap.set(key, created.id)
  }
  console.log(`✓ ${contractIdMap.size} contratos creados con éxito.`)

  // 5. Preparar Vouchers
  console.log(`4. Preparando vouchers a partir de ${rows.length} filas...`)
  const vouchersData: any[] = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const building = String(r['EDIFICIO'] || '').trim().toUpperCase()
    if (!building) continue

    const storageNo = String(r['BODEGA N°'] || r['BODEGA'] || '').trim() || null
    const parkingNo = String(r['ESTACIONAMIENTO N°'] || r['ESTACIONAMIENTO'] || '').trim() || null
    let unitNo = String(r['N°'] || r['N° UNIDAD'] || '').trim()
    if (!unitNo) {
      if (storageNo) unitNo = `B-${storageNo}`
      else if (parkingNo) unitNo = `E-${parkingNo}`
      else unitNo = `U-${i + 1}`
    }

    const key = `${building}|${unitNo.toUpperCase()}`
    const contractId = contractIdMap.get(key)
    if (!contractId) continue

    const rawEmp = String(r['EMPRESA'] || '').trim()
    const rawNom = String(r['NOMBRE EMPRESA'] || '').trim()
    const companyId = resolveCompanyId(rawEmp, rawNom)

    const month = String(r['MES'] || 'ENERO').trim().toUpperCase()
    const year = parseNum(r['AÑO']) || 2026
    const receiptNumber = String(r['N° RECIBO'] || '').trim() || null
    const invoiceNumber = String(r['FACTURA'] || '').trim() || null

    const baseRent = parseNum(r['ARRIENDO 2026'] || r['ARRIENDO BASE'] || 0)
    const adjustmentPercent = parseNum(r['% REAJUSTE'])
    const adjustmentAmount = parseNum(r['REAJUSTE'])
    const totalRent = parseNum(r['VALOR T']) || (baseRent + adjustmentAmount)
    const totalMonth = parseNum(r['TOTAL']) || totalRent
    const guaranteeAmount = parseNum(r['GARANT']) || null
    const expensesCharge = parseNum(r['GASTOS COMUNES CARGO']) || null
    const expensesPayment = parseNum(r['GASTOS COMUNES ABONO']) || null
    const previousRent = parseNum(r['ARRIENDO 20252'] || r['ARRIENDO ANTERIOR']) || null

    const paymentDate = parseDate(r['FECHA PAGO'] || r['FECHA INGRESO'])
    const transferAmount = parseNum(r['TRANSFERENCIA'])
    const cashAmount = parseNum(r['EFECTIVO'])
    const depositAmount = parseNum(r['DEPOSITO'])
    const accountsReceivable = parseNum(r['CUENTAS X COBRAR'])
    const collectedAmount = parseNum(r['RECAUDACIÓN']) || (transferAmount + cashAmount + depositAmount)
    const pendingBalance = parseNum(r['SALDO PENDIENTE'])
    const bank = String(r['BANCO'] || '').trim() || null

    // Notas o comentarios (incluyendo si la columna EMPRESA traía notas como 'CANCELADO EN FEBRERO')
    let comment = String(r['COMENTARIO'] || r['COMENTARIOS'] || '').trim()
    if (rawEmp && !companyMap.has(rawEmp.toUpperCase()) && rawEmp.length > 3) {
      comment = comment ? `${rawEmp} - ${comment}` : rawEmp
    }

    const rawPaymentStatus = String(r['ESTADO PAGO'] || '').trim()
    let paymentStatus = 'Pendiente'
    if (paymentDate || transferAmount > 0 || cashAmount > 0 || depositAmount > 0 || collectedAmount >= totalMonth && totalMonth > 0) {
      paymentStatus = 'Pagado'
    } else if (rawPaymentStatus) {
      paymentStatus = rawPaymentStatus
    } else if (String(r['ESTADO'] || '').toLowerCase() === 'disponible') {
      paymentStatus = 'Disponible'
    }

    let paymentMethod = 'Transferencia'
    if (cashAmount > 0 && transferAmount === 0) paymentMethod = 'Efectivo'
    else if (depositAmount > 0 && transferAmount === 0) paymentMethod = 'Depósito'

    vouchersData.push({
      contractId,
      companyId,
      month,
      year,
      receiptNumber,
      invoiceNumber,
      baseRent,
      adjustmentPercent,
      adjustmentAmount,
      totalRent,
      guaranteeAmount,
      expensesCharge,
      expensesPayment,
      previousRent,
      totalMonth,
      paymentStatus,
      paymentDate,
      transferAmount,
      cashAmount,
      depositAmount,
      accountsReceivable,
      collectedAmount,
      bank,
      pendingBalance,
      comment: comment || null,
      paymentMethod,
    })
  }

  console.log(`5. Insertando masivamente ${vouchersData.length} vouchers en lotes...`)
  const BATCH_SIZE = 400
  let insertedVouchers = 0
  for (let i = 0; i < vouchersData.length; i += BATCH_SIZE) {
    const batch = vouchersData.slice(i, i + BATCH_SIZE)
    const res = await prisma.leaseVoucher.createMany({
      data: batch,
    })
    insertedVouchers += res.count
    console.log(`   Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${res.count} vouchers insertados (Total: ${insertedVouchers})`)
  }

  // 6. Resumen de verificación
  console.log('\n--- VERIFICACIÓN FINAL ---')
  const totalContracts = await prisma.rentalContract.count()
  const totalVouchers = await prisma.leaseVoucher.count()
  console.log(`Total Contratos en BD: ${totalContracts}`)
  console.log(`Total Vouchers en BD: ${totalVouchers}`)

  const monthSummary = await prisma.leaseVoucher.groupBy({
    by: ['month'],
    _count: { id: true },
    _sum: { collectedAmount: true, totalMonth: true },
    orderBy: { month: 'asc' },
  })

  console.log('\nDistribución mensual:')
  for (const m of monthSummary) {
    console.log(`- ${m.month}: ${m._count.id} vouchers | Facturado: $${(m._sum.totalMonth || 0).toLocaleString('es-CL')} | Recaudado: $${(m._sum.collectedAmount || 0).toLocaleString('es-CL')}`)
  }

  const statusSummary = await prisma.leaseVoucher.groupBy({
    by: ['paymentStatus'],
    _count: { id: true },
  })
  console.log('\nDistribución de estados de pago:')
  for (const s of statusSummary) {
    console.log(`- ${s.paymentStatus}: ${s._count.id} vouchers`)
  }
}

run()
  .then(() => {
    console.log('\n✓ IMPORTACIÓN COMPLETADA EXITOSAMENTE.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n✗ Error durante la importación:', err)
    process.exit(1)
  })
