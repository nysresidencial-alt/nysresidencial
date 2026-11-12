import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as XLSX from 'xlsx'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const EXCEL_PATH = 'C:/Users/Luciano/.gemini/antigravity/brain/bbf6713c-3f07-4a32-a042-74c1009a46f4/.user_uploaded/media_1794512167578_927c5949.xlsx'

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
  return str || null
}

function parseNum(val: any): number {
  if (!val) return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const clean = String(val).replace(/[^0-9.-]+/g, '')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

function normalizeCompany(name: string): string {
  const n = (name || '').trim()
  if (n.toLowerCase() === 'jose retamal') return 'Jose Retamal'
  return n
}

async function main() {
  console.log('🚀 Iniciando re-seed definitivo con fechas y valores corregidos...')

  // 1. Cargar mapa de empresas en DB
  const companies = await prisma.ownerCompany.findMany()
  const companyMap = new Map<string, string>()
  for (const c of companies) {
    companyMap.set(c.name.toLowerCase(), c.id)
    companyMap.set(c.code.toLowerCase(), c.id)
    if (c.code === 'JR') companyMap.set('jose retamal', c.id)
    if (c.code === 'BC') companyMap.set('buses cipreses', c.id)
    if (c.code === 'GP') companyMap.set('grand prix', c.id)
    if (c.code === 'RB') companyMap.set('retamal y bustos', c.id)
    if (c.code === 'AMB') companyMap.set('amb', c.id)
    if (c.code === 'CANDY') companyMap.set('candy spa', c.id)
    if (c.code === 'NYS') companyMap.set('nys ltda', c.id)
  }

  // 2. Leer archivo Excel
  const wb = XLSX.readFile(EXCEL_PATH, { cellDates: true })
  const ws = wb.Sheets['BASE CONSOLIDADA']
  if (!ws) throw new Error('No se encontró la hoja BASE CONSOLIDADA')
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
  console.log(`📊 Total de filas leídas en BASE CONSOLIDADA: ${rows.length}`)

  // 3. Limpiar tablas previas (RentalContract y LeaseVoucher)
  console.log('🧹 Limpiando registros anteriores de LeaseVoucher y RentalContract...')
  await prisma.leaseVoucher.deleteMany({})
  await prisma.rentalContract.deleteMany({})
  console.log('✅ Tablas limpiadas con éxito.')

  // 4. Mapear e insertar
  // Mantenemos un mapa para no duplicar contratos si aparecen en múltiples meses (como filas de NOVIEMBRE)
  const contractCache = new Map<string, string>() // key -> contractId
  let createdContracts = 0
  let createdVouchers = 0

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx]
    const rawComp = normalizeCompany(r['NOMBRE EMPRESA'] || r['EMPRESA'] || r['Nuevo asignatario'])
    const companyId = companyMap.get(rawComp.toLowerCase()) || null

    const building = String(r['EDIFICIO'] || 'SIN EDIFICIO').trim()
    const storageNo = String(r['BODEGA N°'] || '').trim()
    const parkingNo = String(r['ESTACIONAMIENTO N°'] || '').trim()
    let unitNo = String(r['N°'] || '').trim()
    if (!unitNo) {
      if (storageNo) unitNo = `B-${storageNo}`
      else if (parkingNo) unitNo = `E-${parkingNo}`
      else unitNo = `U-${idx + 1}`
    }

    const tenantName = String(r['ARRENDATARIO'] || '').trim()
    const propertyType = String(r['TIPO INMUEBLE'] || 'Departamento').trim() || 'Departamento'
    const rol = String(r['ROL'] || '').trim()
    const rawStatus = String(r['ESTADO'] || '').trim()
    const status = (rawStatus.toLowerCase() === 'disponible' || (!tenantName && rawStatus !== 'Ocupado')) ? 'Disponible' : 'Ocupado'

    const contractDate = parseDate(r['FECHA CONTRATO'])
    const renewalPeriod = String(r['RENOVACIÓN'] || '').trim()
    const newAssignee = String(r['Nuevo asignatario'] || '').trim()

    // Valores
    const baseRent = parseNum(r['ARRIENDO 2026'])
    const adjustmentPercentage = parseNum(r['% REAJUSTE'])
    const adjustmentAmount = parseNum(r['REAJUSTE'])
    const valorT = parseNum(r['VALOR T']) || baseRent
    const totalMonth = parseNum(r['TOTAL']) || valorT
    const guaranteeAmount = parseNum(r['GARANT'])
    const expensesCharge = parseNum(r['GASTOS COMUNES CARGO'])
    const expensesPayment = parseNum(r['GASTOS COMUNES ABONO'])
    const previousRent = parseNum(r['ARRIENDO 20252'])

    // Contacto
    const tenantPhone = String(r['TELÉFONO ARRENDATARIO'] || '').trim()
    const tenantEmail = String(r['CORREO'] || '').trim()
    const otherContactInfo = String(r['OTROS DATOS DE CONTACTO'] || '').trim()
    const guarantorRelation = String(r['RELACIÓN CON ARRENDATARIO'] || '').trim()
    const guarantorPhone = String(r['TELÉFONO CONTACTO'] || '').trim()
    const guarantorEmail = String(r['CORREO_1'] || '').trim()

    // Clave única del contrato: compañía + edificio + unidad + tipo
    const contractKey = `${companyId || rawComp}|${building}|${unitNo}|${propertyType}|${tenantName}`.toLowerCase()

    let contractId = contractCache.get(contractKey)

    if (!contractId) {
      const contract = await prisma.rentalContract.create({
        data: {
          companyId,
          newAssignee: newAssignee || null,
          building,
          unitNumber: unitNo,
          propertyType,
          rol: rol || null,
          storageNumber: storageNo || null,
          parkingNumber: parkingNo || null,
          contractDate: contractDate || null,
          renewalPeriod: renewalPeriod || null,
          status,
          tenantName: tenantName || (status === 'Disponible' ? 'DISPONIBLE' : 'POR ASIGNAR'),
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
      contractId = contract.id
      contractCache.set(contractKey, contractId)
      createdContracts++
    }

    // Datos del Voucher
    const month = String(r['MES'] || 'OCTUBRE').trim().toUpperCase()
    const receiptNumber = String(r['N° RECIBO'] || '').trim()
    const invoiceNumber = String(r['FACTURA'] || '').trim()
    const paymentDate = parseDate(r['FECHA INGRESO'])

    const transferAmount = parseNum(r['TRANSFERENCIA'])
    const cashAmount = parseNum(r['EFECTIVO'])
    const depositAmount = parseNum(r['DEPOSITO'])
    const accountsReceivable = parseNum(r['CUENTAS X COBRAR'])
    const collectedAmount = parseNum(r['RECAUDACIÓN'])
    const pendingBalance = parseNum(r['SALDO PENDIENTE'])
    const bank = String(r['BANCO'] || '').trim()
    const comment = String(r['COMENTARIO'] || '').trim()

    // Determinación de paymentStatus
    let paymentStatus = 'Pendiente'
    if (status === 'Disponible' || (totalMonth === 0 && !tenantName)) {
      paymentStatus = 'Disponible'
    } else if (pendingBalance < -1) {
      paymentStatus = 'Saldo a Favor'
    } else if (Math.round(pendingBalance) === 0 && totalMonth > 0) {
      paymentStatus = 'Pagado'
    } else if (Math.round(pendingBalance) >= Math.round(totalMonth) || (pendingBalance > 0 && collectedAmount === 0)) {
      paymentStatus = 'Pendiente'
    } else if (pendingBalance > 0 && pendingBalance < totalMonth) {
      paymentStatus = 'Pendiente' // Abono parcial
    } else if (totalMonth === 0) {
      paymentStatus = 'Pagado'
    }

    await prisma.leaseVoucher.create({
      data: {
        contractId,
        companyId,
        month,
        year: 2026,
        receiptNumber: receiptNumber || null,
        invoiceNumber: invoiceNumber || null,
        baseRent,
        adjustmentPercent: adjustmentPercentage,
        adjustmentAmount,
        totalRent: valorT,
        guaranteeAmount: guaranteeAmount || null,
        expensesCharge: expensesCharge || null,
        expensesPayment: expensesPayment || null,
        previousRent: previousRent || null,
        totalMonth,
        paymentStatus,
        paymentDate: paymentDate || null,
        transferAmount,
        cashAmount,
        depositAmount,
        accountsReceivable,
        collectedAmount,
        bank: bank || null,
        pendingBalance,
        comment: comment || null,
        paymentMethod: cashAmount > 0 ? 'Efectivo' : depositAmount > 0 ? 'Depósito' : 'Transferencia',
      },
    })
    createdVouchers++
  }

  console.log(`\n🎉 Seed completado exitosamente:`)
  console.log(`- Contratos creados: ${createdContracts}`)
  console.log(`- Vouchers creados: ${createdVouchers}`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
