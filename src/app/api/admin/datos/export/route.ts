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
  const isTemplateOnly = searchParams.get('template') === 'true'

  try {
    // 2. Obtener datos de la BD si no es solo plantilla
    const companies = await prisma.ownerCompany.findMany({
      orderBy: { code: 'asc' },
    })

    const contracts = isTemplateOnly
      ? []
      : await prisma.rentalContract.findMany({
          include: {
            company: true,
            vouchers: {
              orderBy: [{ year: 'desc' }, { month: 'desc' }],
            },
          },
          orderBy: [
            { building: 'asc' },
            { unitNumber: 'asc' },
          ],
        })

    // 3. Crear filas para la hoja "BASE CONSOLIDADA" (estructura completa estándar)
    let consolidatedRows: any[] = []

    if (isTemplateOnly) {
      // 2 filas de ejemplo para plantilla vacía
      consolidatedRows = [
        {
          'EMPRESA': 'BC',
          'NOMBRE EMPRESA': 'Inversiones Buses Los Cipreses',
          'NUEVO ASIGNATARIO': 'José Manuel Retamal',
          'MES': 'NOVIEMBRE',
          'AÑO': 2026,
          'N° RECIBO': '14701',
          'FACTURA': '',
          'ESTADO': 'Ocupado',
          'TIPO INMUEBLE': 'Departamento',
          'ROL': '1193-213',
          'EDIFICIO': 'AMALFI',
          'N°': '1511',
          'BODEGA N°': 'B-12',
          'ESTACIONAMIENTO N°': 'E-45',
          'FECHA CONTRATO': '2024-03-01',
          'RENOVACIÓN': '1 AÑO',
          'ARRIENDO 2026': 450000,
          '% REAJUSTE': 3.5,
          'REAJUSTE': 15750,
          'VALOR T': 465750,
          'GARANT': 450000,
          'TOTAL': 465750,
          'GASTOS COMUNES CARGO': 0,
          'GASTOS COMUNES ABONO': 0,
          'ESTADO PAGO': 'Pagado',
          'FECHA PAGO': '2026-11-05',
          'TRANSFERENCIA': 465750,
          'EFECTIVO': 0,
          'DEPOSITO': 0,
          'CUENTAS X COBRAR': 0,
          'RECAUDACIÓN': 465750,
          'BANCO': 'SANTANDER',
          'SALDO PENDIENTE': 0,
          'COMENTARIO': 'Al día en cartola',
          'ARRENDATARIO': 'Juan Pérez González',
          'RUT ARRENDATARIO': '15.907.454-4',
          'TELÉFONO ARRENDATARIO': '+56 9 87654321',
          'CORREO': 'juan.perez@gmail.com',
          'OTROS DATOS DE CONTACTO': '',
          'RELACIÓN CON ARRENDATARIO': 'Aval',
          'TELÉFONO CONTACTO': '+56 9 12345678',
          'CORREO CONTACTO': 'aval.perez@gmail.com',
          'DIRECCIÓN INMUEBLE': '2 Sur 1285, Talca',
        },
        {
          'EMPRESA': 'JR',
          'NOMBRE EMPRESA': 'Jose Retamal',
          'NUEVO ASIGNATARIO': '',
          'MES': 'NOVIEMBRE',
          'AÑO': 2026,
          'N° RECIBO': '',
          'FACTURA': '',
          'ESTADO': 'Disponible',
          'TIPO INMUEBLE': 'Estacionamiento',
          'ROL': '491-022',
          'EDIFICIO': 'LIBERTADOR',
          'N°': 'E-154',
          'BODEGA N°': '',
          'ESTACIONAMIENTO N°': '154',
          'FECHA CONTRATO': '',
          'RENOVACIÓN': '',
          'ARRIENDO 2026': 40000,
          '% REAJUSTE': 0,
          'REAJUSTE': 0,
          'VALOR T': 40000,
          'GARANT': 0,
          'TOTAL': 40000,
          'GASTOS COMUNES CARGO': 0,
          'GASTOS COMUNES ABONO': 0,
          'ESTADO PAGO': 'Disponible',
          'FECHA PAGO': '',
          'TRANSFERENCIA': 0,
          'EFECTIVO': 0,
          'DEPOSITO': 0,
          'CUENTAS X COBRAR': 0,
          'RECAUDACIÓN': 0,
          'BANCO': '',
          'SALDO PENDIENTE': 0,
          'COMENTARIO': 'Vacante',
          'ARRENDATARIO': 'DISPONIBLE',
          'RUT ARRENDATARIO': '',
          'TELÉFONO ARRENDATARIO': '',
          'CORREO': '',
          'OTROS DATOS DE CONTACTO': '',
          'RELACIÓN CON ARRENDATARIO': '',
          'TELÉFONO CONTACTO': '',
          'CORREO CONTACTO': '',
          'DIRECCIÓN INMUEBLE': '1 Poniente 635, Talca',
        },
      ]
    } else {
      // Exportar datos reales consolidados
      consolidatedRows = contracts.map((c) => {
        const v = c.vouchers[0] || null
        const comp = c.company

        return {
          'EMPRESA': comp?.code || '',
          'NOMBRE EMPRESA': comp?.name || '',
          'NUEVO ASIGNATARIO': c.newAssignee || '',
          'MES': v?.month || 'NOVIEMBRE',
          'AÑO': v?.year || 2026,
          'N° RECIBO': v?.receiptNumber || '',
          'FACTURA': v?.invoiceNumber || '',
          'ESTADO': c.status,
          'TIPO INMUEBLE': c.propertyType,
          'ROL': c.rol || '',
          'EDIFICIO': c.building,
          'N°': c.unitNumber,
          'BODEGA N°': c.storageNumber || '',
          'ESTACIONAMIENTO N°': c.parkingNumber || '',
          'FECHA CONTRATO': c.contractDate || '',
          'RENOVACIÓN': c.renewalPeriod || '',
          'ARRIENDO 2026': c.baseRent || 0,
          '% REAJUSTE': c.adjustmentPercentage || 0,
          'REAJUSTE': c.adjustmentAmount || 0,
          'VALOR T': c.totalRent || c.baseRent || 0,
          'GARANT': c.guaranteeAmount || 0,
          'TOTAL': v?.totalMonth ?? (c.totalRent || c.baseRent || 0),
          'GASTOS COMUNES CARGO': c.expensesCharge || 0,
          'GASTOS COMUNES ABONO': c.expensesPayment || 0,
          'ESTADO PAGO': v?.paymentStatus ?? (c.status === 'Disponible' ? 'Disponible' : 'Pendiente'),
          'FECHA PAGO': v?.paymentDate || '',
          'TRANSFERENCIA': v?.transferAmount || 0,
          'EFECTIVO': v?.cashAmount || 0,
          'DEPOSITO': v?.depositAmount || 0,
          'CUENTAS X COBRAR': v?.accountsReceivable || 0,
          'RECAUDACIÓN': v?.collectedAmount || 0,
          'BANCO': v?.bank || '',
          'SALDO PENDIENTE': v?.pendingBalance || 0,
          'COMENTARIO': v?.comment || '',
          'ARRENDATARIO': c.tenantName || '',
          'RUT ARRENDATARIO': c.tenantRut || '',
          'TELÉFONO ARRENDATARIO': c.tenantPhone || '',
          'CORREO': c.tenantEmail || '',
          'OTROS DATOS DE CONTACTO': c.otherContactInfo || '',
          'RELACIÓN CON ARRENDATARIO': c.guarantorRelation || '',
          'TELÉFONO CONTACTO': c.guarantorPhone || '',
          'CORREO CONTACTO': c.guarantorEmail || '',
          'DIRECCIÓN INMUEBLE': c.address || '',
        }
      })
    }

    // 4. Hoja de instrucciones y catálogos válidos
    const instructionRows = [
      {
        'CAMPO': 'EMPRESA',
        'DESCRIPCIÓN': 'Código de la empresa propietaria.',
        'VALORES VÁLIDOS': companies.map((comp) => `${comp.code} (${comp.name})`).join(', ') || 'JR, BC, GP, JFR, RB, AMB',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'EDIFICIO',
        'DESCRIPCIÓN': 'Nombre del edificio o proyecto.',
        'VALORES VÁLIDOS': 'AMALFI, LIBERTADOR, COSTA AZUL, PASEO PEHUENCE, 19 SUR, etc.',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'N°',
        'DESCRIPCIÓN': 'Número de departamento, local, bodega o estacionamiento.',
        'VALORES VÁLIDOS': 'Texto (ej: 1511, E-502, B-12, Estac. 30)',
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
        'DESCRIPCIÓN': 'Nombre completo del arrendatario o DISPONIBLE.',
        'VALORES VÁLIDOS': 'Texto',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'MES',
        'DESCRIPCIÓN': 'Mes de la liquidación o voucher a generar.',
        'VALORES VÁLIDOS': 'ENERO, FEBRERO, MARZO, ABRIL, MAYO, JUNIO, JULIO, AGOSTO, SEPTIEMBRE, OCTUBRE, NOVIEMBRE, DICIEMBRE',
        'OBLIGATORIO': 'Sí',
      },
      {
        'CAMPO': 'FECHA PAGO',
        'DESCRIPCIÓN': 'Fecha real en que el arrendatario pagó en cartola (si ya pagó).',
        'VALORES VÁLIDOS': 'Formato YYYY-MM-DD o DD/MM/YYYY (dejar vacío si está pendiente)',
        'OBLIGATORIO': 'Opcional',
      },
    ]

    // 5. Generar archivo Excel binario
    const wb = XLSX.utils.book_new()

    // Hoja 1: BASE CONSOLIDADA
    const wsConsolidated = XLSX.utils.json_to_sheet(consolidatedRows)
    const colWidths = Object.keys(consolidatedRows[0] || {}).map((key) => ({
      wch: Math.max(key.length + 3, 14),
    }))
    wsConsolidated['!cols'] = colWidths
    XLSX.utils.book_append_sheet(wb, wsConsolidated, 'BASE CONSOLIDADA')

    // Hoja 2: GUIA DE LLENADO
    const wsInstructions = XLSX.utils.json_to_sheet(instructionRows)
    wsInstructions['!cols'] = [{ wch: 22 }, { wch: 45 }, { wch: 55 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'GUIA DE LLENADO')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = isTemplateOnly
      ? 'Plantilla_NyS_Propiedades_Vouchers.xlsx'
      : `Base_Datos_NyS_Arriendos_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('Error exportando base de datos a Excel:', err)
    return NextResponse.json(
      { error: err.message || 'Error al exportar los datos a Excel' },
      { status: 500 }
    )
  }
}
