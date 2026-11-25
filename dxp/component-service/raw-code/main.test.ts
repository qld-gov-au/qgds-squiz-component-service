import {describe, expect, it} from 'vitest';
import RawCode from './main.ts';
import previewData from './example.data.json';

const sampleEmbed = `<div class="advanced-form">
  <script src="https://example.com/form.js"></script>
</div>`;

describe('Raw code', () => {
    it('returns rawCode unchanged, including scripts and attributes', async () => {
        const result = await RawCode.main({rawCode: sampleEmbed});

        expect(result).toBe(sampleEmbed);
    });

    it('returns an empty string when input is undefined', async () => {
        const result = await RawCode.main(undefined);

        expect(result).toBe('');
    });

    it('returns an empty string when rawCode is missing', async () => {
        const result = await RawCode.main({});

        expect(result).toBe('');
    });

    it('returns an empty string when rawCode is blank', async () => {
        const result = await RawCode.main({rawCode: '   \n  '});

        expect(result).toBe('');
    });

    it('returns an empty string when rawCode is not a string', async () => {
        const result = await RawCode.main({rawCode: 42});

        expect(result).toBe('');
    });

    it('renders the preview fixture unchanged', async () => {
        const result = await RawCode.main(previewData);

        expect(result).toBe(previewData.rawCode);
    });
});
