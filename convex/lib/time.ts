import { addDays, differenceInMinutes } from 'date-fns';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export type LocalTime = {
  hour: number;
  minute: number;
  minutesOfDay: number;
  dateKey: string;
};

export function localTime(ms: number, timezone: string): LocalTime {
  const safeZone = timezone || 'UTC';
  let formatted: string;
  try {
    formatted = formatInTimeZone(new Date(ms), safeZone, 'yyyy-MM-dd HH:mm');
  } catch {
    formatted = formatInTimeZone(new Date(ms), 'UTC', 'yyyy-MM-dd HH:mm');
  }
  const [dateKey, time] = formatted.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute, minutesOfDay: hour * 60 + minute, dateKey };
}

export function toMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return Math.max(0, Math.min(1439, hour * 60 + minute));
}

export function isWithinQuietHours(
  nowMs: number,
  timezone: string,
  start: string,
  end: string,
  enabled: boolean,
): boolean {
  if (!enabled) return false;
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (startMinutes === endMinutes) return false;
  const now = localTime(nowMs, timezone).minutesOfDay;
  if (startMinutes < endMinutes) {
    return now >= startMinutes && now < endMinutes;
  }
  return now >= startMinutes || now < endMinutes;
}

/**
 * Returns the next UTC timestamp (after `afterMs`) at which the given local
 * wall-clock time occurs in `timezone`. Handles overnight and DST changes.
 */
export function nextLocalTime(afterMs: number, timezone: string, hhmm: string): number {
  const safeZone = timezone || 'UTC';
  const [hour, minute] = hhmm.split(':').map(Number);
  const base = utcToZonedTime(new Date(afterMs), safeZone);
  for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
    const candidateLocal = addDays(base, dayOffset);
    candidateLocal.setHours(hour || 0, minute || 0, 0, 0);
    const candidateUtc = zonedTimeToUtc(candidateLocal, safeZone).getTime();
    if (candidateUtc > afterMs + 1000) return candidateUtc;
  }
  return afterMs + 24 * 60 * 60 * 1000;
}

export function minutesUntilLocalTime(
  nowMs: number,
  timezone: string,
  hhmm: string,
): number {
  return differenceInMinutes(nextLocalTime(nowMs, timezone, hhmm), nowMs);
}
