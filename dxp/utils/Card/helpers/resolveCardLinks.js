import {resolveSquizLink} from '../../squizLink.ts';

/**
 * Resolve Matrix asset picker SquizLinks on every card before render.
 * Covers heading.link, footer.cta and footer.links.items[].link.
 *
 * `info` is the Edge second argument; resolveSquizLink reads info.fns.
 */
export async function resolveCardLinks(cards, info) {
    return Promise.all((cards || []).map((card) => resolveCard(card, info)));
}

async function resolveCard(card, info) {
    if (!card) {
        return card;
    }

    const heading = card.heading ? {...card.heading, link: await resolveSquizLink(card.heading.link, info)} : card.heading;

    const footer = card.footer ? await resolveFooter(card.footer, info) : card.footer;

    return {...card, heading, footer};
}

async function resolveFooter(footer, info) {
    const cta = await resolveSquizLink(footer.cta, info);

    const items = footer.links?.items;
    const links = items
        ? {
              ...footer.links,
              items: await Promise.all(items.map(async (item) => (item ? {...item, link: await resolveSquizLink(item.link, info)} : item))),
          }
        : footer.links;

    return {...footer, cta, links};
}
