import {createHash} from 'node:crypto';
import {mkdir, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {AmapiCacheEntry} from './amapiResponseCache.js';
import {resolveAmapiCacheTtlMs} from './amapiResponseCache.js';

const DEFAULT_CACHE_DIR = path.resolve(process.cwd(), 'src/components/utils/matrix/contentApiLocalProxy/cache');

export interface AmapiDiskCacheFile {
    key: string;
    entry: AmapiCacheEntry;
}

export function isAmapiDiskCacheEnabled(): boolean {
    return String(process.env.AMAPI_DISK_CACHE ?? '').trim() === '1';
}

export function resolveAmapiDiskCacheDir(): string {
    const override = String(process.env.AMAPI_DISK_CACHE_DIR ?? '').trim();
    if (override) {
        return path.resolve(override);
    }
    return DEFAULT_CACHE_DIR;
}

export function resolveAmapiDiskCacheTtlMs(): number {
    return resolveAmapiCacheTtlMs(process.env as unknown as Record<string, unknown>);
}

function cacheFilePath(cacheDir: string, key: string): string {
    const digest = createHash('sha256').update(key).digest('hex');
    return path.join(cacheDir, `${digest}.json`);
}

function isEntryFresh(entry: AmapiCacheEntry, cacheTtlMs: number): boolean {
    if (cacheTtlMs <= 0) return false;
    return Date.now() - entry.cachedAt < cacheTtlMs;
}

export async function readAmapiDiskCacheEntry(key: string, options: {cacheDir?: string; cacheTtlMs?: number} = {}): Promise<AmapiCacheEntry | null> {
    const cacheDir = options.cacheDir ?? resolveAmapiDiskCacheDir();
    const cacheTtlMs = options.cacheTtlMs ?? resolveAmapiDiskCacheTtlMs();
    const filePath = cacheFilePath(cacheDir, key);

    try {
        const raw = await readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw) as AmapiDiskCacheFile;
        const entry = parsed?.entry;
        if (!entry || typeof entry.cachedAt !== 'number') {
            return null;
        }
        if (!isEntryFresh(entry, cacheTtlMs)) {
            await unlink(filePath).catch(() => undefined);
            return null;
        }
        return entry;
    } catch {
        return null;
    }
}

export async function writeAmapiDiskCacheEntry(key: string, entry: AmapiCacheEntry, options: {cacheDir?: string} = {}): Promise<void> {
    const cacheDir = options.cacheDir ?? resolveAmapiDiskCacheDir();
    await mkdir(cacheDir, {recursive: true});
    const payload: AmapiDiskCacheFile = {key, entry};
    await writeFile(cacheFilePath(cacheDir, key), JSON.stringify(payload), 'utf8');
}
