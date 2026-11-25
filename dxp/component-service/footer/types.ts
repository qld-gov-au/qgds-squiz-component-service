import type {SquizLink} from '../../types/squiz.js';

export type FooterVariant = 'default' | 'dark' | 'dark-alt';

export type FooterContactType = 'phone' | 'email';

export type FooterSocialIcon = 'facebook' | 'instagram' | 'linkedin' | 'x' | 'youtube';

export interface FooterContactDetail {
    type?: FooterContactType;
    /** FormattedText. */
    label?: string;
}

export interface FooterContact {
    title?: string;
    /** FormattedText. */
    content?: string;
    button?: SquizLink;
    showList?: boolean;
    list?: FooterContactDetail[];
}

/** Government links. The list is fixed to the mandatory links unless the author sets it. */
export interface FooterLinkColumn {
    list?: SquizLink[];
}

export interface FooterFollowLink {
    icon?: FooterSocialIcon;
    accessibleLabel?: string;
    link?: SquizLink;
}

/** Optional column. Social and custom links belong to the column that shows them. */
export interface FooterOptionalColumn {
    title?: string;
    /** FormattedText. */
    content?: string;
    followLinks?: FooterFollowLink[];
    customLinks?: SquizLink[];
}

export interface FooterLogo {
    show?: boolean;
}

export interface FooterCopyright {
    /** FormattedText. */
    content?: string;
    /** First year of publication. Empty shows the current year only. */
    yearFrom?: string;
}

/** Manifest `input` for the footer `main` function. */
export interface FooterInput {
    variant?: FooterVariant;
    sitename?: string;
    contact?: FooterContact;
    footerLinks?: FooterLinkColumn;
    optionalColumn1?: FooterOptionalColumn;
    optionalColumn2?: FooterOptionalColumn;
    /** FormattedText. The heading is always "Acknowledgement of Country". */
    acknowledgement?: string;
    footerLogo?: FooterLogo;
    copyright?: FooterCopyright;
}
