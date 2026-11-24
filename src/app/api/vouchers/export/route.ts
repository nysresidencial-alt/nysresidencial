import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  // 1. Proteger ruta: solo administradores autenticados con rol Contabilidad o Superadmin
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    return NextResponse.json(
      { error: 'Acceso no autorizado: Solo el rol de Contabilidad puede exportar estos datos' },
      { status: 403 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const month = searchParams.get('month') // ej: "OCTUBRE" o "TODOS"
  const yearStr = searchParams.get('year')
  const building = searchParams.get('building')
  const companyCode = searchParams.get('company')

  const year = yearStr ? parseInt(yearStr, 10) : 2026

  // 2. Construir filtros de consulta
  const whereClause: any = { year }

  if (month && month !== 'TODOS') {
    whereClause.month = month.toUpperCase()
  }

  if (building && building !== 'TODOS') {
    whereClause.contract = { building: building.toUpperCase() }
  }

  if (companyCode && companyCode !== 'TODOS') {
    whereClause.company = { code: companyCode.toUpperCase() }
  }

  try {
    const vouchers = await prisma.leaseVoucher.findMany({
      where: whereClause,
      include: {
        contract: {
          include: { company: true },
        },
        company: true,
      },
      orderBy: [
        { month: 'asc' },
        { contract: { building: 'asc' } },
        { contract: { unitNumber: 'asc' } },
      ],
    })

    // 3. Mapear datos a filas de Excel idénticas a la planilla maestra de Hoja1
    const excelRows = vouchers.map((v) => {
      const c = v.contract
      const comp = v.company || c.company

      let epagoVal = ''
      const statusUpper = (v.paymentStatus || '').trim().toUpperCase()
      if (statusUpper === 'PAGADO') epagoVal = 'PAGADO'
      else if (statusUpper === 'PENDIENTE') epagoVal = 'PENDIENTE'
      else if (statusUpper === 'ERROR') epagoVal = 'Error'
      else epagoVal = v.paymentStatus || ''

      return {
        'EMPRESA': comp?.code || '',
        'NOMBRE EMPRESA': comp?.name || '',
        'Nuevo asignatario': c.newAssignee || '',
        'RUT PROPIETARIO': c.assigneeRut || comp?.rut || '',
        'MES': v.month,
        'N° RECIBO': v.receiptNumber || '',
        'FACTURA': v.invoiceNumber || '',
        'ESTADO': c.status,
        'TIPO INMUEBLE': c.propertyType,
        'ROL': c.rol || '',
        'EDIFICIO': c.building,
        'N°': c.unitNumber,
        'BODEGA N°': c.storageNumber || '',
        'ESTACIONAMIENTO N°': c.parkingNumber || '',
        'FECHA CONTRATO': c.contractDate || '',
        'RENOVACIÓN ': c.renewalPeriod || '',
        'ARRIENDO 2026': v.baseRent || '',
        '% REAJUSTE': v.adjustmentPercent || '',
        'REAJUSTE': v.adjustmentAmount || '',
        'VALOR T': v.totalRent || '',
        'ARRIENDO 20262': c.previousRent || '',
        'GARANT': v.guaranteeAmount || '',
        'TOTAL PARCIAL': v.totalRent || '',
        'GASTO COMUN2': v.expensesCharge || '',
        'TOTAL FINAL': v.totalMonth || '',
        'FECHA INGRESO': v.paymentDate || '',
        'TRANSFERENCIA': v.transferAmount || '',
        'EFECTIVO': v.cashAmount || '',
        'CUENTAS X COBRAR': v.accountsReceivable || '',
        'DEPOSITO': v.depositAmount || '',
        'RECAUDACIÓN': v.collectedAmount || '',
        'BANCO': v.bank || '',
        'SALDO PENDIENTE': v.pendingBalance || '',
        'COMENTARIO': v.comment || '',
        'Columna1': '',
        'ARRENDATARIO': c.tenantName || '',
        'TELÉFONO ARRENDATARIO': c.tenantPhone || '',
        'CORREO': c.tenantEmail || '',
        'OTROS DATOS DE CONTACTO': c.otherContactInfo || '',
        'RELACIÓN CON ARRENDATARIO': c.guarantorRelation || '',
        'TELÉFONO CONTACTO': c.guarantorPhone || '',
        'CORREO ': c.guarantorEmail || '',
        'EPAGO': epagoVal,
      }
    })

    // 4. Crear libro Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelRows)

    // Configurar ancho de columnas automático
    const colWidths = Object.keys(excelRows[0] || {}).map((key) => ({
      wch: Math.max(key.length + 3, 14),
    }))
    ws['!cols'] = colWidths

    const sheetName = month && month !== 'TODOS' ? `Arriendos_${month}` : 'Arriendos_Historico'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Generar buffer en formato XLSX
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const filename = `NYS_Liquidaciones_${month || 'Historico'}_${year}.xlsx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating Excel export:', error)
    return NextResponse.json({ error: error.message || 'Error al exportar' }, { status: 500 })
  }
}
