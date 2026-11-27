import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import * as XLSX from 'xlsx'
import { analyzeContractRenewal } from '@/lib/contract-renewals'

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    return NextResponse.json(
      { error: 'Acceso no autorizado: Módulo exclusivo para Contabilidad' },
      { status: 403 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const filterBuilding = searchParams.get('building') || 'TODOS'
  const filterCompany = searchParams.get('company') || 'TODOS'
  const filterStatus = searchParams.get('status') || 'TODOS'

  try {
    const contracts = await prisma.rentalContract.findMany({
      where: {
        status: 'Ocupado',
        isOwnerActive: true,
      },
      include: {
        company: true,
      },
      orderBy: [
        { building: 'asc' },
        { unitNumber: 'asc' },
      ],
    })

    const rows = contracts
      .map((c) => {
        const analysis = analyzeContractRenewal(
          c.contractDate,
          c.renewalPeriod,
          new Date(),
          c.autoRenewal,
          c.noticeDays ?? 30
        )

        // Filtro por edificio
        if (filterBuilding !== 'TODOS' && c.building.toUpperCase() !== filterBuilding.toUpperCase()) {
          return null
        }

        // Filtro por empresa
        if (filterCompany !== 'TODOS') {
          const compCode = (c.company?.code || '').toUpperCase()
          const compName = (c.company?.name || '').toUpperCase()
          if (compCode !== filterCompany.toUpperCase() && compName !== filterCompany.toUpperCase()) {
            return null
          }
        }

        // Filtro por estado de renovación
        if (filterStatus !== 'TODOS') {
          if (filterStatus === 'VENCIDO' && analysis.status !== 'VENCIDO') return null
          if (filterStatus === 'POR_VENCER' && analysis.status !== 'POR_VENCER') return null
          if (filterStatus === 'VIGENTE' && analysis.status !== 'VIGENTE') return null
          if (filterStatus === 'INCOMPLETO' && analysis.status !== 'INCOMPLETO') return null
          if (filterStatus === 'INDEFINIDO' && analysis.status !== 'INDEFINIDO') return null
        }

        const totalRent = Math.round(c.totalRent || (c.baseRent + c.adjustmentAmount) || c.baseRent || 0)

        return {
          'ESTADO CONTRATO': analysis.statusLabel,
          'RENOVACIÓN AUTOMÁTICA': c.autoRenewal ? 'SÍ' : 'NO',
          'CICLO ACTUAL': c.autoRenewal ? `Ciclo ${analysis.cycleNumber}` : '1 (Plazo Fijo)',
          'DÍAS RESTANTES': analysis.daysRemaining !== null ? analysis.daysRemaining : '-',
          'DETALLE VIGENCIA': analysis.daysText,
          'PRÓXIMO VENCIMIENTO': analysis.expirationDateFormatted,
          'DÍAS AVISO PACTADOS': `${c.noticeDays ?? 30} DÍAS`,
          'FECHA LÍMITE AVISO': analysis.noticeDateFormatted,
          'INICIO ALERTA SISTEMA': analysis.alertStartDateFormatted,
          'FECHA CONTRATO INICIAL': analysis.contractDateFormatted,
          'PERÍODO RENOVACIÓN': c.renewalPeriod || 'SIN ESPECIFICAR',
          'EDIFICIO': c.building,
          'UNIDAD': c.unitNumber,
          'TIPO INMUEBLE': c.propertyType,
          'ARRENDATARIO': c.tenantName,
          'RUT ARRENDATARIO': c.tenantRut || 'Sin RUT',
          'TELÉFONO': c.tenantPhone || '-',
          'CORREO': c.tenantEmail || '-',
          'EMPRESA': c.company?.name || 'Inversiones NyS',
          'CÓDIGO EMPRESA': c.company?.code || '-',
          'PROPIETARIO / ASIGNATARIO': c.newAssignee || c.company?.name || '-',
          'VALOR ARRIENDO': totalRent,
          'REAJUSTE %': c.adjustmentPercentage || 0,
          'REAJUSTE $': Math.round(c.adjustmentAmount || 0),
          'ARRIENDO BASE': Math.round(c.baseRent || 0),
          'ROL': c.rol || '-',
          'DIRECCIÓN': c.address || '-',
          'BODEGA': c.storageNumber || '-',
          'ESTACIONAMIENTO': c.parkingNumber || '-',
        }
      })
      .filter(Boolean)

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Control Renovaciones')

    // Anchos de columna automáticos
    worksheet['!cols'] = [
      { wch: 18 }, // ESTADO CONTRATO
      { wch: 16 }, // DÍAS RESTANTES
      { wch: 22 }, // DETALLE VIGENCIA
      { wch: 20 }, // PRÓXIMO VENCIMIENTO
      { wch: 16 }, // FECHA CONTRATO
      { wch: 20 }, // PERÍODO RENOVACIÓN
      { wch: 18 }, // EDIFICIO
      { wch: 12 }, // UNIDAD
      { wch: 16 }, // TIPO
      { wch: 30 }, // ARRENDATARIO
      { wch: 14 }, // RUT
      { wch: 16 }, // TELÉFONO
      { wch: 28 }, // CORREO
      { wch: 20 }, // EMPRESA
      { wch: 14 }, // CÓDIGO
      { wch: 26 }, // ASIGNATARIO
      { wch: 16 }, // VALOR ARRIENDO
      { wch: 12 }, // REAJUSTE %
      { wch: 14 }, // REAJUSTE $
      { wch: 14 }, // BASE
      { wch: 12 }, // ROL
      { wch: 28 }, // DIRECCIÓN
      { wch: 10 }, // BODEGA
      { wch: 14 }, // ESTAC
    ]

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const todayStr = new Date().toISOString().split('T')[0]

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="control_renovaciones_${todayStr}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating Excel for contract renewals:', error)
    return NextResponse.json({ error: error.message || 'Error al exportar contratos' }, { status: 500 })
  }
}
