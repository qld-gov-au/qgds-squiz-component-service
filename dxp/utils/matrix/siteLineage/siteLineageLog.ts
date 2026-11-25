/** Standard log labels for siteLineage fetch/transform diagnostics (DXP console.error). */
export const SITE_LINEAGE_LOG_LABELS = {
    relatedContent: 'Related content',
    headerNav: 'Header Nav',
    headerMetadata: 'Header metadata',
    inThisSection: 'In this section',
} as const;

export type SiteLineageLogLabel = (typeof SITE_LINEAGE_LOG_LABELS)[keyof typeof SITE_LINEAGE_LOG_LABELS];

/** Resolve a siteLineage log label, defaulting to Related content. */
export function resolveSiteLineageLogLabel(logLabel?: string): SiteLineageLogLabel | string {
    const trimmed = typeof logLabel === 'string' ? logLabel.trim() : '';
    return trimmed || SITE_LINEAGE_LOG_LABELS.relatedContent;
}

/**
 * siteLineage diagnostics are off by default, so normal renders stay quiet.
 * Set `SITE_LINEAGE_DEBUG=true` in the repo `.env` for local `dev:dxp` debugging.
 * Edge has no `process.env`, so diagnostics stay off there.
 */
export function isSiteLineageDebugEnabled(): boolean {
    if (typeof process === 'undefined' || !process.env) {
        return false;
    }

    const value = String(process.env.SITE_LINEAGE_DEBUG ?? '')
        .trim()
        .toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
}

/** Emit a prefixed siteLineage diagnostic line to DXP logs (only when debugging is enabled). */
export function siteLineageLog(logLabel: string, message: string, payload?: unknown): void {
    if (!isSiteLineageDebugEnabled()) {
        return;
    }

    if (payload === undefined) {
        console.error(`${logLabel}: ${message}`);
        return;
    }

    console.error(`${logLabel}: ${message}`, payload);
}
