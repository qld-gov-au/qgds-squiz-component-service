import {createAmapiFetch} from './createAmapiFetch.js';
import {handleContentApiAmapiRequest} from './handleContentApiAmapiRequest.js';
import type {ContentApiAmapiProxyConfig} from './types.js';

const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);

/** Express middleware: synthesize GET /__api/assets/* from AMAPI when configured. */
export function contentApiAmapiProxyMiddleware(config: ContentApiAmapiProxyConfig) {
    const amapiFetch = createAmapiFetch(config);

    return async (
        req: {
            method?: string;
            path?: string;
            originalUrl?: string;
            headers?: {host?: string};
        },
        res: {
            status: (code: number) => unknown;
            setHeader: (name: string, value: string) => unknown;
            end: (body?: Buffer | string) => unknown;
            headersSent?: boolean;
        },
        next: () => void,
    ) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            next();
            return;
        }

        if (!req.path?.startsWith('/__api/assets/')) {
            next();
            return;
        }

        const host = req.headers?.host ?? 'localhost';
        const requestUrl = new URL(req.originalUrl ?? req.path ?? '', `http://${host}`).href;

        try {
            const response = await handleContentApiAmapiRequest(requestUrl, {
                amapiFetch,
            });

            if (!response) {
                next();
                return;
            }

            response.headers.forEach((value, key) => {
                if (!HOP_BY_HOP.has(key.toLowerCase())) {
                    res.setHeader(key, value);
                }
            });
            res.status(response.status);

            if (req.method === 'HEAD' || !response.body) {
                res.end();
                return;
            }

            const body = Buffer.from(await response.arrayBuffer());
            res.end(body);
        } catch (error) {
            console.error('[content-api amapi proxy]', error);
            if (!res.headersSent) {
                res.status(502);
                res.end('Bad Gateway');
            }
        }
    };
}
