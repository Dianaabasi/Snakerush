// import { type ClassValue, clsx } from "clsx";
// import { twMerge } from "tailwind-merge";

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// // Helper to get the current Week ID (Sunday start)
// export function getCurrentWeekID(): string {
//   const now = new Date();
//   const startOfYear = new Date(now.getFullYear(), 0, 1);
//   const diff = now.getTime() - startOfYear.getTime() + ((startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
//   const oneDay = 1000 * 60 * 60 * 24;
//   const dayOfYear = Math.floor(diff / oneDay);
//   const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
//   return `${now.getFullYear()}-W${weekNumber}`;
// }

// // Helper to get all date strings (YYYY-MM-DD) for the current week (Sunday to Saturday)
// export function getWeekDates(): string[] {
//   const current = new Date();
//   const day = current.getDay(); // 0 (Sun) to 6 (Sat)
//   const diff = current.getDate() - day; // Go back to Sunday
//   const sunday = new Date(current.setDate(diff));

//   const weekDates: string[] = [];
//   for (let i = 0; i < 7; i++) {
//     const nextDay = new Date(sunday);
//     nextDay.setDate(sunday.getDate() + i);
//     weekDates.push(nextDay.toISOString().split('T')[0]);
//   }
//   return weekDates;
// }

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to get the current Week ID (Sunday start)
export function getCurrentWeekID(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - startOfYear.getTime() + ((startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber}`;
}

// Helper to get the PREVIOUS Week ID (for claiming rewards)
export function getPreviousWeekID(): string {
  const now = new Date();
  // Go back 7 days to get a date in the previous week
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const startOfYear = new Date(lastWeek.getFullYear(), 0, 1);
  const diff = lastWeek.getTime() - startOfYear.getTime() + ((startOfYear.getTimezoneOffset() - lastWeek.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  
  return `${lastWeek.getFullYear()}-W${weekNumber}`;
}

// Helper to get all date strings (YYYY-MM-DD) for the current week (Sunday to Saturday)
export function getWeekDates(): string[] {
  const current = new Date();
  const day = current.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = current.getDate() - day; // Go back to Sunday
  const sunday = new Date(current.setDate(diff));

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(sunday);
    nextDay.setDate(sunday.getDate() + i);
    weekDates.push(nextDay.toISOString().split('T')[0]);
  }
  return weekDates;
}