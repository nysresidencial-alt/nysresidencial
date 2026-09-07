'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/RichTextEditor'
import { ImageUploader } from '@/components/ImageUploader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Property } from '@prisma/client'

// Adjust prop to accept undefined property for creation mode, and submit action function
interface PropertyFormProps {
  property?: Property | null;
  actionFn: (formData: FormData) => Promise<void>;
}

export function PropertyForm({ property, actionFn }: PropertyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // States for complex fields
  const [description, setDescription] = useState(property?.description || '')
  const [salesRoom, setSalesRoom] = useState(property?.salesRoom || '')
  const [executive, setExecutive] = useState(property?.executive || '')
  const [images, setImages] = useState<string[]>(property?.images || [])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('description', description)
    formData.append('salesRoom', salesRoom)
    formData.append('executive', executive)
    formData.append('images', JSON.stringify(images))
    
    try {
      await actionFn(formData)
      router.push('/admin')
      router.refresh()
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-12 pb-12">
      
      {/* Imágenes */}
      <section className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <div className="border-b pb-2">
          <h2 className="text-xl font-bold">Galería de Imágenes</h2>
          <p className="text-muted-foreground text-sm">Sube, ordena y gestiona las fotos. La primera será la portada.</p>
        </div>
        <ImageUploader images={images} onChange={setImages} />
      </section>

      {/* Información Principal */}
      <section className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Información Principal</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Nombre del Proyecto</Label>
            <Input id="title" name="title" defaultValue={property?.title} required className="text-lg py-6" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyType">Tipo</Label>
            <Select name="propertyType" defaultValue={property?.propertyType || "Casas"}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casas">Casas</SelectItem>
                <SelectItem value="Departamento">Departamento</SelectItem>
                <SelectItem value="Terrenos">Terrenos</SelectItem>
                <SelectItem value="Oficina">Oficina</SelectItem>
                <SelectItem value="Comercial">Local Comercial</SelectItem>
                <SelectItem value="Parcela">Parcela</SelectItem>
                <SelectItem value="Agricola">Predio Agrícola/Forestal</SelectItem>
                <SelectItem value="Institucional">Edificio/Institucional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operation">Operación</Label>
            <Select name="operation" defaultValue={property?.operation || "Venta"}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Venta">Venta</SelectItem>
                <SelectItem value="Arriendo">Arriendo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={property?.status || 'Usada'}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nueva">Nueva</SelectItem>
                <SelectItem value="Usada">Usada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descripción General</Label>
          <RichTextEditor content={description} onChange={setDescription} />
        </div>
      </section>

      {/* Precios y Medidas */}
      <section className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Precio y Medidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Valorado en</Label>
            <Select name="currency" defaultValue={property?.currency || "UF"}>
              <SelectTrigger>
                <SelectValue placeholder="Moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UF">UF</SelectItem>
                <SelectItem value="Pesos">Pesos (CLP)</SelectItem>
                <SelectItem value="Dolar">Dólar (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="price">Valor</Label>
            <Input id="price" name="price" type="number" step="0.01" defaultValue={property?.price} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beds">Habitaciones</Label>
            <Input id="beds" name="beds" type="number" defaultValue={property?.beds} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baths">Baños (Wc)</Label>
            <Input id="baths" name="baths" type="number" defaultValue={property?.baths} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parking">Estacionamientos</Label>
            <Input id="parking" name="parking" type="number" defaultValue={property?.parking ?? 0} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="builtArea">Metros útiles/construido</Label>
            <Input id="builtArea" name="builtArea" type="number" step="0.1" defaultValue={property?.builtArea || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landArea">Metros totales/terreno</Label>
            <Input id="landArea" name="landArea" type="number" step="0.1" defaultValue={property?.landArea || ''} />
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Ubicación</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" defaultValue={property?.city} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input id="sector" name="sector" defaultValue={property?.sector} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Dirección exacta</Label>
            <Input id="address" name="address" defaultValue={property?.address || ''} />
          </div>
        </div>
      </section>

      {/* Textos Secundarios */}
      <section className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Información de Venta</h2>
        
        <div className="space-y-2">
          <Label>Sala de Venta</Label>
          <RichTextEditor content={salesRoom} onChange={setSalesRoom} />
        </div>
        
        <div className="space-y-2">
          <Label>Ejecutivo Piloto</Label>
          <RichTextEditor content={executive} onChange={setExecutive} />
        </div>
      </section>

      <div className="flex justify-end gap-4 sticky bottom-6 z-50 bg-background/80 backdrop-blur p-4 rounded-full border shadow-2xl">
        <Button variant="outline" type="button" onClick={() => router.push('/admin')} className="rounded-full px-6">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="rounded-full px-8">
          {loading ? 'Guardando...' : (property ? 'Guardar Cambios' : 'Crear Propiedad')}
        </Button>
      </div>

    </form>
  )
}
