import {describe, expect, it} from 'vitest';
import {trimString} from './trimString.js';

describe('[trimString]', () => {
    it('trims string values', () => {
        expect(trimString('  hello  ')).toBe('hello');
        expect(trimString('')).toBe('');
    });

    it('returns empty string for non-string values', () => {
        expect(trimString(null)).toBe('');
        expect(trimString(undefined)).toBe('');
        expect(trimString(42)).toBe('');
        expect(trimString({})).toBe('');
    });
});
