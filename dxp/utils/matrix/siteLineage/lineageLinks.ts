import type {SiteLineageLink, SiteLineagePayload} from './types.js';

/**
 * Normalised Matrix link kind.
 *
 * - `menu`: Type 1 (shown in menus / navigation)
 * - `hidden`: Type 2 (eye-slash in the asset tree; hidden from menus)
 * - `reference`: reference link
 * - `other`: Type 3, notice, `invisible`, or any value we do not recognise
 * - `missing`: no usable `link_type` / `type` was supplied
 */
export type LineageLinkKind = 'menu' | 'hidden' | 'reference' | 'other' | 'missing';

const OBJECT_LINK_TYPE_KEYS = ['code', 'value', 'id', 'name', 'link_type', 'type'] as const;

function classifyLinkTypeScalar(raw: string | number): LineageLinkKind {
    if (typeof raw === 'number') {
        if (!Number.isFinite(raw)) return 'missing';
        if (raw === 1) return 'menu';
        if (raw === 2) return 'hidden';
        return 'other';
    }

    const normalized = raw
        .trim()
        .toLowerCase()
        .replace(/^sq_link_/, '');

    if (!normalized) return 'missing';
    if (normalized === 'menu' || normalized === 'navigation') return 'menu';
    if (normalized === 'hidden') return 'hidden';
    if (normalized === 'reference') return 'reference';

    const typed = /^(?:link[\s_-]*)?type[\s_-]*(\d+)$/.exec(normalized);
    const numeric = typed?.[1] ?? (/^\d+$/.test(normalized) ? normalized : '');
    if (numeric) {
        const value = Number.parseInt(numeric, 10);
        if (value === 1) return 'menu';
        if (value === 2) return 'hidden';
        return 'other';
    }

    return 'other';
}

/**
 * Classify a Content API link type value.
 *
 * Content API values are not always scalars: accepts numbers, strings (`1`,
 * `type_2`, `Type 2`, `SQ_LINK_TYPE_2`, `menu`, `hidden`), arrays, and
 * `{ id | code | value | name }` objects.
 */
export function normalizeLinkTypeValue(raw: unknown): LineageLinkKind {
    if (raw == null) return 'missing';

    if (typeof raw === 'number' || typeof raw === 'string') {
        return classifyLinkTypeScalar(raw);
    }

    if (Array.isArray(raw)) {
        for (const entry of raw) {
            const kind = normalizeLinkTypeValue(entry);
            if (kind !== 'missing') return kind;
        }
        return 'missing';
    }

    if (typeof raw === 'object') {
        const record = raw as Record<string, unknown>;
        for (const key of OBJECT_LINK_TYPE_KEYS) {
            if (!(key in record)) continue;
            const kind = normalizeLinkTypeValue(record[key]);
            if (kind !== 'missing') return kind;
        }
        return 'other';
    }

    return 'other';
}

/** Raw link type from a lineage link: `link_type` (proxy / fixtures) or `type` (real Content API). */
export function getRawLinkType(link: SiteLineageLink | null | undefined): unknown {
    if (!link || typeof link !== 'object') return undefined;
    return normalizeLinkTypeValue(link.link_type) !== 'missing' ? link.link_type : link.type;
}

/**
 * Normalised kind for a lineage link (`missing` when the link or type is absent).
 *
 * The real Content API sends the Matrix link type as `type` (1, 2, 4, 8) with no
 * `link_type`; the local AMAPI proxy and fixtures send `link_type`. Both are read.
 */
export function resolveLineageLinkKind(link: SiteLineageLink | null | undefined): LineageLinkKind {
    if (!link || typeof link !== 'object') return 'missing';
    return normalizeLinkTypeValue(getRawLinkType(link));
}

/**
 * Menu-visible edge: Type 1 only. Type 2 (hidden), Type 3, notice, reference,
 * unknown and missing link types are not menu links.
 */
export function isMenuLineageLink(link: SiteLineageLink | null | undefined): boolean {
    return resolveLineageLinkKind(link) === 'menu';
}

function linkLookupKey(parentId: string, childId: string): string {
    return `${parentId}->${childId}`;
}

/**
 * Build a lookup of inbound links.
 *
 * Entries are stored under `parent->child` (preferred) and under the bare child
 * id as a fallback for callers that do not know the parent.
 */
export function buildLineageLinkLookup(links: SiteLineageLink[] | undefined): Map<string, SiteLineageLink> {
    const lookup = new Map<string, SiteLineageLink>();

    for (const link of Array.isArray(links) ? links : []) {
        if (!link || typeof link !== 'object') continue;
        const childId = String(link.child_asset_id ?? '').trim();
        if (!childId) continue;

        const parentId = String(link.parent_asset_id ?? '').trim();
        if (parentId) {
            lookup.set(linkLookupKey(parentId, childId), link);
        }
        lookup.set(childId, link);
    }

    return lookup;
}

/** Look up the link for a child, preferring the exact `parent->child` edge. */
export function getLineageLinkForChild(childId: string, linkLookup: Map<string, SiteLineageLink>, parentId?: string): SiteLineageLink | undefined {
    const parent = typeof parentId === 'string' ? parentId.trim() : '';
    if (parent) {
        const exact = linkLookup.get(linkLookupKey(parent, childId));
        if (exact) return exact;
    }
    return linkLookup.get(childId);
}

/** A link record is Type 2 (hidden). Missing or undefined links are not hidden. */
export function isHiddenMenuLink(link: SiteLineageLink | null | undefined): boolean {
    return resolveLineageLinkKind(link) === 'hidden';
}

/** The link into `childId` is hidden (TYPE_2), regardless of parent. */
export function isHiddenLinkedAsset(childId: string, linkLookup: Map<string, SiteLineageLink>): boolean {
    return isHiddenMenuLink(linkLookup.get(childId));
}

/** The link into `childId` comes from `parentId` and is hidden (TYPE_2). */
export function isHiddenLinkFromParent(parentId: string, childId: string, linkLookup: Map<string, SiteLineageLink>): boolean {
    const link = linkLookup.get(childId);
    if (!link) return false;
    if (String(link.parent_asset_id ?? '').trim() !== parentId) return false;
    return isHiddenMenuLink(link);
}

/**
 * Inbound parent→child edge is Type 1 (menu). Missing link metadata and missing
 * link records are not visible. Non-menu edges must not appear in header nav,
 * section nav or expand fetches.
 */
export function isMenuLinkedChild(childId: string, linkLookup: Map<string, SiteLineageLink>, parentId?: string): boolean {
    return isMenuLineageLink(getLineageLinkForChild(childId, linkLookup, parentId));
}

/**
 * Prefer menu links when the children API returns typed links.
 * Keeps the full asset list — display filtering happens in transforms.
 */
export function preferMenuLineageLinks(payload: SiteLineagePayload): SiteLineagePayload {
    const rawLinks = Array.isArray(payload?.links) ? payload.links : [];
    const menuLinks = rawLinks.filter(isMenuLineageLink);
    const links = menuLinks.length > 0 ? menuLinks : rawLinks;
    const assets = Array.isArray(payload?.assets) ? payload.assets : [];

    return {links, assets};
}
