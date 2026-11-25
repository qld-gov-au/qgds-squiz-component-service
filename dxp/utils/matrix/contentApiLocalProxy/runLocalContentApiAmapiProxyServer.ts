import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FUNNELBACK_SUGGEST_PROXY_PATH, proxyFunnelbackSuggestRequest, resolveFunnelbackSuggestUpstream} from '../../funnelback/funnelbackSuggestLocalProxy.js';
import {buildContentApiUrlCacheKey, cacheEntryFromResponse, responseFromCacheEntry} from './amapiResponseCache.js';
import {isAmapiDiskCacheEnabled, readAmapiDiskCacheEntry, writeAmapiDiskCacheEntry} from './amapiDiskCache.node.js';
import {createAmapiFetch} from './createAmapiFetch.js';
import {handleContentApiAmapiRequest} from './handleContentApiAmapiRequest.js';
import {resolveLocalAmapiConfig} from './resolveLocalAmapiConfig.js';
import type {ContentApiAmapiProxyConfig} from './types.js';

const DEFAULT_PORT = 4000;

const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);

export function resolveLocalContentApiProxyPort(): number {
    const raw = String(process.env.AMAPI_LOCAL_CONTENT_API_PORT ?? '').trim();
    const port = Number.parseInt(raw, 10);
    return Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT;
}

export function shouldStartLocalDevProxyServer(env: Record<string, string | undefined> = process.env as Record<string, string | undefined>): boolean {
    const funnelbackUpstream = resolveFunnelbackSuggestUpstream(env);
    if (funnelbackUpstream) {
        return true;
    }

    const diskCache = String(env.AMAPI_DISK_CACHE ?? '').trim() === '1' && Boolean(String(env.AMAPI_TOKEN ?? '').trim());
    return diskCache && Boolean(resolveLocalAmapiConfig());
}

async function respondFromProxy(config: ContentApiAmapiProxyConfig, requestUrl: string, method: string, res: http.ServerResponse): Promise<boolean> {
    const useDiskCache = isAmapiDiskCacheEnabled();
    const cacheKey = buildContentApiUrlCacheKey(requestUrl);
    const amapiFetch = createAmapiFetch(config);

    if (useDiskCache && method === 'GET') {
        const diskEntry = await readAmapiDiskCacheEntry(cacheKey);
        if (diskEntry) {
            const cached = responseFromCacheEntry(diskEntry);
            cached.headers.forEach((value, key) => {
                if (!HOP_BY_HOP.has(key.toLowerCase())) {
                    res.setHeader(key, value);
                }
            });
            res.statusCode = cached.status;
            if ((method as string) === 'HEAD') {
                res.end();
                return true;
            }
            res.end(Buffer.from(await cached.arrayBuffer()));
            return true;
        }
    }

    const response = await handleContentApiAmapiRequest(requestUrl, {
        amapiFetch,
    });
    if (!response) {
        return false;
    }

    if (useDiskCache && method === 'GET' && response.ok) {
        const entry = await cacheEntryFromResponse(response.clone());
        if (entry) {
            await writeAmapiDiskCacheEntry(cacheKey, entry);
        }
    }

    response.headers.forEach((value, key) => {
        if (!HOP_BY_HOP.has(key.toLowerCase())) {
            res.setHeader(key, value);
        }
    });
    res.statusCode = response.status;

    if (method === 'HEAD' || !response.body) {
        res.end();
        return true;
    }

    res.end(Buffer.from(await response.arrayBuffer()));
    return true;
}

/** Start localhost dev proxy (Content API → AMAPI and/or Funnelback suggest). */
export function startLocalContentApiAmapiProxyServer(options: {port?: number} = {}): http.Server {
    const amapiConfig = resolveLocalAmapiConfig();
    const funnelbackUpstream = resolveFunnelbackSuggestUpstream();

    if (!amapiConfig && !funnelbackUpstream) {
        throw new Error('Local dev proxy requires AMAPI config (AMAPI_TOKEN + Matrix origin) or FUNNELBACK_SUGGEST_UPSTREAM in .env');
    }

    const server = http.createServer((req, res) => {
        const method = String(req.method ?? 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
        }

        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

        if (url.pathname === FUNNELBACK_SUGGEST_PROXY_PATH) {
            if (!funnelbackUpstream) {
                res.statusCode = 503;
                res.end('Funnelback suggest upstream not configured');
                return;
            }
            void proxyFunnelbackSuggestRequest(req, res, funnelbackUpstream);
            return;
        }

        if (!url.pathname.startsWith('/__api/assets/')) {
            res.statusCode = 404;
            res.end('Not Found');
            return;
        }

        if (!amapiConfig) {
            res.statusCode = 404;
            res.end('Not Found');
            return;
        }

        const requestUrl = url.href;

        void respondFromProxy(amapiConfig, requestUrl, method, res).then((handled) => {
            if (!handled && !res.writableEnded) {
                res.statusCode = 404;
                res.end('Not Found');
            }
        });
    });

    const port = options.port ?? resolveLocalContentApiProxyPort();
    server.listen(port, () => {
        const routes = [amapiConfig ? `http://localhost:${port}/__api` : null, funnelbackUpstream ? `http://localhost:${port}${FUNNELBACK_SUGGEST_PROXY_PATH}` : null].filter(
            Boolean,
        );
        console.log(`[local dev proxy] listening ${routes.join(', ')}`);
    });

    return server;
}

const isProxyEntryScript = typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isProxyEntryScript && shouldStartLocalDevProxyServer()) {
    startLocalContentApiAmapiProxyServer();
}
