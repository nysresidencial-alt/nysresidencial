'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updatePropertyAvailability } from '@/app/admin/actions'
import { Loader2, CheckCircle2, ChevronDown, Ban, KeyRound, CheckCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertyAvailabilityToggleProps {
  id: string
  title: string
  operation?: string
  isAvailable: boolean
  availabilityStatus: string | null
}

export function PropertyAvailabilityToggle({
  id,
  title,
  operation,
  isAvailable: initialIsAvailable,
  availabilityStatus: initialStatus,
}: PropertyAvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(initialIsAvailable)
  const [status, setStatus] = useState<string>(
    initialStatus || (initialIsAvailable ? 'Disponible' : 'No Disponible')
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)

  async function handleSelectStatus(newAvailable: boolean, newStatus: string) {
    if (isLoading) return
    setIsLoading(true)
    setIsAvailable(newAvailable)
    setStatus(newStatus)

    try {
      await updatePropertyAvailability(id, newAvailable, newStatus)
    } catch (err) {
      console.error(err)
      // revert on error
      setIsAvailable(initialIsAvailable)
      setStatus(initialStatus || 'Disponible')
    } finally {
      setIsLoading(false)
    }
  }

  // Styling according to status
  const badgeClasses = isAvailable
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30'
    : status === 'Arrendada'
    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-amber-500/30'
    : status === 'Vendida'
    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 border-blue-500/30'
    : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-500/25 border-zinc-500/30'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm select-none',
          badgeClasses
        )}
        title={`Cambiar estado: actual "${status}"`}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isAvailable ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
        )}
        <span>{status}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-48 bg-card border border-border shadow-xl rounded-2xl p-1.5 z-50">
        <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
          Cambiar Estado
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleSelectStatus(true, 'Disponible')}
          className="flex items-center gap-2 cursor-pointer font-medium text-emerald-600 dark:text-emerald-400 rounded-lg"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Disponible</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSelectStatus(false, 'Arrendada')}
          className="flex items-center gap-2 cursor-pointer font-medium text-amber-600 dark:text-amber-400 rounded-lg"
        >
          <KeyRound className="w-4 h-4" />
          <span>Arrendada</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSelectStatus(false, 'Vendida')}
          className="flex items-center gap-2 cursor-pointer font-medium text-blue-600 dark:text-blue-400 rounded-lg"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Vendida</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSelectStatus(false, 'Reservada')}
          className="flex items-center gap-2 cursor-pointer font-medium text-purple-600 dark:text-purple-400 rounded-lg"
        >
          <Clock className="w-4 h-4" />
          <span>Reservada</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSelectStatus(false, 'No Disponible')}
          className="flex items-center gap-2 cursor-pointer font-medium text-zinc-600 dark:text-zinc-400 rounded-lg"
        >
          <Ban className="w-4 h-4" />
          <span>No Disponible</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
