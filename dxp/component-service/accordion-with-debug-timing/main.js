import {html} from '../../utils/html';
import {xssSafeContent} from '../../utils/xss';
import {createComponentDebugMark} from '../../utils/component-debug.js';

export default {
    async main({title, accordion}) {
        const debugMark = createComponentDebugMark('accordion-with-debug-timing');

        debugMark('main started');
        debugMark(`config ready titlePresent=${Boolean(title)} accordionCount=${accordion?.length ?? 0}`);

        debugMark('starting HTML markup render');
        const markup = html`
            <section class="accordion">
                ${title ? `<h2 class="heading-secondary">${xssSafeContent(title)}</h2>` : ''}

                ${accordion
                    .map(
                        (item) => html`
                            <details class="accordion__item">
                                <summary class="accordion__heading">${xssSafeContent(item.heading)}</summary>
                                <div class="accordion__content">${xssSafeContent(item.content)}</div>
                            </details>
                        `,
                    )
                    .join('')}
            </section>
        `;
        debugMark(`HTML markup render complete length=${markup?.length ?? 0}`);
        debugMark('main complete');

        return markup;
    },
};
