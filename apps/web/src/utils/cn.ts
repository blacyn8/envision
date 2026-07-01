/**
 * cn.ts — className utility
 *
 * Merges Tailwind class names cleanly, resolving conflicts
 * (e.g. bg-red-500 + bg-blue-500 → bg-blue-500 wins).
 *
 * Usage:
 *   import { cn } from '@/utils/cn'
 *   <div className={cn('base-class', isActive && 'active-class')} />
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
