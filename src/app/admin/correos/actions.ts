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

/**
 * Dispara un correo de prueba interno directo para verificar la conectividad SMTP
 */
export async function sendTestEmailAction(targetEmail: string) {
  await checkAuth('view')

  const email = targetEmail.trim()
  if (!email || !email.includes('@')) {
    return { error: 'Ingresa un correo de destino válido' }
  }

  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465

  const subject = `[PRUEBA] Verificación de Notificaciones - NyS Propiedades`
  const html = `
    <div style="font-family:sans-serif; max-width:550px; margin:0 auto; padding:24px; border:1px solid #e4e4e7; border-radius:12px;">
      <h2 style="color:#0f172a; margin-top:0;">Prueba de Conexión Exitosa ✉️</h2>
      <p style="color:#334155; line-height:1.5;">Este es un mensaje de prueba emitido desde el módulo de <strong>Correos y Notificaciones</strong> de NyS Administrador.</p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; margin:16px 0;">
        <p style="margin:4px 0; font-size:13px;"><strong>Servidor:</strong> ${smtpHost || 'Simulación en servidor local'}</p>
        <p style="margin:4px 0; font-size:13px;"><strong>Destinatario de prueba:</strong> ${email}</p>
        <p style="margin:4px 0; font-size:13px;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
      </div>
      <p style="color:#64748b; font-size:12px;">El sistema está listo para despachar comprobantes en marcha blanca.</p>
    </div>
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
