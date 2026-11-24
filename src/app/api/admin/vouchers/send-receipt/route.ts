import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import nodemailer from 'nodemailer'
import { getEmailConfig } from '@/lib/email-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  // 1. Validar autenticación de administrador (Contabilidad o Superadmin)
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    return NextResponse.json(
      { error: 'Acceso no autorizado: Solo el rol de Contabilidad puede despachar comprobantes' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const {
      voucherId,
      pdfBase64,
      receiptNumber,
      tenantName,
      tenantEmail,
      building,
      unitNumber,
      month,
      year,
      totalAmount,
      paymentDate,
    } = body

    if (!pdfBase64) {
      return NextResponse.json({ error: 'Falta el archivo PDF del comprobante' }, { status: 400 })
    }

    // 2. Obtener configuración dinámica y determinar destinatario según el modo test
    const config = await getEmailConfig()
    const isTestMode = config.isTestMode
    let targetEmail: string

    if (isTestMode) {
      // Modo de prueba activo: se envía a la casilla de pruebas designada
      targetEmail = (body.targetEmail?.trim() || config.testEmail || 'administracion@sunrisechile.cl').trim().toLowerCase()
    } else {
      // Modo clientes reales (Producción)
      const cleanTenantEmail = tenantEmail?.trim()?.toLowerCase()
      if (!cleanTenantEmail || !cleanTenantEmail.includes('@')) {
        // Si el cliente no tiene dirección de correo, simplemente no se envía
        return NextResponse.json({
          success: true,
          skipped: true,
          message: 'El arrendatario no tiene correo registrado; se omitió el envío automáticamente.',
        })
      }
      targetEmail = cleanTenantEmail
    }

    const cleanReceipt = receiptNumber && receiptNumber !== 'S/N' ? receiptNumber : 'S/N'
    const formattedAmount = Number(totalAmount || 0).toLocaleString('es-CL')
    const fileName = `Recibo_Arriendo_N${cleanReceipt}_${(building || 'Inmueble').replace(/\s+/g, '_')}_${(unitNumber || '').replace(/\s+/g, '_')}.pdf`

    // Convertir el base64 a Buffer eliminando cualquier prefijo de Data URL
    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64
    const pdfBuffer = Buffer.from(cleanBase64, 'base64')

    // 3. Reemplazos dinámicos en la plantilla de correo
    const replaceVars = (text: string) => {
      return (text || '')
        .replace(/{RECIBO}/g, cleanReceipt)
        .replace(/{EDIFICIO}/g, building || '')
        .replace(/{UNIDAD}/g, unitNumber || '')
        .replace(/{MES}/g, month || '')
        .replace(/{ANO}/g, String(year || ''))
        .replace(/{ARRENDATARIO}/g, tenantName || '')
        .replace(/{MONTO}/g, formattedAmount)
        .replace(/{FECHA}/g, paymentDate || new Date().toLocaleDateString('es-CL'))
    }

    const subject = replaceVars(config.subject)
    const introHtml = replaceVars(config.introMessage).replace(/\n/g, '<br/>')
    const footerNoteHtml = replaceVars(config.footerNote)
    const companyFooterHtml = (config.companyFooter || '').replace(/\n/g, '<br/>')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; margin: 0; padding: 24px; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #18181b; color: #ffffff; padding: 28px 32px; text-align: left; }
          .header h1 { margin: 0 0 6px; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 0; font-size: 13px; color: #a1a1aa; }
          .content { padding: 32px; font-size: 13px; line-height: 1.6; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #64748b; font-weight: 600; }
          .info-val { color: #0f172a; font-weight: 700; text-align: right; }
          .stamp-paid { display: inline-block; background: #ecfdf5; border: 2px solid #10b981; color: #047857; font-weight: 900; font-size: 13px; letter-spacing: 1px; padding: 6px 14px; border-radius: 8px; margin-top: 12px; }
          .footer { background: #fafafa; border-top: 1px solid #e4e4e7; padding: 20px 32px; font-size: 12px; color: #71717a; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.companyHeader}</h1>
            <p>${config.companySubtitle}</p>
          </div>
          <div class="content">
            <p style="color: #334155; line-height: 1.6; margin-top: 0;">${introHtml}</p>

            <div class="info-box">
              <div class="info-row">
                <span class="info-label">N° de Recibo:</span>
                <span class="info-val">#${cleanReceipt}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Propiedad:</span>
                <span class="info-val">${building} - Unidad ${unitNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Periodo:</span>
                <span class="info-val">${month} ${year}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de Pago Acreditada:</span>
                <span class="info-val">${paymentDate || 'Acreditado'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Monto Recaudado:</span>
                <span class="info-val" style="color: #059669; font-size: 15px;">$${formattedAmount} CLP</span>
              </div>
            </div>

            <div style="text-align: center; margin: 24px 0 12px;">
              <span class="stamp-paid">✓ PAGO REGISTRADO Y ACREDITADO</span>
            </div>

            <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin-top: 24px; text-align: center;">
              ${footerNoteHtml}
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0; line-height: 1.5; color: #71717a;">${companyFooterHtml}</p>
          </div>
        </div>
      </body>
      </html>
    `

    // 4. Envío por Nodemailer si existen credenciales SMTP configuradas
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"NyS Arriendos" <${smtpUser}>`,
        to: targetEmail,
        subject,
        html: htmlContent,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      })

      return NextResponse.json({
        success: true,
        sentTo: targetEmail,
        messageId: info.messageId,
        isTestMode,
        fileName,
      })
    }

    // 5. Si aún no se configuran credenciales SMTP en .env, registramos la preparación exitosa
    console.log(`[CORREO PREPARADO] Modo test: ${isTestMode ? 'SI' : 'NO'} | Destino: ${targetEmail}`)
    console.log(`[CORREO PREPARADO] Asunto: ${subject}`)
    console.log(`[CORREO PREPARADO] Archivo adjunto: ${fileName} (${pdfBuffer.length} bytes)`)

    return NextResponse.json({
      success: true,
      simulated: true,
      sentTo: targetEmail,
      isTestMode,
      fileName,
      message: `Comprobante generado y preparado con éxito para ${targetEmail}`,
    })
  } catch (error: any) {
    console.error('Error al enviar correo del comprobante:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al procesar el envío del correo' },
      { status: 500 }
    )
  }
}
