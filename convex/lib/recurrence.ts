import { addDays, differenceInCalendarDays, format, getDate, getMonth, getYear, parseISO } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';

export type RecurrenceInput = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endAt?: number;
  count?: number;
};

export const MAX_OCCURRENCES = 500;

export function safeZone(timezone?: string): string {
  const zone = timezone || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date());
    return zone;
  } catch {
    return 'UTC';
  }
}

export function localDateKey(ms: number, timezone?: string): string {
  return formatInTimeZone(new Date(ms), safeZone(timezone), 'yyyy-MM-dd');
}

export function localTimeOfDay(ms: number, timezone?: string): string {
  return formatInTimeZone(new Date(ms), safeZone(timezone), 'HH:mm');
}

export function localToUtc(dateKey: string, timeOfDay: string, timezone?: string): number {
  return zonedTimeToUtc(`${dateKey} ${timeOfDay || '00:00'}`, safeZone(timezone)).getTime();
}

function matches(date: Date, start: Date, rule: RecurrenceInput): boolean {
  const interval = Math.max(1, Math.round(rule.interval || 1));
  const days = differenceInCalendarDays(date, start);
  if (days < 0) return false;

  switch (rule.frequency) {
    case 'daily':
      return days % interval === 0;
    case 'weekly': {
      const weeks = Math.floor(days / 7);
      if (weeks % interval !== 0) return false;
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        return rule.daysOfWeek.includes(date.getDay());
      }
      return date.getDay() === start.getDay();
    }
    case 'monthly': {
      const months = (getYear(date) - getYear(start)) * 12 + (getMonth(date) - getMonth(start));
      return months >= 0 && months % interval === 0 && getDate(date) === getDate(start);
    }
    case 'yearly': {
      const years = getYear(date) - getYear(start);
      return (
        years >= 0 &&
        years % interval === 0 &&
        getMonth(date) === getMonth(start) &&
        getDate(date) === getDate(start)
      );
    }
    default:
      return false;
  }
}

export function occurrenceInstants(
  rule: RecurrenceInput | undefined,
  firstOccurrenceMs: number | undefined,
  timezone: string | undefined,
  fromMs: number,
  toMs: number,
): number[] {
  if (!firstOccurrenceMs) return [];
  const zone = safeZone(timezone);
  const timeOfDay = localTimeOfDay(firstOccurrenceMs, zone);
  if (!rule) {
    return firstOccurrenceMs >= fromMs && firstOccurrenceMs <= toMs ? [firstOccurrenceMs] : [];
  }

  const startKey = localDateKey(firstOccurrenceMs, zone);
  const start = parseISO(startKey);
  const untilKey = localDateKey(toMs, zone);
  const until = parseISO(untilKey);
  const maxDays = Math.max(1, differenceInCalendarDays(until, start) + 1);
  const limit = Math.min(maxDays, MAX_OCCURRENCES * 2);
  const countLimit = rule.count && rule.count > 0 ? Math.min(rule.count, MAX_OCCURRENCES) : MAX_OCCURRENCES;

  const out: number[] = [];
  let matched = 0;
  for (let i = 0; i < limit && matched < countLimit; i += 1) {
    const date = addDays(start, i);
    if (!matches(date, start, rule)) continue;
    const dateKey = format(date, 'yyyy-MM-dd');
    const instant = localToUtc(dateKey, timeOfDay, zone);
    matched += 1;
    if (rule.endAt && instant > rule.endAt) break;
    if (instant >= fromMs && instant <= toMs) out.push(instant);
    if (out.length >= MAX_OCCURRENCES) break;
  }
  return out;
}
