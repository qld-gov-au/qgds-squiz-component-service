import {mkdtemp, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {readAmapiDiskCacheEntry, writeAmapiDiskCacheEntry} from './amapiDiskCache.node.js';

describe('amapiDiskCache.node', () => {
    let tempDir = '';

    afterEach(async () => {
        vi.useRealTimers();
        if (tempDir) {
            await rm(tempDir, {recursive: true, force: true});
            tempDir = '';
        }
    });

    it('writes and reads a cache entry', async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'amapi-disk-cache-'));
        const key = 'http://localhost:4000/__api/assets/465';
        const entry = {
            status: 200,
            bodyText: '{"id":"465"}',
            contentType: 'application/json',
            cachedAt: Date.now(),
        };

        await writeAmapiDiskCacheEntry(key, entry, {cacheDir: tempDir});
        const loaded = await readAmapiDiskCacheEntry(key, {
            cacheDir: tempDir,
            cacheTtlMs: 60_000,
        });

        expect(loaded?.bodyText).toBe(entry.bodyText);
    });

    it('returns null for expired entries', async () => {
        vi.useFakeTimers();
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'amapi-disk-cache-'));
        const key = 'expired-key';
        const entry = {
            status: 200,
            bodyText: '{}',
            contentType: 'application/json',
            cachedAt: Date.now(),
        };

        await writeAmapiDiskCacheEntry(key, entry, {cacheDir: tempDir});
        vi.advanceTimersByTime(2000);

        const loaded = await readAmapiDiskCacheEntry(key, {
            cacheDir: tempDir,
            cacheTtlMs: 1000,
        });

        expect(loaded).toBeNull();
    });
});
