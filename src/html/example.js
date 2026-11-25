// template imports
import {Header} from '@global_components/header/header';
import {Footer} from '@global_components/footer/footer';
import {Example} from '@global_components/content/example';

// render template
export default async function () {
    return `
    ${Header}
    <main class="container">
      ${Example}
    </main>
    ${Footer}
  `;
}
