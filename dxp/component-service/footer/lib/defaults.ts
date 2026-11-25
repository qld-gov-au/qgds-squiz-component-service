import type {SquizLink} from '../../../types/squiz.js';
import type {FooterContactDetail} from '../types.js';

/*
 * Fallbacks used when the author leaves a field empty. Copied from footer.hbs
 * so the Edge output matches the Storybook default, except where the QGDS spec
 * differs (see README "Markup parity").
 */

export const DEFAULT_CONTACT_TITLE = 'Contact us';

export const DEFAULT_CONTACT_CONTENT = '<p>Get in touch for enquiries, feedback, complaints and compliments.</p>';

export const DEFAULT_CONTACT_BUTTON: SquizLink = {
    text: 'Contact us',
    url: 'https://www.qld.gov.au/contact-us',
};

export const DEFAULT_CONTACT_LIST: FooterContactDetail[] = [
    {
        type: 'phone',
        label: '<b>Phone:</b> <a href="tel:137468" rel="noopener">13 QGOV (13 74 68)</a>',
    },
    {
        type: 'email',
        label: '<b>Email:</b> <a href="mailto:email@qld.gov.au" rel="noopener"><span class="user-select-all">email@qld.gov.au</span></a>',
    },
];

/**
 * Mandatory Queensland Government links, used when the author list is empty.
 * Order and content follow items 1-7 of the QGDS footer spec. "Crown copyright"
 * is not a link: the spec and ForGov checkpoint 34 treat it as the copyright
 * statement, which renderFooter outputs in the legal column. Help is not in the
 * spec list.
 */
export const DEFAULT_GOVERNMENT_LINKS: SquizLink[] = [
    {text: 'Copyright', url: 'https://www.qld.gov.au/legal/copyright'},
    {text: 'Disclaimer', url: 'https://www.qld.gov.au/legal/disclaimer'},
    {text: 'Privacy', url: 'https://www.qld.gov.au/legal/privacy'},
    {
        text: 'Right to information',
        url: 'https://www.qld.gov.au/about/rights-accountability/right-to-information',
    },
    {text: 'Accessibility', url: 'https://www.qld.gov.au/help/accessibility'},
    {
        text: 'Jobs in Queensland Government',
        url: 'https://smartjobs.qld.gov.au',
        target: '_blank',
    },
    {text: 'Other languages', url: 'https://www.qld.gov.au/help/languages'},
];

/** Fixed heading above the acknowledgement. The QGDS spec includes a header on the Acknowledgement of Country. */
export const DEFAULT_ACKNOWLEDGEMENT_HEADING = 'Acknowledgement of Country';

export const DEFAULT_ACKNOWLEDGEMENT_PARAGRAPH =
    'We pay our respects to the Aboriginal and Torres Strait Islander ancestors of this land, their spirits and their legacy. The foundations laid by these ancestors—our First Nations peoples—give strength, inspiration and courage to current and future generations towards creating a better Queensland.';

export const DEFAULT_COPYRIGHT_TEXT = '© The State of Queensland';

/** Organisation link (QGDS spec item 9). Always shown. Not editable. */
export const ORGANISATION_LINK_TEXT = 'Queensland Government';
export const ORGANISATION_LINK_URL = 'https://www.qld.gov.au';
