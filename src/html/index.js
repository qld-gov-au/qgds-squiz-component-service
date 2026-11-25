// render template
export default async function () {
    return /* HTML */ `
        <main style="display: flex; justify-content: center; margin-top: 30px;">
            <div>
                <h2>Pages</h2>
                <ul>
                    <li>
                        <a href="/example">Example page</a> - contains:
                        <ul>
                            <li>Static component - Header</li>
                            <li>Static component - Text</li>
                            <li>CS Component - Accordion</li>
                            <li>Static component - Footer</li>
                        </ul>
                    </li>
                    <li><a href="/pattern-library">Pattern Library</a></li>
                </ul>
            </div>
        </main>
    `;
}
