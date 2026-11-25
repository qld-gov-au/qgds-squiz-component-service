import {describe, expect, it} from 'vitest';
import {MASTER_BRAND_GLOBAL_LINK_TEXT, MASTER_BRAND_GLOBAL_LINK_URL, resolvePreHeaderGlobalLink} from './resolvePreHeaderGlobalLink';

describe('resolvePreHeaderGlobalLink', () => {
    it('uses master-brand defaults only when global link is unset', () => {
        expect(resolvePreHeaderGlobalLink(undefined)).toEqual({
            url: MASTER_BRAND_GLOBAL_LINK_URL,
            text: MASTER_BRAND_GLOBAL_LINK_TEXT,
        });
        expect(resolvePreHeaderGlobalLink({})).toEqual({
            url: MASTER_BRAND_GLOBAL_LINK_URL,
            text: MASTER_BRAND_GLOBAL_LINK_TEXT,
        });
    });

    it('uses author url and text when both are set', () => {
        expect(
            resolvePreHeaderGlobalLink({
                url: 'https://www.some-link.com.au',
                text: 'www.qld.gov.au',
            }),
        ).toEqual({
            url: 'https://www.some-link.com.au',
            text: 'www.qld.gov.au',
        });
    });

    it('does not substitute master-brand URL when only text is set', () => {
        expect(
            resolvePreHeaderGlobalLink({
                text: 'www.qld.gov.au',
            }),
        ).toEqual({
            url: '#',
            text: 'www.qld.gov.au',
        });
    });

    it('allows url-only global link with empty label', () => {
        expect(
            resolvePreHeaderGlobalLink({
                url: 'https://example.com',
            }),
        ).toEqual({
            url: 'https://example.com',
            text: '',
        });
    });

    it('does not apply master-brand defaults when only matrixAssetId is set', () => {
        expect(
            resolvePreHeaderGlobalLink({
                matrixAssetId: '8',
                target: '_self',
            }),
        ).toEqual({
            url: '#',
            text: '',
        });
    });
});
