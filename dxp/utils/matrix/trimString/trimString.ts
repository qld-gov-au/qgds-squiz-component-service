/** Return a trimmed string, or empty string when value is not a string. */
export function trimString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export default trimString;
