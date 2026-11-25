import {afterEach, describe, expect, it, vi} from 'vitest';
import * as localDevRuntime from './localDevRuntime.js';
import {resolveHeaderAutosuggestUrl} from './resolveHeaderAutosuggestUrl.js';

describe('resolveHeaderAutosuggestUrl', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses manifest autosuggestUrl when not local', () => {
        vi.spyOn(localDevRuntime, 'isLocalDevRuntime').mockReturnValue(false);
        const url = resolveHeaderAutosuggestUrl(
            {
                autosuggestUrl: 'https://ssqld-search.funnelback.squiz.cloud/s/suggest.json',
            },
            {env: {IS_LOCAL: 'false'}},
        );
        expect(url).toBe('https://ssqld-search.funnelback.squiz.cloud/s/suggest.json');
    });

    it('prefers LOCAL_FUNNELBACK_SUGGEST_URL in local dev', () => {
        vi.spyOn(localDevRuntime, 'isLocalDevRuntime').mockReturnValue(true);
        const url = resolveHeaderAutosuggestUrl(
            {
                autosuggestUrl: 'https://ssqld-search.funnelback.squiz.cloud/s/suggest.json',
            },
            {
                env: {
                    IS_LOCAL: 'true',
                    LOCAL_FUNNELBACK_SUGGEST_URL: 'http://localhost:4000/__funnelback-suggest',
                },
            },
        );
        expect(url).toBe('http://localhost:4000/__funnelback-suggest');
    });
});
