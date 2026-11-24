'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/lib/admin-auth'
import nodemailer from 'nodemailer'

async function checkAuth(action: 'view' | 'edit') {
  const session = await requireAdminAuth('vouchers', action)
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    throw new Error('Acceso no autorizado: Módulo exclusivo para el rol de Contabilidad')
  }
  return session
}

/**
 * Actualiza rápidamente el correo y teléfono de un arrendatario desde el directorio
 */
export async function updateTenantContact(
  contractId: string,
  data: { tenantEmail?: string; tenantPhone?: string }
) {
  await checkAuth('edit')

  try {
    const updated = await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        tenantEmail: data.tenantEmail !== undefined ? (data.tenantEmail.trim() ? data.tenantEmail.trim().toLowerCase() : null) : undefined,
        tenantPhone: data.tenantPhone !== undefined ? (data.tenantPhone.trim() ? data.tenantPhone.trim() : null) : undefined,
      },
    })

    revalidatePath('/admin/correos')
    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/arriendos')

    return { success: true, contract: updated }
  } catch (error: any) {
    console.error('Error al actualizar contacto del arrendatario:', error)
    return { error: error?.message || 'Error al actualizar el contacto' }
  }
}

export interface EmailConfigData {
  isTestMode: boolean
  testEmail: string
  subject: string
  companyHeader: string
  companySubtitle: string
  introMessage: string
  footerNote: string
  companyFooter: string
}

export const DEFAULT_EMAIL_CONFIG: EmailConfigData = {
  isTestMode: true,
  testEmail: 'administracion@sunrisechile.cl',
  subject: 'Comprobante de Pago Arriendo Nº {RECIBO} - {EDIFICIO} {UNIDAD} ({MES} {ANO})',
  companyHeader: 'NyS Negocios y Soluciones Inmobiliarias',
  companySubtitle: 'Comprobante Oficial de Pago de Arriendo',
  introMessage: 'Estimado(a) {ARRENDATARIO},\n\nConfirmamos la recepción de tu pago correspondiente al periodo de {MES} {ANO}. A continuación detallamos los datos de la operación:',
  footerNote: 'Se adjunta a este correo el Recibo Oficial de Arriendo timbrado con PAGADO en formato PDF (1 plana).',
  companyFooter: 'NyS Negocios y Soluciones Inmobiliarias / Administración Sunrise\n1 Sur Nº885, Talca | administracion@sunrisechile.cl',
}

/**
 * Obtiene la configuración de correo y plantilla activa almacenada en la base de datos
 */
export async function getEmailConfig(): Promise<EmailConfigData> {
  try {
    const record = await prisma.siteContent.findUnique({
      where: { key: 'email_config' },
    })

    if (record?.content) {
      const parsed = JSON.parse(record.content)
      return {
        ...DEFAULT_EMAIL_CONFIG,
        ...parsed,
      }
    }
  } catch (err) {
    console.error('Error cargando configuración de correo:', err)
  }
  return DEFAULT_EMAIL_CONFIG
}

/**
 * Guarda los cambios en la configuración del correo (modo test, casilla y textos de plantilla)
 */
export async function saveEmailConfig(
  data: Partial<EmailConfigData>
): Promise<{ success: boolean; config?: EmailConfigData; error?: string }> {
  await checkAuth('edit')

  try {
    const current = await getEmailConfig()
    const nextConfig: EmailConfigData = {
      ...current,
      ...data,
    }

    await prisma.siteContent.upsert({
      where: { key: 'email_config' },
      update: {
        title: 'Configuración de Correos y Plantillas',
        content: JSON.stringify(nextConfig),
      },
      create: {
        key: 'email_config',
        title: 'Configuración de Correos y Plantillas',
        content: JSON.stringify(nextConfig),
      },
    })

    revalidatePath('/admin/correos')
    return { success: true, config: nextConfig }
  } catch (err: any) {
    console.error('Error guardando configuración de correo:', err)
    return { success: false, error: err.message || 'Error al guardar la configuración' }
  }
}

/**
 * Dispara un correo de prueba interno directo para verificar la conectividad SMTP
 */
export async function sendTestEmailAction(targetEmail: string) {
  await checkAuth('view')

  const email = targetEmail.trim()
  if (!email || !email.includes('@')) {
    return { error: 'Ingresa un correo de destino válido' }
  }

  const config = await getEmailConfig()

  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465

  const subject = `[PRUEBA] ${config.subject
    .replace('{RECIBO}', '540')
    .replace('{EDIFICIO}', 'LIBERTADOR')
    .replace('{UNIDAD}', 'D-201')
    .replace('{MES}', 'NOVIEMBRE')
    .replace('{ANO}', '2026')}`

  const introTextHtml = config.introMessage
    .replace('{ARRENDATARIO}', 'Inés Urrutia Pinto')
    .replace('{MES}', 'Noviembre')
    .replace('{ANO}', '2026')
    .replace(/\n/g, '<br/>')

  const html = `
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
        .badge-mode { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 10px 14px; border-radius: 10px; font-size: 12px; margin-bottom: 20px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
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
          <div class="badge-mode">
            <strong>✉️ CORREO DE PRUEBA:</strong> Este mensaje fue generado para verificar el diseño y entrega del correo.
          </div>

          <p style="color: #334155; line-height: 1.6;">${introTextHtml}</p>

          <div class="info-box">
            <div class="info-row">
              <span class="info-label">N° de Recibo:</span>
              <span class="info-val">#540</span>
            </div>
            <div class="info-row">
              <span class="info-label">Propiedad:</span>
              <span class="info-val">LIBERTADOR - D-201</span>
            </div>
            <div class="info-row">
              <span class="info-label">Periodo:</span>
              <span class="info-val">Noviembre 2026</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Pago:</span>
              <span class="info-val">${new Date().toLocaleDateString('es-CL')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Monto Recaudado:</span>
              <span class="info-val" style="color: #059669; font-size: 15px;">$303.773 CLP</span>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0 10px;">
            <span class="stamp-paid">✓ PAGO REGISTRADO Y ACREDITADO</span>
          </div>

          <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin-top: 20px; text-align: center;">
            ${config.footerNote}
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0; white-space: pre-line;">${config.companyFooter}</p>
        </div>
      </div>
    </body>
    </html>
  `

  if (smtpHost && smtpUser && smtpPass) {
    try {
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
        from: `"NyS Notificaciones" <${process.env.SMTP_FROM || smtpUser}>`,
        to: email,
        subject,
        html,
      })

      return {
        success: true,
        realSent: true,
        messageId: info.messageId,
        message: `Correo real enviado exitosamente a ${email}`,
      }
    } catch (e: any) {
      console.error('Error al conectar con SMTP:', e)
      return { error: `Error SMTP: ${e.message}` }
    }
  }

  // Si no hay SMTP configurado todavía en .env
  return {
    success: true,
    realSent: false,
    message: `Prueba simulada correctamente para ${email}. Para recepción real en tu bandeja de entrada, se deben ingresar las credenciales SMTP en el archivo .env.`,
  }
}
