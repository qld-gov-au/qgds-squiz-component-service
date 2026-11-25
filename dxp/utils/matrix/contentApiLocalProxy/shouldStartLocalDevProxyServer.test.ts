import {describe, expect, it} from 'vitest';
import {shouldStartLocalDevProxyServer} from './runLocalContentApiAmapiProxyServer.js';

describe('shouldStartLocalDevProxyServer', () => {
    it('returns true when FUNNELBACK_SUGGEST_UPSTREAM is set', () => {
        expect(
            shouldStartLocalDevProxyServer({
                FUNNELBACK_SUGGEST_UPSTREAM: 'https://ssqld-search.funnelback.squiz.cloud/s/suggest.json',
            }),
        ).toBe(true);
    });

    it('returns false when no funnelback or AMAPI disk cache env', () => {
        expect(shouldStartLocalDevProxyServer({})).toBe(false);
    });
});
