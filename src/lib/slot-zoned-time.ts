import { addHours } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const TZ_FALLBACK = 'Asia/Jerusalem';

/**
 * ממיר תאריך yyyy-MM-dd ושעה HH:mm (או HH:mm:ss) ל-UTC לפי אזור זמן העסק.
 */
export function zonedWallTimeToUtc(
  dateStr: string,
  timeHHmm: string,
  timeZone: string | null | undefined
): Date {
  const tz = timeZone?.trim() || TZ_FALLBACK;
  const t = timeHHmm.length === 5 ? `${timeHHmm}:00` : timeHHmm;
  return fromZonedTime(`${dateStr}T${t}`, tz);
}

/** זמן UTC המוקדם ביותר שאפשר לקבוע בו תור ציבורי (עכשיו + מינימום שעות קדימה). */
export function getEarliestBookableUtc(minimumAdvanceHours: number | null | undefined): Date {
  const h =
    typeof minimumAdvanceHours === 'number' &&
    Number.isFinite(minimumAdvanceHours) &&
    minimumAdvanceHours >= 0
      ? minimumAdvanceHours
      : 2;
  return addHours(new Date(), h);
}

/** יום בשבוע 0=ראשון … 6=שבת, לפי אזור זמן העסק. */
export function weekdayInTimeZone(instant: Date, timeZone: string | null | undefined): number {
  const tz = timeZone?.trim() || TZ_FALLBACK;
  const iso = parseInt(formatInTimeZone(instant, tz, 'i'), 10); // 1=שני … 7=ראשון (ISO)
  return iso === 7 ? 0 : iso;
}

export function formatTimeInZone(instant: Date, timeZone: string | null | undefined): string {
  const tz = timeZone?.trim() || TZ_FALLBACK;
  return formatInTimeZone(instant, tz, 'HH:mm');
}
