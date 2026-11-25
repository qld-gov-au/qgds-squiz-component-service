import {afterEach, describe, expect, it, vi} from 'vitest';
import {isSiteLineageDebugEnabled, siteLineageLog} from './siteLineageLog.js';

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('[siteLineageLog]', () => {
    it('is silent by default', () => {
        vi.stubEnv('SITE_LINEAGE_DEBUG', '');
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        siteLineageLog('Related content', 'lineage fetched', {assetCount: 0});

        expect(isSiteLineageDebugEnabled()).toBe(false);
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('logs with the payload when SITE_LINEAGE_DEBUG is true', () => {
        vi.stubEnv('SITE_LINEAGE_DEBUG', 'true');
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        siteLineageLog('Related content', 'lineage fetched', {assetCount: 2});

        expect(consoleError).toHaveBeenCalledWith('Related content: lineage fetched', {assetCount: 2});
    });

    it('logs the message alone when there is no payload and debugging is on', () => {
        vi.stubEnv('SITE_LINEAGE_DEBUG', '1');
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        siteLineageLog('Header Nav', 'resolved');

        expect(consoleError).toHaveBeenCalledWith('Header Nav: resolved');
    });

    it('treats other values as off', () => {
        vi.stubEnv('SITE_LINEAGE_DEBUG', 'false');

        expect(isSiteLineageDebugEnabled()).toBe(false);
    });
});
