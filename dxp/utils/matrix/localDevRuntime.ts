import {ensureLocalProjectEnvLoaded} from '../loadProjectEnvFile.js';
import {resolveComponentEnv} from './pageUrl/index.js';
import type {DxpComponentInfo} from './siteLineage/types.js';

/**
 * Local cut-up dev detection and Matrix env checks. Shared by every component that
 * needs to know whether it runs under `dev:dxp` (header, footer, SquizLink resolution).
 */

const MATRIX_ENV_KEYS = ['API_IDENTIFIER', 'BASE_DOMAIN', 'BASE_PATH', 'MX_API', 'BEARER_AUTH'] as const;

function isTruthyEnvFlag(value: unknown): boolean {
    const normalized = String(value ?? '')
        .trim()
        .toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function readIsLocalFromComponentInfo(info?: DxpComponentInfo): boolean {
    const sources = [info?.env?.IS_LOCAL, info?.environment?.IS_LOCAL, info?.set?.env?.IS_LOCAL, info?.set?.environment?.IS_LOCAL];

    return sources.some(isTruthyEnvFlag);
}

/** True when local cut-up dev (`IS_LOCAL` in component env or Node `process.env`). */
export function isLocalDevRuntime(info?: DxpComponentInfo): boolean {
    ensureLocalProjectEnvLoaded(info);
    if (readIsLocalFromComponentInfo(info)) {
        return true;
    }

    try {
        if (typeof process !== 'undefined' && process.env) {
            return isTruthyEnvFlag(process.env.IS_LOCAL);
        }
    } catch {
        // Edge may restrict process access.
    }
    return false;
}

export function listMissingMatrixEnvKeys(info?: DxpComponentInfo): string[] {
    ensureLocalProjectEnvLoaded(info);
    const env = resolveComponentEnv(info);
    const missing: string[] = [];
    for (const key of MATRIX_ENV_KEYS) {
        if (!String(env[key] ?? '').trim()) {
            missing.push(key);
        }
    }
    return missing;
}

export function isMatrixEnvComplete(info?: DxpComponentInfo): boolean {
    return listMissingMatrixEnvKeys(info).length === 0;
}
