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
  title?: string
  operation?: string
  isAvailable: boolean
  availabilityStatus: string | null
  variant?: 'badge' | 'button'
}

export function PropertyAvailabilityToggle({
  id,
  title,
  operation,
  isAvailable: initialIsAvailable,
  availabilityStatus: initialStatus,
  variant = 'badge',
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
    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40 backdrop-blur-md'
    : status === 'Arrendada'
    ? 'bg-amber-950/90 text-amber-200 border-amber-500/70 hover:bg-amber-900 shadow-md backdrop-blur-md'
    : status === 'Vendida'
    ? 'bg-blue-950/90 text-blue-200 border-blue-500/70 hover:bg-blue-900 shadow-md backdrop-blur-md'
    : status === 'Reservada'
    ? 'bg-purple-950/90 text-purple-200 border-purple-500/70 hover:bg-purple-900 shadow-md backdrop-blur-md'
    : 'bg-rose-950/90 text-rose-100 border-rose-500/80 hover:bg-rose-900 shadow-md backdrop-blur-md'

  const buttonClasses = isAvailable
    ? 'bg-muted hover:bg-muted/80 text-foreground border-border'
    : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/30'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-1.5 font-bold border transition-all cursor-pointer shadow-sm select-none',
          variant === 'button'
            ? cn('px-3 py-1.5 rounded-full text-xs', buttonClasses)
            : cn('px-2.5 py-1 rounded-full text-xs', badgeClasses)
        )}
        title={`Cambiar disponibilidad (actual: "${status}")`}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isAvailable ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        ) : (
          <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )}
        <span>{status}</span>
        <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
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
