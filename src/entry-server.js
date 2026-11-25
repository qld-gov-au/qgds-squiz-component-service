import Index from '@pages/index.js';
import PatternLibrary from '@pages/pattern-library.js';
import Example from '@pages/example.js';

export async function render(url, ssrManifest) {
    // Define basic page templates or import your component-rendering logic here
    let htmlContent;
    let pageTitle;
    switch (url) {
        case '':
            pageTitle = 'index';
            htmlContent = await Index();
            break;
        case 'pattern-library':
            pageTitle = 'Pattern Library';
            htmlContent = await PatternLibrary();
            break;
        case 'example':
            pageTitle = 'Example';
            htmlContent = await Example();
            break;
        default:
            pageTitle = '404 Not Found';
            htmlContent = `<h1>404 - Page not found</h1>
      <p>😥 It is more than likely that you just need to add
      your page page to this file ./src/entry-server.js</p>
      `;
            break;
    }
    return {
        head: `<title>${pageTitle}</title>`, // Add other head elements if needed
        html: htmlContent,
    };
}
