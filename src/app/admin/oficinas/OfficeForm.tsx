'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Office } from '@prisma/client';
import { saveOffice } from '../actions';

export function OfficeForm({ office }: { office?: Office | null }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    // Checkbox is unchecked -> null in formData. Set it manually if needed, but 'on' check handles it in server action.
    await saveOffice(formData, office?.id);
    
    router.push('/admin/oficinas');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card border p-6 md:p-8 rounded-2xl shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la Oficina</Label>
          <Input id="name" name="name" placeholder="Ej: Santiago Central" defaultValue={office?.name} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="order">Orden de aparición</Label>
          <Input id="order" name="order" type="number" defaultValue={office?.order ?? 0} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Dirección Exacta</Label>
          <Input id="address" name="address" placeholder="Ej: 1 Sur 885, Piso 3" defaultValue={office?.address} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
          <Input id="email" name="email" type="email" placeholder="Ej: contacto@nys.cl" defaultValue={office?.email || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (Opcional)</Label>
          <Input id="phone" name="phone" placeholder="Ej: +56 9 1234 5678" defaultValue={office?.phone || ''} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="mapLink">Enlace de Google Maps</Label>
          <Input id="mapLink" name="mapLink" placeholder="Ej: https://maps.app.goo.gl/..." defaultValue={office?.mapLink || ''} />
        </div>

        <div className="flex items-center space-x-2 md:col-span-2 mt-2">
          <input 
            type="checkbox" 
            id="isActive" 
            name="isActive" 
            className="w-4 h-4 rounded border-border"
            defaultChecked={office ? office.isActive : true}
          />
          <Label htmlFor="isActive" className="font-medium cursor-pointer">
            Oficina Activa (Visible en el sitio web)
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-border mt-8">
        <Button variant="outline" type="button" onClick={() => router.push('/admin/oficinas')}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : (office ? 'Guardar Cambios' : 'Crear Oficina')}
        </Button>
      </div>
    </form>
  );
}
