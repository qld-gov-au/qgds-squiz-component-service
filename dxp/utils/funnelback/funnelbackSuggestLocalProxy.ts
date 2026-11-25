import type http from 'node:http';

export const FUNNELBACK_SUGGEST_PROXY_PATH = '/__funnelback-suggest';

const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);

const PROXY_SKIP_RESPONSE_HEADERS = new Set([...HOP_BY_HOP, 'content-encoding', 'content-length']);

export function resolveFunnelbackSuggestUpstream(env: Record<string, string | undefined> = readProcessEnv()): string {
    return String(env.FUNNELBACK_SUGGEST_UPSTREAM ?? '').trim();
}

function readProcessEnv(): Record<string, string | undefined> {
    try {
        if (typeof process !== 'undefined' && process.env) {
            return process.env as Record<string, string | undefined>;
        }
    } catch {
        // ignore
    }
    return {};
}

function applyDevCors(res: http.ServerResponse, req: http.IncomingMessage): void {
    const origin = String(req.headers.origin ?? '').trim();
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}

/** Proxy GET/HEAD `/__funnelback-suggest` to Funnelback upstream (local dev CORS). */
export async function proxyFunnelbackSuggestRequest(req: http.IncomingMessage, res: http.ServerResponse, upstreamBase: string, fetchImpl: typeof fetch = fetch): Promise<void> {
    const method = String(req.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
    }

    const incoming = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    if (incoming.pathname !== FUNNELBACK_SUGGEST_PROXY_PATH) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
    }

    const upstreamUrl = new URL(upstreamBase);
    upstreamUrl.search = incoming.search;

    try {
        const upstream = await fetchImpl(upstreamUrl, {
            method,
            cache: 'no-store',
            headers: {
                Accept: String(req.headers.accept ?? 'application/json'),
                'Accept-Encoding': 'identity',
                'Cache-Control': 'no-cache',
            },
            redirect: 'follow',
        });

        applyDevCors(res, req);

        upstream.headers.forEach((value, key) => {
            if (PROXY_SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
                return;
            }
            res.setHeader(key, value);
        });
        res.statusCode = upstream.status;

        if (upstream.status === 304 || method === 'HEAD' || !upstream.body) {
            res.end();
            return;
        }

        res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
        console.error('[funnelback suggest dev proxy]', error);
        if (!res.writableEnded) {
            applyDevCors(res, req);
            res.statusCode = 502;
            res.end('Bad Gateway');
        }
    }
}
