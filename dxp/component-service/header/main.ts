import {renderHeaderBanner} from './lib/renderHeaderBanner';
import {renderPrimaryNavbar} from './lib/renderPrimaryNavbar';
import {resolveNavbarPayload} from './lib/resolveNavbarPayload';
import {resolveHeaderSquizLinks} from './lib/resolveHeaderSquizLinks';
import {renderPreHeader} from './lib/renderPreHeader';
import type {DxpComponentInfo} from '../../utils/matrix/siteLineage/types';
import type {HeaderInput} from './lib/types';
import {xssSafeContent} from '../../utils/xss';
import {editorSqField} from './lib/editorSqField';
import {isLocalDevRuntime} from './lib/localDevRuntime';

export default {
    async main(input: HeaderInput = {}, info?: DxpComponentInfo) {
        const isLocal = isLocalDevRuntime(info);
        const editMode = Boolean(info?.ctx?.editor || isLocal);
        const {navigation, metadata} = await resolveNavbarPayload(info, input);

        const resolvedInput = await resolveHeaderSquizLinks(input, info);
        const preHeaderHtml = renderPreHeader({input: resolvedInput, editMode});

        const bannerHtml = renderHeaderBanner({
            input: resolvedInput,
            editMode,
            info,
        });

        const navigationId = input.componentAdvancedOptions?.id?.trim() || undefined;

        const navbarHtml = renderPrimaryNavbar({
            navigation,
            metadata,
            editMode,
            navigationId,
        });

        const advancedClasses = input.componentAdvancedOptions?.classes?.trim() || '';

        return `
      <header
        class="qld-header ${xssSafeContent(advancedClasses)}"
        role="banner"
        ${editorSqField(editMode, 'componentAdvancedOptions.classes')}
      >
        ${preHeaderHtml}
        ${bannerHtml}
      </header>
      ${navbarHtml}
    `;
    },
};
