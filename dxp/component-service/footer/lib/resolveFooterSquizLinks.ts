import type {SquizLink} from '../../../types/squiz.js';
import type {DxpComponentInfo} from '../../../utils/matrix/siteLineage/types.js';
import {resolveOptionalSquizLink} from '../../../utils/squizLink.js';
import type {FooterFollowLink, FooterInput, FooterOptionalColumn} from '../types.js';

async function resolveLinkList(links: SquizLink[] | undefined, info?: DxpComponentInfo): Promise<SquizLink[] | undefined> {
    if (!links) {
        return links;
    }
    const resolved = await Promise.all(links.map((link) => resolveOptionalSquizLink(link, info)));
    return resolved.map((link, index) => link ?? links[index]);
}

async function resolveFollowLinks(items: FooterFollowLink[] | undefined, info?: DxpComponentInfo): Promise<FooterFollowLink[] | undefined> {
    if (!items) {
        return items;
    }
    return Promise.all(
        items.map(async (item) => ({
            ...item,
            link: await resolveOptionalSquizLink(item.link, info),
        })),
    );
}

async function resolveOptionalColumn(column: FooterOptionalColumn | undefined, info?: DxpComponentInfo): Promise<FooterOptionalColumn | undefined> {
    if (!column) {
        return column;
    }
    const followLinks = await resolveFollowLinks(column.followLinks, info);
    const customLinks = await resolveLinkList(column.customLinks, info);
    return {
        ...column,
        ...(followLinks ? {followLinks} : {}),
        ...(customLinks ? {customLinks} : {}),
    };
}

/**
 * Resolve Matrix asset picks (`matrixAssetId`) on every SquizLink in the footer before
 * render, through the shared `resolveOptionalSquizLink`. Links without an asset id are
 * returned unchanged.
 */
export async function resolveFooterSquizLinks(input: FooterInput = {}, info?: DxpComponentInfo): Promise<FooterInput> {
    const contact = input.contact
        ? {
              ...input.contact,
              button: await resolveOptionalSquizLink(input.contact.button, info),
          }
        : undefined;

    const footerLinks = input.footerLinks
        ? {
              ...input.footerLinks,
              list: await resolveLinkList(input.footerLinks.list, info),
          }
        : undefined;

    const optionalColumn1 = await resolveOptionalColumn(input.optionalColumn1, info);
    const optionalColumn2 = await resolveOptionalColumn(input.optionalColumn2, info);

    return {
        ...input,
        ...(contact ? {contact} : {}),
        ...(footerLinks ? {footerLinks} : {}),
        ...(optionalColumn1 ? {optionalColumn1} : {}),
        ...(optionalColumn2 ? {optionalColumn2} : {}),
    };
}
