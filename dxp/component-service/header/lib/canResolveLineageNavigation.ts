import {resolveAmapiConfigFromInfo} from '../../../utils/matrix/contentApiLocalProxy/index';
import type {DxpComponentInfo} from '../../../utils/matrix/siteLineage/types';
import {ensureLocalProjectEnvLoaded} from '../../../utils/loadProjectEnvFile';
import {hasAbsoluteHttpContentApiBase, resolveComponentEnv} from '../../../utils/matrix/pageUrl/index';

export function isLocalBoilerplateMxApi(value: string): boolean {
    const normalized = value.trim();
    if (!normalized) {
        return false;
    }
    if (normalized.includes('localhost:4000')) {
        return true;
    }
    return normalized === '/__api' || normalized.startsWith('/__api/');
}

/** True when site lineage can be fetched (Content API or AMAPI config on component info). */
export function canResolveLineageNavigation(info?: DxpComponentInfo): boolean {
    ensureLocalProjectEnvLoaded(info);

    if (resolveAmapiConfigFromInfo(info)) {
        return true;
    }

    const env = resolveComponentEnv(info);
    if (!hasAbsoluteHttpContentApiBase(info) || !String(env.BEARER_AUTH ?? '').trim()) {
        return false;
    }

    const {MX_API} = env;
    if (isLocalBoilerplateMxApi(MX_API)) {
        return false;
    }

    return true;
}
