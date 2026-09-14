"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { deleteProperty } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

interface DeletePropertyModalProps {
  property: {
    id: string;
    title: string;
    image?: string;
  };
}

export function DeletePropertyModal({ property }: DeletePropertyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProperty(property.id);
    setIsDeleting(false);
    
    if (result.success) {
      setIsOpen(false);
      // Opcional: router.refresh() si queremos asegurar recarga visual
      router.refresh();
    } else {
      alert("Hubo un error al eliminar la propiedad.");
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
        title="Eliminar propiedad"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-lg">Eliminar Propiedad</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => !isDeleting && setIsOpen(false)} disabled={isDeleting} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                ¿Estás seguro de que deseas eliminar permanentemente esta propiedad? <br/>
                <strong className="text-foreground">Esta acción no se puede deshacer.</strong>
              </p>
              
              <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-xl border border-border mb-6">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                  {property.image ? (
                    <Image src={property.image} alt={property.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sin foto</div>
                  )}
                </div>
                <h4 className="font-semibold text-sm line-clamp-2 leading-tight">
                  {property.title}
                </h4>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>Eliminar</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
