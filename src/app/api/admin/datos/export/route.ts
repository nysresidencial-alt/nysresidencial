import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import * as XLSX from 'xlsx'

const MONTH_ORDER: Record<string, number> = {
  ENERO: 1,
  FEBRERO: 2,
  MARZO: 3,
  ABRIL: 4,
  MAYO: 5,
  JUNIO: 6,
  JULIO: 7,
  AGOSTO: 8,
  SEPTIEMBRE: 9,
  OCTUBRE: 10,
  NOVIEMBRE: 11,
  DICIEMBRE: 12,
}

export async function GET(request: NextRequest) {
  // 1. Proteger ruta: administradores autenticados con rol Contabilidad o Superadmin
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
  const isTemplateOnly = searchParams.get('template') === 'true'

  try {
    const companies = await prisma.ownerCompany.findMany({
      orderBy: { code: 'asc' },
    })

    let dataRows: any[] = []

    if (isTemplateOnly) {
      // 2 filas modelo para la plantilla limpia, reflejando exactamente las 42 columnas oficiales
      dataRows = [
        {
          'EMPRESA': 'BC',
          'NOMBRE EMPRESA': 'Buses Cipreses',
          'Nuevo asignatario': 'José Manuel Retamal',
          'MES': 'NOVIEMBRE',
          'N° RECIBO': '990',
          'FACTURA': '905',
          'ESTADO': 'Ocupado',
          'TIPO INMUEBLE': 'Departamento',
          'ROL': '1193-213',
          'EDIFICIO': 'AMALFI',
          'N°': '1511',
          'BODEGA N°': 'B-12',
          'ESTACIONAMIENTO N°': 'E-45',
          'FECHA CONTRATO': '2024-03-01',
          'RENOVACIÓN ': '1 AÑO',
          'ARRIENDO 2026': 450000,
          '% REAJUSTE': 0.035,
          'REAJUSTE': 15750,
          'VALOR T': 465750,
          'ARRIENDO 20262': 450000,
          'GARANT': 450000,
          'TOTAL PARCIAL': 465750,
          'GASTO COMUN2': 0,
          'TOTAL FINAL': 465750,
          'FECHA INGRESO': '2026-11-05',
          'TRANSFERENCIA': 465750,
          'EFECTIVO': 0,
          'CUENTAS X COBRAR': 0,
          'DEPOSITO': 0,
          'RECAUDACIÓN': 465750,
          'BANCO': 'SANTANDER',
          'SALDO PENDIENTE': 0,
          'COMENTARIO': 'Al día en cartola bancaria',
          'Columna1': '',
          'ARRENDATARIO': 'Juan Pérez González',
          'TELÉFONO ARRENDATARIO': '+56 9 87654321',
          'CORREO': 'juan.perez@gmail.com',
          'OTROS DATOS DE CONTACTO': 'Contacto adicional',
          'RELACIÓN CON ARRENDATARIO': 'Aval',
          'TELÉFONO CONTACTO': '+56 9 12345678',
          'CORREO ': 'aval.perez@gmail.com',
          'EPAGO': 'PAGADO',
        },
        {
          'EMPRESA': 'JR',
          'NOMBRE EMPRESA': 'Jose Retamal',
          'Nuevo asignatario': '',
          'MES': 'NOVIEMBRE',
          'N° RECIBO': '',
          'FACTURA': '',
          'ESTADO': 'Disponible',
          'TIPO INMUEBLE': 'Estacionamiento',
          'ROL': '491-022',
          'EDIFICIO': 'LIBERTADOR',
          'N°': 'EST-154',
          'BODEGA N°': '',
          'ESTACIONAMIENTO N°': '154',
          'FECHA CONTRATO': '',
          'RENOVACIÓN ': '',
          'ARRIENDO 2026': 40000,
          '% REAJUSTE': 0,
          'REAJUSTE': 0,
          'VALOR T': 40000,
          'ARRIENDO 20262': '',
          'GARANT': '',
          'TOTAL PARCIAL': 40000,
          'GASTO COMUN2': '',
          'TOTAL FINAL': 40000,
          'FECHA INGRESO': '',
          'TRANSFERENCIA': '',
          'EFECTIVO': '',
          'CUENTAS X COBRAR': '',
          'DEPOSITO': '',
          'RECAUDACIÓN': '',
          'BANCO': '',
          'SALDO PENDIENTE': 0,
          'COMENTARIO': 'Disponible para arriendo',
          'Columna1': '',
          'ARRENDATARIO': '',
          'TELÉFONO ARRENDATARIO': '',
          'CORREO': '',
          'OTROS DATOS DE CONTACTO': '',
          'RELACIÓN CON ARRENDATARIO': '',
          'TELÉFONO CONTACTO': '',
          'CORREO ': '',
          'EPAGO': '',
        },
      ]
    } else {
      // Exportación de toda la base de datos real con todas sus liquidaciones
      const vouchers = await prisma.leaseVoucher.findMany({
        include: {
          contract: {
            include: { company: true },
          },
          company: true,
        },
      })

      // Ordenar cronológicamente por mes y luego por edificio y unidad
      vouchers.sort((a, b) => {
        const mA = MONTH_ORDER[a.month?.toUpperCase()] || 99
        const mB = MONTH_ORDER[b.month?.toUpperCase()] || 99
        if (mA !== mB) return mA - mB
        const bComp = (a.contract.building || '').localeCompare(b.contract.building || '')
        if (bComp !== 0) return bComp
        return (a.contract.unitNumber || '').localeCompare(b.contract.unitNumber || '')
      })

      dataRows = vouchers.map((v) => {
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
    }

    // 2. Hoja de instrucciones y catálogos válidos
    const instructionRows = [
      {
        'CAMPO': 'EMPRESA',
        'DESCRIPCIÓN': 'Código de la empresa propietaria.',
        'VALORES VÁLIDOS': companies.map((c) => `${c.code} (${c.name})`).join(', ') || 'JR, BC, GP, JFR, RB, AMB, CANDY, ADL, GOLY, IC, NYS',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'EPAGO',
        'DESCRIPCIÓN': 'Estado del pago para el mes.',
        'VALORES VÁLIDOS': 'PAGADO (si se recibió el arriendo), PENDIENTE (por cobrar), o dejar vacío ("") si la propiedad está vacante/disponible.',
        'OBLIGATORIO': 'Recomendado',
      },
      {
        'CAMPO': 'N° RECIBO',
        'DESCRIPCIÓN': 'Número correlativo oficial de comprobante de arriendo emitido.',
        'VALORES VÁLIDOS': 'Numérico (si ya existe un número se respeta; si está vacío el sistema le asigna el siguiente mayor + 1).',
        'OBLIGATORIO': 'Opcional',
      },
      {
        'CAMPO': 'FACTURA',
        'DESCRIPCIÓN': 'Número de factura comercial emitida al arrendatario.',
        'VALORES VÁLIDOS': 'Texto / Numérico (ej: 905, 505)',
        'OBLIGATORIO': 'Opcional',
      },
      {
        'CAMPO': 'MES',
        'DESCRIPCIÓN': 'Mes correspondiente a la cobranza.',
        'VALORES VÁLIDOS': 'ENERO, FEBRERO, MARZO, ABRIL, MAYO, JUNIO, JULIO, AGOSTO, SEPTIEMBRE, OCTUBRE, NOVIEMBRE, DICIEMBRE',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'FECHA INGRESO',
        'DESCRIPCIÓN': 'Fecha real en que se registró el pago en cartola bancaria.',
        'VALORES VÁLIDOS': 'Formato YYYY-MM-DD o DD/MM/YYYY (dejar vacío si está pendiente)',
        'OBLIGATORIO': 'Opcional',
      },
      {
        'CAMPO': 'BANCO',
        'DESCRIPCIÓN': 'Banco o cuenta receptora de la recaudación.',
        'VALORES VÁLIDOS': 'SANTANDER, ITAU, BANCOESTADO, BCI, etc.',
        'OBLIGATORIO': 'Opcional',
      },
      {
        'CAMPO': 'EDIFICIO',
        'DESCRIPCIÓN': 'Nombre del edificio o condominio.',
        'VALORES VÁLIDOS': 'AMALFI, LIBERTADOR, COSTA AZUL, PAZ, SAN FCO, MARBELLA, etc.',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'N°',
        'DESCRIPCIÓN': 'Número de unidad (departamento, local, casa, bodega o estacionamiento).',
        'VALORES VÁLIDOS': 'Texto (ej: 1511, E-502, EST-154, BOD-74)',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'ESTADO',
        'DESCRIPCIÓN': 'Estado contractual de la propiedad.',
        'VALORES VÁLIDOS': 'Ocupado, Disponible, Vendido, En Retiro',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'ARRENDATARIO',
        'DESCRIPCIÓN': 'Nombre del arrendatario o empresa inquilina.',
        'VALORES VÁLIDOS': 'Texto (o dejar vacío si es propiedad disponible)',
        'OBLIGATORIO': 'Sí',
      },
    ]

    // 3. Generar libro Excel binario
    const wb = XLSX.utils.book_new()

    // Hoja principal: nombrada "Hoja1" para máxima compatibilidad con el importador
    const wsMain = XLSX.utils.json_to_sheet(dataRows)
    const colWidths = Object.keys(dataRows[0] || {}).map((key) => ({
      wch: Math.max(key.length + 3, 14),
    }))
    wsMain['!cols'] = colWidths
    XLSX.utils.book_append_sheet(wb, wsMain, 'Hoja1')

    // Hoja 2: PROPIETARIOS Y ASIGNATARIOS
    try {
      const owners = await prisma.propertyOwner.findMany({ orderBy: { name: 'asc' } })
      const ownersRows = owners.map((o) => ({
        'PROPIETARIO / ASIGNATARIO': o.name,
        'RUT OFICIAL': o.rut || '',
        'TIPO': o.isCompany ? 'Empresa' : 'Nuevo Asignatario',
        'EMPRESA ASOCIADA': o.companyName || '',
        'CÓDIGO': o.companyCode || '',
        'TELÉFONO': o.phone || '',
        'CORREO': o.email || '',
        'DIRECCIÓN': o.address || '',
        'OBSERVACIONES': o.notes || '',
      }))
      const wsOwners = XLSX.utils.json_to_sheet(ownersRows)
      wsOwners['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 10 }, { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 30 }]
      XLSX.utils.book_append_sheet(wb, wsOwners, 'PROPIETARIOS')
    } catch (ownerErr) {
      console.error('Error exportando hoja de propietarios:', ownerErr)
    }

    // Hoja secundaria: GUIA DE LLENADO
    const wsInstructions = XLSX.utils.json_to_sheet(instructionRows)
    wsInstructions['!cols'] = [{ wch: 18 }, { wch: 45 }, { wch: 65 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'GUIA DE LLENADO')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = isTemplateOnly
      ? 'Plantilla_Oficial_NyS_Arriendos.xlsx'
      : `Base_Datos_Completa_NyS_Arriendos_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('Error exportando datos a Excel:', err)
    return NextResponse.json(
      { error: err.message || 'Error al exportar los datos a Excel' },
      { status: 500 }
    )
  }
}
