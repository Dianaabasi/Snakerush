import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to get the current Week ID (Sunday to Saturday)
export function getCurrentWeekID(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  // Calculate day of year
  // (diff in ms) / ms_per_day
  const diff = now.getTime() - startOfYear.getTime() + ((startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Week number logic (Sunday start)
  const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  
  return `${now.getFullYear()}-W${weekNumber}`;
}