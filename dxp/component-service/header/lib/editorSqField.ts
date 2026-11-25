/** Inline CMS field path for Matrix editor (`info.ctx.editor`). */
export function editorSqField(editMode?: boolean, fieldPath?: string): string {
    if (!editMode || !fieldPath?.trim()) {
        return '';
    }
    return `data-sq-field="${fieldPath}"`;
}
