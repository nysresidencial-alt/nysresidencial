"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function OperationToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOp = searchParams.get("op") || "todo";

  const handleToggle = (op: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (op === "todo") {
      params.delete("op");
    } else {
      params.set("op", op);
    }
    // Prevent scrolling to top on navigation
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex justify-center w-full my-8">
      <div className="inline-flex bg-muted/50 p-1.5 rounded-full border border-border/50 shadow-inner">
        <button
          onClick={() => handleToggle("todo")}
          className={cn(
            "px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
            currentOp === "todo" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Todo
        </button>
        <button
          onClick={() => handleToggle("venta")}
          className={cn(
            "px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
            currentOp === "venta" 
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Venta
        </button>
        <button
          onClick={() => handleToggle("arriendo")}
          className={cn(
            "px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
            currentOp === "arriendo" 
              ? "bg-secondary text-secondary-foreground shadow-md shadow-secondary/20" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Arriendo
        </button>
      </div>
    </div>
  );
}
