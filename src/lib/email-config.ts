import prisma from '@/lib/db'
import { EmailConfigData, DEFAULT_EMAIL_CONFIG } from './email-config-types'

export * from './email-config-types'

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
