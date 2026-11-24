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
