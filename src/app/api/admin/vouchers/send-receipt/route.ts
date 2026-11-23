import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import nodemailer from 'nodemailer'

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

    // 2. Destinatario en MARCHA BLANCA (Siempre al correo de la empresa / contabilidad)
    // Cuando el usuario defina pasar a producción, se envía directamente a tenantEmail
    const isProductionEmail = process.env.EMAIL_ENV === 'production'
    const companyEmail = process.env.COMPANY_TEST_EMAIL || 'administracion@sunrisechile.cl'
    const targetEmail = isProductionEmail && tenantEmail ? tenantEmail : companyEmail

    const cleanReceipt = receiptNumber && receiptNumber !== 'S/N' ? receiptNumber : 'S/N'
    const formattedAmount = Number(totalAmount || 0).toLocaleString('es-CL')
    const fileName = `Recibo_Arriendo_N${cleanReceipt}_${(building || 'Inmueble').replace(/\s+/g, '_')}_${(unitNumber || '').replace(/\s+/g, '_')}.pdf`

    // Convertir el base64 a Buffer eliminando cualquier prefijo de Data URL
    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64
    const pdfBuffer = Buffer.from(cleanBase64, 'base64')

    // 3. Plantilla de correo HTML profesional y corporativa
    const subject = !isProductionEmail
      ? `[MARCHA BLANCA] Recibo de Arriendo Nº ${cleanReceipt} - ${building} ${unitNumber} (${month} ${year})`
      : `Comprobante de Pago Arriendo Nº ${cleanReceipt} - ${building} ${unitNumber} (${month} ${year})`

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
          .content { padding: 32px; }
          .badge-test { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 14px 18px; border-radius: 12px; font-size: 13px; line-height: 1.5; margin-bottom: 24px; }
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
            <h1>NyS Negocios y Soluciones Inmobiliarias</h1>
            <p>Comprobante Oficial de Pago de Arriendo</p>
          </div>
          <div class="content">
            ${
              !isProductionEmail
                ? `
              <div class="badge-test">
                <strong>🛠️ MARCHA BLANCA - MODO PRUEBA INTERNA:</strong><br/>
                Este comprobante fue emitido automáticamente al registrar el pago en el sistema. En producción será despachado al arrendatario: <strong>${tenantName} &lt;${tenantEmail || 'Sin correo registrado'}&gt;</strong>.
              </div>
            `
                : `
              <p style="font-size: 15px; margin-top: 0;">Estimado(a) <strong>${tenantName}</strong>,</p>
              <p style="font-size: 13px; color: #52525b; line-height: 1.6;">
                Confirmamos la recepción de tu pago correspondiente al periodo de <strong>${month} ${year}</strong>. A continuación detallamos los datos de la operación:
              </p>
            `
            }

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
              Se adjunta a este correo el <strong>Recibo Oficial de Arriendo</strong> en formato PDF (1 plana) con el timbre de <strong>PAGADO</strong> y firma correspondiente.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 4px; font-weight: 700; color: #3f3f46;">NyS Negocios y Soluciones Inmobiliarias / Administración Sunrise</p>
            <p style="margin: 0;">1 Sur Nº885, Talca | administracion@sunrisechile.cl</p>
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
        from: `"NyS Arriendos" <${process.env.SMTP_FROM || smtpUser}>`,
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
        isMarchaBlanca: !isProductionEmail,
        fileName,
      })
    }

    // 5. Si aún no se configuran credenciales SMTP en .env, logueamos la simulación exitosa de marcha blanca
    console.log(`[MARCHA BLANCA] Correo preparado con PDF adjunto para: ${targetEmail}`)
    console.log(`[MARCHA BLANCA] Asunto: ${subject}`)
    console.log(`[MARCHA BLANCA] Archivo adjunto: ${fileName} (${pdfBuffer.length} bytes)`)

    return NextResponse.json({
      success: true,
      simulated: true,
      sentTo: targetEmail,
      isMarchaBlanca: !isProductionEmail,
      fileName,
      message: `Comprobante generado y preparado con éxito para ${targetEmail} (Marcha blanca activa)`,
    })
  } catch (error: any) {
    console.error('Error al enviar correo del comprobante:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al procesar el envío del correo' },
      { status: 500 }
    )
  }
}
