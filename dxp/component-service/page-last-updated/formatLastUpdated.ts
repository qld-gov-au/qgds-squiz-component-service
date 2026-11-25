/**
 * Parse and format a page's `updated.date` value for display.
 *
 * Output is `31 January 1900`: two-digit day, English month name, four-digit year.
 * Months are named from a fixed list, not `Intl`, so the output is the same in every runtime.
 */

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** Queensland does not observe daylight saving, so it is always UTC+10. */
const QUEENSLAND_OFFSET_MS = 10 * 60 * 60 * 1000;

/** A calendar date with no time or zone. `month` runs from 1 to 12. */
export type CalendarDate = {
    year: number;
    month: number;
    day: number;
};

/** `YYYY-MM-DD`, optionally followed by a time with no zone. The date is used as written. */
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?)?$/;

/** `YYYY-MM-DD` and a time with a `Z` or `+hh:mm` / `-hh:mm` zone. Converted to Queensland time. */
const ZONED_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}[T ](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

/** Build a calendar date, or return null when the day does not exist (for example 30 February). */
function toCalendarDate(year: number, month: number, day: number): CalendarDate | null {
    const date = new Date(Date.UTC(year, month - 1, day));
    // Date.UTC rolls an invalid day over into the next month, so compare the parts back.
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        return null;
    }
    return {year, month, day};
}

/**
 * Read a metadata value as a calendar date.
 *
 * Accepts a date only (`2026-01-31`), a date and time with no zone (taken as written),
 * or a date and time with a zone (converted to the Queensland date).
 * Returns null for anything else.
 */
export function parseLastUpdated(value: unknown): CalendarDate | null {
    if (typeof value !== 'string') return null;
    const text = value.trim();

    const local = LOCAL_DATE_PATTERN.exec(text);
    if (local) {
        return toCalendarDate(Number(local[1]), Number(local[2]), Number(local[3]));
    }

    if (ZONED_DATE_PATTERN.test(text)) {
        const instant = Date.parse(text.replace(' ', 'T'));
        if (Number.isNaN(instant)) return null;
        const queensland = new Date(instant + QUEENSLAND_OFFSET_MS);
        return {
            year: queensland.getUTCFullYear(),
            month: queensland.getUTCMonth() + 1,
            day: queensland.getUTCDate(),
        };
    }

    return null;
}

/** Format a metadata value as `31 January 1900`, or "" when it is not a valid date. */
export function formatLastUpdated(value: unknown): string {
    const date = parseLastUpdated(value);
    if (!date) return '';

    const day = String(date.day).padStart(2, '0');
    const year = String(date.year).padStart(4, '0');
    return `${day} ${MONTH_NAMES[date.month - 1]} ${year}`;
}
