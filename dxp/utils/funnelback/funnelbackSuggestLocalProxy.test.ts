import type http from 'node:http';
import {describe, expect, it, vi} from 'vitest';
import {FUNNELBACK_SUGGEST_PROXY_PATH, proxyFunnelbackSuggestRequest, resolveFunnelbackSuggestUpstream} from './funnelbackSuggestLocalProxy.js';

function createMockResponse(): http.ServerResponse & {
    headers: Record<string, string | number>;
    body: Buffer | string | undefined;
} {
    const headers: Record<string, string | number> = {};
    const res = {
        statusCode: 200,
        writableEnded: false,
        headers,
        body: undefined as Buffer | string | undefined,
        setHeader(name: string, value: string | number) {
            headers[name.toLowerCase()] = value;
        },
        end(chunk?: Buffer | string) {
            this.body = chunk;
            this.writableEnded = true;
        },
    };
    return res as http.ServerResponse & {
        headers: Record<string, string | number>;
        body: Buffer | string | undefined;
    };
}

describe('resolveFunnelbackSuggestUpstream', () => {
    it('reads FUNNELBACK_SUGGEST_UPSTREAM from env record', () => {
        expect(
            resolveFunnelbackSuggestUpstream({
                FUNNELBACK_SUGGEST_UPSTREAM: 'https://ssqld-search.funnelback.squiz.cloud/s/suggest.json',
            }),
        ).toBe('https://ssqld-search.funnelback.squiz.cloud/s/suggest.json');
    });
});

describe('proxyFunnelbackSuggestRequest', () => {
    it('forwards query string to upstream and sets CORS', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            status: 200,
            headers: new Headers({'content-type': 'application/json'}),
            body: new ReadableStream(),
            arrayBuffer: async () => new TextEncoder().encode('["arts"]').buffer,
        });

        const req = {
            method: 'GET',
            url: `${FUNNELBACK_SUGGEST_PROXY_PATH}?collection=ssqld~sp-arts-queensland&partial_query=arts`,
            headers: {host: 'localhost:4000', accept: 'application/json'},
        } as http.IncomingMessage;

        const res = createMockResponse();

        await proxyFunnelbackSuggestRequest(req, res, 'https://ssqld-search.funnelback.squiz.cloud/s/suggest.json', fetchImpl);

        expect(fetchImpl).toHaveBeenCalledOnce();
        const calledUrl = String(fetchImpl.mock.calls[0]?.[0]);
        expect(calledUrl).toContain('partial_query=arts');
        expect(calledUrl).toContain('collection=ssqld');
        expect(res.statusCode).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('*');
        expect(Buffer.from(res.body as Buffer).toString()).toBe('["arts"]');
    });

    it('returns 404 for wrong path', async () => {
        const req = {
            method: 'GET',
            url: '/other',
            headers: {host: 'localhost:4000'},
        } as http.IncomingMessage;
        const res = createMockResponse();

        await proxyFunnelbackSuggestRequest(req, res, 'https://example/s/suggest.json', vi.fn());

        expect(res.statusCode).toBe(404);
    });
});
