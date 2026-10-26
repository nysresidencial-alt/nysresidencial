'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'

export async function createClientUser(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim()
    const rut = (formData.get('rut') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    let username = (formData.get('username') as string)?.trim() || null
    const password = (formData.get('password') as string)?.trim()
    const phone = (formData.get('phone') as string)?.trim() || null
    const notes = (formData.get('notes') as string)?.trim() || null

    if (!name || !password) {
      return { success: false, error: 'El nombre y la contraseña son obligatorios.' }
    }

    // Default username if not provided
    if (!username) {
      if (rut) {
        username = rut.replace(/[^0-9kK]/g, '').toLowerCase()
      } else if (email) {
        username = email.split('@')[0]
      } else {
        username = name.toLowerCase().replace(/[^a-z0-9]/g, '')
      }
    }

    // Check duplicate username or email
    const existing = await prisma.clientUser.findFirst({
      where: {
        OR: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
          ...(rut ? [{ rut }] : []),
        ],
      },
    })

    if (existing) {
      return { success: false, error: 'Ya existe un cliente con ese RUT, correo o nombre de usuario.' }
    }

    const client = await prisma.clientUser.create({
      data: {
        name,
        rut,
        email,
        username,
        password,
        phone,
        notes,
        isActive: true,
      },
    })

    revalidatePath('/admin/clientes')
    return { success: true, client }
  } catch (error: any) {
    console.error('Error creating client user:', error)
    return { success: false, error: error.message || 'No se pudo crear el cliente.' }
  }
}

export async function updateClientUser(id: string, formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim()
    const rut = (formData.get('rut') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const username = (formData.get('username') as string)?.trim() || null
    const password = (formData.get('password') as string)?.trim()
    const phone = (formData.get('phone') as string)?.trim() || null
    const notes = (formData.get('notes') as string)?.trim() || null
    const isActive = formData.get('isActive') === 'true' || formData.get('isActive') === 'on'

    if (!name) {
      return { success: false, error: 'El nombre es obligatorio.' }
    }

    const updateData: any = {
      name,
      rut,
      email,
      username,
      phone,
      notes,
      isActive,
    }

    if (password) {
      updateData.password = password
    }

    await prisma.clientUser.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/clientes')
    revalidatePath(`/admin/clientes/${id}`)
    revalidatePath('/oficina-virtual')

    return { success: true }
  } catch (error: any) {
    console.error('Error updating client user:', error)
    return { success: false, error: error.message || 'No se pudo actualizar el cliente.' }
  }
}

export async function deleteClientUser(id: string) {
  try {
    await prisma.clientUser.delete({
      where: { id },
    })

    revalidatePath('/admin/clientes')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting client user:', error)
    return { success: false, error: error.message || 'No se pudo eliminar el cliente.' }
  }
}

export async function addClientDocument(clientId: string, formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim()
    const category = (formData.get('category') as string)?.trim() || 'Documento'
    const notes = (formData.get('notes') as string)?.trim() || null
    const externalUrl = (formData.get('externalUrl') as string)?.trim()
    const uploadedUrl = (formData.get('uploadedUrl') as string)?.trim()
    const originalFileName = (formData.get('originalFileName') as string)?.trim() || 'documento.pdf'
    const uploadedFileSize = Number(formData.get('uploadedFileSize')) || 0
    const file = formData.get('file') as File | null

    if (!title) {
      return { success: false, error: 'El título del documento es obligatorio.' }
    }

    let fileUrl = ''
    let fileSize = ''
    let fileType = 'PDF'
    let isExternal = false

    if (uploadedUrl) {
      // Subido directamente al Cloud Storage (Supabase)
      fileUrl = uploadedUrl
      isExternal = false
      if (uploadedFileSize >= 1024 * 1024) {
        fileSize = `${(uploadedFileSize / (1024 * 1024)).toFixed(1)} MB`
      } else if (uploadedFileSize > 0) {
        fileSize = `${Math.round(uploadedFileSize / 1024)} KB`
      } else {
        fileSize = 'Cloud Storage'
      }

      if (originalFileName.toLowerCase().endsWith('.pdf')) {
        fileType = 'PDF'
      } else if (originalFileName.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/)) {
        fileType = 'Imagen'
      } else if (originalFileName.toLowerCase().match(/\.(doc|docx)$/)) {
        fileType = 'Word'
      } else {
        fileType = 'Archivo'
      }
    } else if (externalUrl) {
      fileUrl = externalUrl
      isExternal = true
      fileType = externalUrl.toLowerCase().includes('onedrive') ? 'OneDrive' : 'Enlace'
      fileSize = (formData.get('fileSize') as string)?.trim() || 'Enlace en línea'
    } else if (file && file.size > 0) {
      // Save file locally to public/uploads/clients/${clientId}/
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'clients', clientId)
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const originalName = file.name || 'documento.pdf'
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `${Date.now()}_${sanitizedName}`
      const filePath = path.join(uploadDir, fileName)

      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filePath, buffer)

      fileUrl = `/uploads/clients/${clientId}/${fileName}`
      isExternal = false

      // Size calculation
      if (file.size >= 1024 * 1024) {
        fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      } else {
        fileSize = `${Math.round(file.size / 1024)} KB`
      }

      if (originalName.toLowerCase().endsWith('.pdf')) {
        fileType = 'PDF'
      } else if (originalName.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/)) {
        fileType = 'Imagen'
      } else if (originalName.toLowerCase().match(/\.(doc|docx)$/)) {
        fileType = 'Word'
      } else {
        fileType = 'Archivo'
      }
    } else {
      return { success: false, error: 'Debes seleccionar un archivo o ingresar un enlace de OneDrive/Web.' }
    }

    const document = await prisma.clientDocument.create({
      data: {
        clientId,
        title,
        category,
        fileUrl,
        fileSize,
        fileType,
        isExternal,
        notes,
      },
    })

    revalidatePath(`/admin/clientes/${clientId}`)
    revalidatePath('/admin/clientes')
    revalidatePath('/oficina-virtual')

    return { success: true, document }
  } catch (error: any) {
    console.error('Error adding client document:', error)
    return { success: false, error: error.message || 'No se pudo adjuntar el documento.' }
  }
}

export async function importClientsBatch(clientsData: Array<{
  name: string
  rut?: string | null
  email?: string | null
  phone?: string | null
  password?: string | null
  notes?: string | null
}>) {
  try {
    let createdCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const item of clientsData) {
      const name = item.name?.trim()
      if (!name) {
        skippedCount++
        continue
      }

      const rut = item.rut?.trim() || null
      const email = item.email?.trim() || null
      const phone = item.phone?.trim() || null
      const notes = item.notes?.trim() || null

      // Contraseña por defecto si viene vacía
      let password = item.password?.trim()
      if (!password) {
        if (rut) {
          // Usar rut sin puntos ni guión como password por defecto
          password = rut.replace(/[^0-9kK]/g, '')
        } else {
          password = 'nys' + Math.floor(1000 + Math.random() * 9000)
        }
      }

      // Nombre de usuario por defecto
      let username: string
      if (rut) {
        username = rut.replace(/[^0-9kK]/g, '').toLowerCase()
      } else if (email) {
        username = email.split('@')[0].toLowerCase()
      } else {
        username = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(10 + Math.random() * 90)
      }

      // Verificar duplicados por RUT, correo o username
      const existing = await prisma.clientUser.findFirst({
        where: {
          OR: [
            ...(rut ? [{ rut }] : []),
            ...(email ? [{ email }] : []),
            { username },
          ],
        },
      })

      if (existing) {
        skippedCount++
        errors.push(`${name} ya existe (coincide RUT, correo o usuario).`)
        continue
      }

      await prisma.clientUser.create({
        data: {
          name,
          rut,
          email,
          username,
          password,
          phone,
          notes,
          isActive: true,
        },
      })

      createdCount++
    }

    revalidatePath('/admin/clientes')
    return {
      success: true,
      createdCount,
      skippedCount,
      errors,
    }
  } catch (error: any) {
    console.error('Error in batch import:', error)
    return { success: false, error: error.message || 'Error al procesar la carga masiva.' }
  }
}

export async function deleteClientDocument(documentId: string, clientId: string) {
  try {
    const doc = await prisma.clientDocument.findUnique({
      where: { id: documentId },
    })

    if (doc && !doc.isExternal && doc.fileUrl.startsWith('/uploads/')) {
      const fullPath = path.join(process.cwd(), 'public', doc.fileUrl)
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath)
        } catch (e) {
          console.error('Could not unlink local file:', e)
        }
      }
    }

    await prisma.clientDocument.delete({
      where: { id: documentId },
    })

    revalidatePath(`/admin/clientes/${clientId}`)
    revalidatePath('/admin/clientes')
    revalidatePath('/oficina-virtual')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting client document:', error)
    return { success: false, error: error.message || 'No se pudo eliminar el documento.' }
  }
}
