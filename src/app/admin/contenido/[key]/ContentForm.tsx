'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/RichTextEditor'
import { updateSiteContent } from './actions'

interface ContentFormProps {
  contentKey: string
  initialTitle: string
  initialContent: string
}

export function ContentForm({ contentKey, initialTitle, initialContent }: ContentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState(initialContent)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    await updateSiteContent(contentKey, initialTitle, content)
    
    router.push('/admin/contenido')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <section className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-medium text-muted-foreground">Contenido (HTML / Texto Enriquecido)</label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </section>

      <div className="flex justify-end gap-4 sticky bottom-6 bg-background/80 backdrop-blur p-4 rounded-full border shadow-2xl">
        <Button variant="outline" type="button" onClick={() => router.push('/admin/contenido')} className="rounded-full px-6">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  )
}
