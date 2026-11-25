import {afterEach, beforeEach, vi} from 'vitest';

/** Keys merged from `process.env` into `resolveComponentEnv` (GitLab runners may set these). */
const MATRIX_PROCESS_ENV_KEYS = [
    'API_IDENTIFIER',
    'BASE_DOMAIN',
    'BASE_PATH',
    'BASE_URL',
    'SITE_ROOT_ASSET_ID',
    'MX_API',
    'BEARER_AUTH',
    'BEARER',
    'BEARER_TOKEN',
    'CONTENT_API_TOKEN',
    'API_KEY',
    'API_TOKEN',
    'AMAPI_TOKEN',
    'VITE_AMAPI_TOKEN',
    'ASSET_MANAGEMENT_BEARER_TOKEN',
] as const;

/**
 * Header integration tests use preview JSON fixtures. Clear inherited Matrix env so
 * `canResolveLineageNavigation` stays false (matches local dev without `.env`).
 */
export function useIsolatedMatrixEnvForHeaderIntegrationTests(): void {
    beforeEach(() => {
        vi.unstubAllEnvs();
        vi.stubEnv('IS_LOCAL', 'false');
        for (const key of MATRIX_PROCESS_ENV_KEYS) {
            delete process.env[key];
        }
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });
}
