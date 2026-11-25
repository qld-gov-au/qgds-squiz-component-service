import {amapiAssetToLineageAsset, buildChildrenPayload, mergeLineagePayloads, normalizeAmapiChildLinks, normalizeAmapiParentLinks} from './amapiToContentApiShape.js';
import {isMenuLineageLink} from '../siteLineage/lineageLinks.js';
import type {AmapiFetch, HandleContentApiAmapiRequestOptions, SiteLineageAsset, SiteLineageLink, SiteLineagePayload} from './types.js';

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

function notFound(message: string): Response {
    return jsonResponse({message}, 404);
}

function upstreamError(response: Response): Response {
    return jsonResponse(
        {
            message: `AMAPI request failed with status ${response.status}`,
        },
        response.status,
    );
}

async function fetchAmapiAsset(amapiFetch: AmapiFetch, assetId: string, options: {logFailures?: boolean} = {}): Promise<SiteLineageAsset | null> {
    const response = await amapiFetch(`/assets/${encodeURIComponent(assetId)}`);
    if (!response.ok) {
        if (options.logFailures !== false) {
            console.error('[content-api amapi proxy] AMAPI asset GET failed', {
                assetId,
                status: response.status,
            });
        }
        return null;
    }
    const raw: unknown = await response.json();
    return amapiAssetToLineageAsset(raw);
}

async function fetchAmapiChildLinks(amapiFetch: AmapiFetch, parentAssetId: string): Promise<SiteLineageLink[]> {
    const response = await amapiFetch(`/assets/${encodeURIComponent(parentAssetId)}/links?direction=down`);
    if (!response.ok) {
        console.error('[content-api amapi proxy] AMAPI child links GET failed', {
            parentAssetId,
            status: response.status,
        });
        return [];
    }
    const raw: unknown = await response.json();
    return normalizeAmapiChildLinks(parentAssetId, raw);
}

async function fetchAmapiParentLinks(amapiFetch: AmapiFetch, childAssetId: string): Promise<SiteLineageLink[]> {
    const response = await amapiFetch(`/assets/${encodeURIComponent(childAssetId)}/links?direction=up`);
    if (!response.ok) {
        return [];
    }
    const raw: unknown = await response.json();
    return normalizeAmapiParentLinks(childAssetId, raw);
}

async function fetchChildrenPayload(amapiFetch: AmapiFetch, parentAssetId: string): Promise<Response> {
    const parentAsset = await fetchAmapiAsset(amapiFetch, parentAssetId);
    const links = await fetchAmapiChildLinks(amapiFetch, parentAssetId);

    if (!parentAsset && links.length === 0) {
        return notFound(`Asset ${parentAssetId} not found`);
    }
    const childAssets: SiteLineageAsset[] = [];

    for (const link of links) {
        if (!isMenuLineageLink(link)) {
            continue;
        }
        const childId = String(link.child_asset_id ?? '').trim();
        if (!childId) continue;
        const childAsset = await fetchAmapiAsset(amapiFetch, childId, {
            logFailures: false,
        });
        if (childAsset) {
            childAssets.push(childAsset);
        }
    }

    return jsonResponse(buildChildrenPayload(parentAssetId, links, childAssets, parentAsset));
}

async function fetchAssetPayload(amapiFetch: AmapiFetch, assetId: string): Promise<Response> {
    const response = await amapiFetch(`/assets/${encodeURIComponent(assetId)}`);
    if (!response.ok) {
        return upstreamError(response);
    }
    const raw: unknown = await response.json();
    const asset = amapiAssetToLineageAsset(raw);
    if (!asset) {
        return notFound(`Asset ${assetId} not found`);
    }
    return jsonResponse(asset);
}

async function fetchLineageSitePayload(amapiFetch: AmapiFetch, assetId: string, includeDependents: boolean): Promise<Response> {
    let merged: SiteLineagePayload = {links: [], assets: []};
    const visited = new Set<string>();
    let currentId = assetId;

    for (let depth = 0; depth < 20 && currentId; depth += 1) {
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const asset = await fetchAmapiAsset(amapiFetch, currentId);
        if (!asset) {
            if (depth === 0) {
                return notFound(`Asset ${assetId} not found`);
            }
            break;
        }

        merged = mergeLineagePayloads(merged, {
            assets: [asset],
            links: [],
        });

        if (String(asset.type ?? '') === 'site') {
            break;
        }

        if (includeDependents) {
            const childLinks = await fetchAmapiChildLinks(amapiFetch, currentId);
            const childAssets: SiteLineageAsset[] = [];
            for (const link of childLinks) {
                const childId = String(link.child_asset_id ?? '').trim();
                if (!childId) continue;
                const childAsset = await fetchAmapiAsset(amapiFetch, childId);
                if (childAsset) {
                    childAssets.push(childAsset);
                }
            }
            merged = mergeLineagePayloads(merged, buildChildrenPayload(currentId, childLinks, childAssets));
        }

        const parentLinks = await fetchAmapiParentLinks(amapiFetch, currentId);
        const parentLink = parentLinks[0];
        if (!parentLink) break;

        merged = mergeLineagePayloads(merged, {
            assets: [],
            links: [parentLink],
        });

        currentId = String(parentLink.parent_asset_id ?? '').trim();
        if (!currentId) break;
    }

    return jsonResponse(merged);
}

function parseContentApiPath(url: URL): {
    assetId?: string;
    route: 'children' | 'lineage-site' | 'asset' | 'unsupported';
} | null {
    const marker = '/__api/';
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) {
        return null;
    }

    const apiPath = url.pathname.slice(markerIndex + marker.length);
    const segments = apiPath.split('/').filter(Boolean);
    if (segments[0] !== 'assets') {
        return {route: 'unsupported'};
    }

    if (segments[1] === 'by_url' && segments[2] === 'lineage' && segments[3] === 'site') {
        return {route: 'lineage-site'};
    }

    const assetId = segments[1];
    if (!assetId) {
        return {route: 'unsupported'};
    }

    if (segments[2] === 'children') {
        return {assetId, route: 'children'};
    }

    if (segments[2] === 'lineage' && segments[3] === 'site') {
        return {assetId, route: 'lineage-site'};
    }

    if (segments.length === 2) {
        return {assetId, route: 'asset'};
    }

    return {route: 'unsupported'};
}

/**
 * Intercept a Content API GET and synthesize a response from AMAPI when supported.
 * Returns null when the URL should fall through to the real Content API / upstream proxy.
 */
export async function handleContentApiAmapiRequest(requestUrl: string, options: HandleContentApiAmapiRequestOptions): Promise<Response | null> {
    let url: URL;
    try {
        url = new URL(requestUrl);
    } catch {
        return null;
    }

    const parsed = parseContentApiPath(url);
    if (!parsed || parsed.route === 'unsupported') {
        return null;
    }

    const {amapiFetch} = options;

    if (parsed.route === 'children' && parsed.assetId) {
        return fetchChildrenPayload(amapiFetch, parsed.assetId);
    }

    if (parsed.route === 'asset' && parsed.assetId) {
        return fetchAssetPayload(amapiFetch, parsed.assetId);
    }

    if (parsed.route === 'lineage-site') {
        const includeDependents = url.searchParams.get('include_dependents') === 'true';
        if (parsed.assetId) {
            return fetchLineageSitePayload(amapiFetch, parsed.assetId, includeDependents);
        }
        return jsonResponse({message: 'by_url lineage is not supported by the local AMAPI proxy'}, 501);
    }

    return null;
}
