import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitario CN (Clsx + TailwindMerge) de rendimiento puro.
 * Previene la superposición de clases de Tailwind en componentes atómicos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
