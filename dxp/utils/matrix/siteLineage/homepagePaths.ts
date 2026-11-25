import {resolveComponentEnv} from '../pageUrl/index.js';
import type {PageUrlComponentInfo} from '../pageUrl/types.js';
import {normalizeNavigationUrl} from './siteLineageToSectionNav.js';

/** Default homepage paths when `API_HOME_PATHS` is unset (always includes `/`). */
export function parseHomepagePathsFromEnv(apiHomePaths: string): ReadonlySet<string> {
    const paths = new Set<string>(['/']);
    const raw = String(apiHomePaths ?? '').trim();
    if (!raw) {
        return paths;
    }

    for (const segment of raw.split(',')) {
        const normalized = normalizeNavigationUrl(segment.trim());
        if (normalized) {
            paths.add(normalized);
        }
    }

    return paths;
}

/** Homepage paths from component-set `API_HOME_PATHS` (comma-separated) plus `/`. */
export function resolveHomepagePaths(info?: PageUrlComponentInfo): ReadonlySet<string> {
    const {API_HOME_PATHS} = resolveComponentEnv(info);
    return parseHomepagePathsFromEnv(API_HOME_PATHS);
}
