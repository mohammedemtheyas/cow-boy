/**
 * Converts "HH:MM" string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to "HH:MM" string
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Checks if interval [startA, endA) overlaps with [startB, endB)
 * Two intervals overlap if: max(startA, startB) < min(endA, endB)
 */
export function intervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);

  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Checks if a slot on a given date (YYYY-MM-DD) and start time (HH:MM) is in the past
 */
export function isSlotInPast(dateStr: string, timeStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Month is 0-indexed in JS Date
  const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const now = new Date();

  return slotDate.getTime() <= now.getTime();
}

/**
 * Generates an elegant unique booking reference e.g. "SLT-83742"
 */
export function generateBookingReference(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `SLT-${randomNum}`;
}
