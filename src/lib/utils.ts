import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DAYS_OF_WEEK = {
  1: 'Maandag',
  2: 'Dinsdag', 
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag'
} as const

export const TIME_SLOTS = [
  { start: '13:30', end: '15:30', label: '13:30 - 15:30' },
  { start: '15:30', end: '17:30', label: '15:30 - 17:30' },
  { start: '17:30', end: '19:30', label: '17:30 - 19:30' },
  { start: '19:30', end: '21:30', label: '19:30 - 21:30' }
] as const

export function formatTimeslot(dayOfWeek: number, startTime: string, endTime: string) {
  const dayName = DAYS_OF_WEEK[dayOfWeek as keyof typeof DAYS_OF_WEEK]
  return `${dayName} ${startTime} - ${endTime}`
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}