import {resolveSquizLink} from '../../../utils/squizLink.js';
import type {DxpComponentInfo} from '../../../utils/matrix/siteLineage/types.js';
import type {HeaderInput, HeaderPreHeaderAction} from './types.js';
import type {SquizLink} from '../../../types/squiz.js';

async function resolveOptionalLink(link: SquizLink | undefined, info?: DxpComponentInfo): Promise<SquizLink | undefined> {
    if (!link) {
        return link;
    }
    const resolved = await resolveSquizLink(link, info);
    return resolved ?? link;
}

async function resolveAction(action: HeaderPreHeaderAction, info?: DxpComponentInfo): Promise<HeaderPreHeaderAction> {
    const dropdown = action.dropdown;
    if (!dropdown) {
        return action;
    }

    const plainLink = dropdown.type === 'none' ? await resolveOptionalLink(dropdown.link, info) : undefined;

    const items = dropdown.items ?? [];
    const resolvedItems = await Promise.all(items.map((item) => resolveOptionalLink(item, info)));
    const viewMore = await resolveOptionalLink(dropdown.viewMore, info);

    const plainLinkChanged = dropdown.type === 'none' && plainLink !== dropdown.link;
    const itemsChanged = resolvedItems.some((item, index) => item !== items[index]);
    const viewMoreChanged = viewMore !== dropdown.viewMore;

    if (!plainLinkChanged && !itemsChanged && !viewMoreChanged) {
        return action;
    }

    return {
        ...action,
        dropdown: {
            ...dropdown,
            ...(plainLinkChanged ? {link: plainLink} : {}),
            items: resolvedItems.map((item, index) => item ?? items[index]),
            viewMore,
        },
    };
}

/** Resolve header SquizLink fields that use Matrix asset picker (`matrixAssetId`). */
export async function resolveHeaderSquizLinks(input: HeaderInput = {}, info?: DxpComponentInfo): Promise<HeaderInput> {
    const mainContent = input.mainContent;
    const resolvedBrandLink = mainContent?.url ? await resolveOptionalLink(mainContent.url, info) : undefined;
    const mainContentChanged = resolvedBrandLink !== undefined && resolvedBrandLink !== mainContent?.url;

    const preHeader = input.preHeader;
    let resolvedPreHeader = preHeader;

    if (preHeader) {
        const globalLink = await resolveOptionalLink(preHeader.globalLink, info);
        const actions = preHeader.actions ?? [];
        const resolvedActions = await Promise.all(actions.map((action) => resolveAction(action, info)));

        const globalUnchanged = globalLink === preHeader.globalLink;
        const actionsUnchanged = resolvedActions.every((action, index) => action === actions[index]);

        if (!globalUnchanged || !actionsUnchanged) {
            resolvedPreHeader = {
                ...preHeader,
                globalLink,
                actions: resolvedActions,
            };
        }
    }

    const preHeaderChanged = resolvedPreHeader !== preHeader;

    if (!mainContentChanged && !preHeaderChanged) {
        return input;
    }

    return {
        ...input,
        ...(mainContentChanged && mainContent
            ? {
                  mainContent: {
                      ...mainContent,
                      url: resolvedBrandLink,
                  },
              }
            : {}),
        ...(preHeaderChanged ? {preHeader: resolvedPreHeader} : {}),
    };
}
