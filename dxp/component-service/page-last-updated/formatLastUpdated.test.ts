import {describe, expect, it} from 'vitest';
import {formatLastUpdated, parseLastUpdated} from './formatLastUpdated.js';

describe('formatLastUpdated', () => {
    it.each([
        ['1900-01-31', '31 January 1900'],
        ['2026-03-05', '05 March 2026'],
        ['2026-12-09', '09 December 2026'],
        ['2024-02-29', '29 February 2024'],
        ['  2026-03-05  ', '05 March 2026'],
    ])('formats the date %j as %j', (value, expected) => {
        expect(formatLastUpdated(value)).toBe(expected);
    });

    it.each([
        ['2026-02-01T09:00:00', '01 February 2026'],
        ['2026-02-01 09:00', '01 February 2026'],
    ])('keeps the date of a date-time with no zone as written: %j', (value, expected) => {
        expect(formatLastUpdated(value)).toBe(expected);
    });

    it('converts a UTC date-time to the Queensland date', () => {
        // 23:30 UTC on 31 January is 09:30 on 1 February in Brisbane (UTC+10).
        expect(formatLastUpdated('2026-01-31T23:30:00Z')).toBe('01 February 2026');
    });

    it('keeps the date of a date-time already in Queensland time', () => {
        expect(formatLastUpdated('2026-01-31T10:00:00+10:00')).toBe('31 January 2026');
    });

    it('converts a date-time from another offset to the Queensland date', () => {
        // 20:00 at UTC-05:00 on 31 January is 01:00 UTC on 1 February, which is 11:00 in Brisbane.
        expect(formatLastUpdated('2026-01-31T20:00:00-05:00')).toBe('01 February 2026');
    });

    it.each(['2026-02-30', '2026-13-01', '2026-00-10', '2026-01-00', '2026-01-31T25:00:00', '31/01/2026', '31 January 2026', 'Soon', '', '   '])(
        'returns an empty string for %j',
        (value) => {
            expect(formatLastUpdated(value)).toBe('');
        },
    );

    it.each([undefined, null, 20260131, true, {}, []])('returns an empty string for a non-string value: %j', (value) => {
        expect(formatLastUpdated(value)).toBe('');
    });
});

describe('parseLastUpdated', () => {
    it('returns the calendar parts for a date', () => {
        expect(parseLastUpdated('1900-01-31')).toEqual({
            year: 1900,
            month: 1,
            day: 31,
        });
    });

    it('returns null for a value that is not a date', () => {
        expect(parseLastUpdated('Soon')).toBeNull();
    });
});
