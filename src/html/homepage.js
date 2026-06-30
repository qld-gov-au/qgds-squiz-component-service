// template imports
import { Navigation } from '@global_components/navigation/navigation';
import { Footer } from '@global_components/footer/footer';

// render template
export default async function () {
  return `
    ${Navigation}
    <main class="container">
      <!--@@ cmp edge-dxp-comp-lib/blockquote @@-->
    </main>
    ${Footer}
  `;
}
