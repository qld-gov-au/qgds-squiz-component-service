import {afterEach, describe, expect, it, vi} from 'vitest';
import {ensureLocalProjectEnvLoaded} from './loadProjectEnvFile';

describe('ensureLocalProjectEnvLoaded', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('is a no-op under Vitest (does not read repo .env)', () => {
        vi.stubEnv('IS_LOCAL', undefined);
        ensureLocalProjectEnvLoaded();
        expect(process.env.IS_LOCAL).toBeUndefined();
    });

    it('is a no-op when component info has Edge-like fns (Miniflare dev-ui)', () => {
        vi.stubEnv('IS_LOCAL', undefined);
        ensureLocalProjectEnvLoaded({
            fns: {
                resolveUri: () => '',
                resolveMatrixAssetById: async () => null,
            },
            ctx: {assetId: '', url: ''},
        });
        expect(process.env.IS_LOCAL).toBeUndefined();
    });
});
