import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como precio en Soles Peruanos
 */
export function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`;
}
