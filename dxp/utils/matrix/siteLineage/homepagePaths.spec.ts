import {describe, it, expect} from 'vitest';
import {parseHomepagePathsFromEnv, resolveHomepagePaths} from './homepagePaths.js';

describe('[parseHomepagePathsFromEnv]', () => {
    it('always includes the site root path', () => {
        expect(parseHomepagePathsFromEnv('').has('/')).toBe(true);
        expect(parseHomepagePathsFromEnv('/other').has('/')).toBe(true);
    });

    it('parses comma-separated paths with normalization', () => {
        const paths = parseHomepagePathsFromEnv('/arts-rebuild-2026, /staging-site/');
        expect(paths.has('/')).toBe(true);
        expect(paths.has('/arts-rebuild-2026')).toBe(true);
        expect(paths.has('/staging-site')).toBe(true);
    });
});

describe('[resolveHomepagePaths]', () => {
    it('reads API_HOME_PATHS from component-set env', () => {
        const paths = resolveHomepagePaths({
            env: {API_HOME_PATHS: '/arts-rebuild-2026'},
        });
        expect(paths.has('/arts-rebuild-2026')).toBe(true);
    });
});
