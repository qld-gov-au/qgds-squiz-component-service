let loadAttempted = false;

function isEdgeLikeComponentRuntime(info?: unknown): boolean {
    if (!info || typeof info !== 'object') {
        return false;
    }

    const record = info as {
        ctx?: {resolveUri?: unknown; resolveMatrixAssetById?: unknown};
        fns?: {resolveUri?: unknown; resolveMatrixAssetById?: unknown};
    };

    if (typeof record.fns?.resolveUri === 'function' || typeof record.fns?.resolveMatrixAssetById === 'function') {
        return true;
    }

    return typeof record.ctx?.resolveUri === 'function' || typeof record.ctx?.resolveMatrixAssetById === 'function';
}

function tryLoadEnvFile(filePath: string): boolean {
    if (typeof process.loadEnvFile !== 'function') {
        return false;
    }
    try {
        process.loadEnvFile(filePath);
        return true;
    } catch {
        return false;
    }
}

function localEnvFileCandidates(): string[] {
    try {
        if (typeof process === 'undefined' || typeof process.cwd !== 'function') {
            return [];
        }
        const cwd = process.cwd();
        if (!cwd) {
            return [];
        }
        return [`${cwd}/.env`];
    } catch {
        return [];
    }
}

/**
 * Load repo `.env` into `process.env` for local Node (e.g. `dxp-next cmp dev-ui` host process).
 * No-op on Edge/Miniflare and under Vitest. Does not override variables already set on `process.env`.
 *
 * Must not use module-level `import.meta.url` or `node:*` imports — this file is bundled into Edge components.
 */
export function ensureLocalProjectEnvLoaded(info?: unknown): void {
    if (loadAttempted) {
        return;
    }
    loadAttempted = true;

    if (typeof process === 'undefined' || !process.env) {
        return;
    }

    if (process.env.VITEST) {
        return;
    }

    if (isEdgeLikeComponentRuntime(info)) {
        return;
    }

    for (const envPath of localEnvFileCandidates()) {
        if (tryLoadEnvFile(envPath)) {
            return;
        }
    }
}
