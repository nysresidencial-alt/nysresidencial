import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CL').format(price);
}

export function formatCurrency(currency: string, price: number): string {
  const formattedPrice = formatPrice(price);
  
  if (!currency) return `$ ${formattedPrice}`;
  
  const lowerCurrency = currency.toLowerCase();
  
  if (lowerCurrency === 'pesos' || lowerCurrency === 'clp') {
    return `$ ${formattedPrice}`;
  } else if (lowerCurrency === 'dolar' || lowerCurrency === 'usd') {
    return `US$ ${formattedPrice}`;
  }
  
  // Por defecto asume UF si es UF u otro
  return `${currency} ${formattedPrice}`;
}
