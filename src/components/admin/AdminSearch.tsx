"use client";

import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useRef } from "react";

export function AdminSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (term: string) => {
    setQuery(term);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
          params.set("q", term);
        } else {
          params.delete("q");
        }
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 400);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </div>
      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Buscar por nombre, ciudad o sector..."
        className="pl-10 w-full bg-background border-border rounded-full shadow-sm transition-all focus-visible:ring-primary"
      />
    </div>
  );
}
