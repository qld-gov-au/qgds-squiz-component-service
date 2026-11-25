import {describe, expect, it} from 'vitest';
import {resolvePreviewNavigationFromInput} from './resolvePreviewNavigationFromInput';

describe('resolvePreviewNavigationFromInput', () => {
    it('returns null when navigation is missing', () => {
        expect(resolvePreviewNavigationFromInput({})).toBeNull();
    });

    it('returns navigation and metadata from preview-shaped input', () => {
        const result = resolvePreviewNavigationFromInput({
            previewNavigation: [{text: 'Home', url: '/'}],
            navbarMetadata: {navbarBrandName: 'Site menu'},
        });
        expect(result?.navigation).toHaveLength(1);
        expect(result?.metadata.navbarBrandName).toBe('Site menu');
    });
});
