/**
 * Raw code (DXP Edge).
 *
 * Outputs the author's `rawCode` field unchanged, so editors can embed HTML
 * snippets such as third-party form scripts. This is a documented exception to
 * xssSafeContent; see README.md. Only trusted editors should use this field.
 */
export interface RawCodeInput {
    rawCode?: unknown;
}

export default {
    async main(input?: RawCodeInput): Promise<string> {
        const rawCode = input?.rawCode;
        if (typeof rawCode !== 'string' || rawCode.trim() === '') {
            return '';
        }
        return rawCode; // Documented exception to xssSafeContent, see README.md
    },
};
