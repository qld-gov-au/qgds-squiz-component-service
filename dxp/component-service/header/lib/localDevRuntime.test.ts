import {describe, expect, it} from 'vitest';
import {isLocalDevRuntime, isMatrixEnvComplete, listMissingMatrixEnvKeys} from './localDevRuntime';

describe('localDevRuntime', () => {
    it('reports missing Matrix env keys when env is empty', () => {
        expect(listMissingMatrixEnvKeys({env: {}})).toContain('API_IDENTIFIER');
    });

    it('reports incomplete env when only some keys are set', () => {
        expect(
            isMatrixEnvComplete({
                env: {BASE_DOMAIN: 'https://example.com'},
            }),
        ).toBe(false);
    });

    it('reports complete env when all Matrix keys are set', () => {
        const info = {
            env: {
                API_IDENTIFIER: 'token',
                BASE_DOMAIN: 'https://example.com',
                BASE_PATH: '/site',
                MX_API: 'https://api.example.com',
                BEARER_AUTH: 'bearer',
            },
        };
        expect(isMatrixEnvComplete(info)).toBe(true);
        expect(listMissingMatrixEnvKeys(info)).toHaveLength(0);
    });

    it('reads IS_LOCAL from component env', () => {
        expect(
            isLocalDevRuntime({
                env: {
                    IS_LOCAL: 'true',
                    API_IDENTIFIER: 'token',
                    BASE_DOMAIN: 'https://example.com',
                    BASE_PATH: '/site',
                    MX_API: 'https://api.example.com',
                    BEARER_AUTH: 'bearer',
                },
            }),
        ).toBe(true);
    });
});
