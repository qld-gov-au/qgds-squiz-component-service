/**
 * Table component
 */
import {html} from '../../utils/html.js';
import {xssSafeContent} from '../../utils/xss.js';

/**
 * Escape a value for a double-quoted HTML attribute.
 * xssSafeContent filters tags only, so it does not stop a quote from closing an attribute.
 */
function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export default {
    async main(input, componentUtilities) {
        const componentContext = componentUtilities?.ctx || null;
        const editMode = componentContext?.editor || false;

        const {tableSettings = {}, captionOptions = {}, columnHeadersOptions = {}, rowsOptions = {}, footerRowOptions = {}, wrapperClasses} = input || {};

        const {variantClass = 'default', striped = false, hover = false, customClass = ''} = tableSettings;
        const {caption = '', subcaption = ''} = captionOptions;
        const headers = columnHeadersOptions?.headers ?? [];
        const rows = rowsOptions?.rows ?? [];
        const footerCells = footerRowOptions?.cells ?? [];

        const tableWrapperClass = ['table-responsive', 'qld-table', customClass].filter(Boolean).join(' ').trim();
        const tableClass = ['table', variantClass === 'dark' && 'table-dark', striped && 'table-striped', hover && 'table-hover'].filter(Boolean).join(' ').trim();

        const hasCaption = editMode || (caption != null && String(caption).trim() !== '') || (subcaption != null && String(subcaption).trim() !== '');

        const canEdit = editMode && rows?.length < 10;
        const theadSection =
            Array.isArray(headers) && headers.length > 0
                ? html`<thead>
                      <tr>
                          ${headers
                              .map(
                                  (h, i) =>
                                      html`<th scope="col">
                                          <span ${canEdit ? `data-sq-field="columnHeadersOptions.headers[${i}]"` : ''}>${xssSafeContent(String(h ?? ''))}</span>
                                      </th>`,
                              )
                              .join('')}
                      </tr>
                  </thead>`
                : '';

        const tbodySection = html`<tbody>
            ${
                Array.isArray(rows)
                    ? rows
                          .map(
                              (row, rowIndex) =>
                                  html`<tr>
                                      ${(row?.cells ?? [])
                                          .map((cell, cellIndex) => {
                                              const cellVal = typeof cell === 'string' ? cell : (cell?.value ?? '');
                                              const style = typeof cell === 'string' ? 'default' : (cell?.style ?? 'default');
                                              const tdClass = variantClass !== 'dark' && (style === 'correct' ? 'qg-correct' : style === 'incorrect' ? 'qg-incorrect' : '');
                                              return html`<td ${tdClass ? `class="${tdClass}"` : ''}>
                                                  <span ${canEdit ? `data-sq-field="rowsOptions.rows[${rowIndex}].cells[${cellIndex}].value"` : ''}
                                                      >${xssSafeContent(String(cellVal))}</span
                                                  >
                                              </td>`;
                                          })
                                          .join('')}
                                  </tr>`,
                          )
                          .join('')
                    : ''
            }
        </tbody>`;

        const hasFooter = Array.isArray(footerCells) && footerCells.length > 0;
        const tfootSection = hasFooter
            ? html`<tfoot>
                  <tr>
                      ${footerCells
                          .map(
                              (cell, i) =>
                                  html`<td>
                                      <span ${canEdit ? `data-sq-field="footerRowOptions.cells[${i}]"` : ''}>${xssSafeContent(String(cell ?? ''))}</span>
                                  </td>`,
                          )
                          .join('')}
                  </tr>
              </tfoot>`
            : '';

        const captionSection = hasCaption
            ? html`<caption class="caption">
                  <span ${canEdit ? `data-sq-field="captionOptions.caption"` : ''}>${caption != null ? xssSafeContent(caption) : ''}</span>
                  ${
                      subcaption != null && String(subcaption).trim() !== ''
                          ? html`<span class="sub-caption" ${canEdit ? `data-sq-field="captionOptions.subcaption"` : ''}>${xssSafeContent(subcaption)}</span>`
                          : ''
                  }
              </caption>`
            : '';

        return html`<div class="${escapeAttribute(`${tableWrapperClass} ${wrapperClasses || ''}`.trim())}">
            <table class="${tableClass}">
                ${captionSection} ${theadSection} ${tbodySection} ${tfootSection}
            </table>
        </div>`;
    },
};
