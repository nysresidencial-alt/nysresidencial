import prisma from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil } from 'lucide-react'
import Link from 'next/link'

export default async function ContenidoDashboard() {
  const contents = await prisma.siteContent.findMany({
    orderBy: { title: 'asc' }
  })

  // Mock initial content keys if DB is empty to match the screenshot
  const defaultItems = [
    { key: 'quienes_somos', title: 'Quiénes Somos' },
    { key: 'equipo', title: 'Equipo' },
    { key: 'santiago_contacto', title: 'Santiago Info Contacto' },
    { key: 'talca_contacto', title: 'Talca Info Contacto' },
    { key: 'fonos_superior', title: 'Fonos Parte Superior' },
  ]

  // Para el MVP mostramos los items estáticos si no hay en DB
  const displayItems = contents.length > 0 ? contents : defaultItems

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Contenido del Sitio</h1>
      </div>
      
      <div className="border rounded-md bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-center">Acciones</TableHead>
              <TableHead>Título</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map((item) => (
              <TableRow key={item.key}>
                <TableCell className="text-center">
                  <Link href={`/admin/contenido/${item.key}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 rounded-full">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
                <TableCell className="font-medium text-lg">{item.title}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
