/**
 * Side navigation component
 *
 * Shows the section that holds the current page: the direct parent as the
 * title, its children as the list, and the current page's children expanded
 * under it. Lineage comes from the shared siteLineage helpers the header uses.
 */

// Shared HTML template tag and XSS filter (see docs/CODING_STANDARDS.md).
import {html} from '../../utils/html';
import {xssSafeContent} from '../../utils/xss';
import {resolveCtxAssetId, resolveCtxPageUrl} from '../../utils/matrix/pageUrl/index.ts';
import {fetchSiteLineage} from '../../utils/matrix/siteLineage/fetchSiteLineage.ts';
import {siteLineageToSectionNav} from '../../utils/matrix/siteLineage/siteLineageToSectionNav.ts';
import previewNavigation from './preview-navigation.json';

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

/** Matrix editor `data-sq-field` path. Rendered only in edit mode. */
function editorSqField(editMode, fieldPath) {
    return editMode ? `data-sq-field="${escapeAttribute(fieldPath)}"` : '';
}

/** Path from `node` down to the node with `id`, or null when it is not in the tree. */
function findPath(node, id) {
    if (String(node.id) === id) {
        return [node];
    }

    for (const child of node.children ?? []) {
        const path = findPath(child, id);
        if (path) {
            return [node, ...path];
        }
    }

    return null;
}

/**
 * Work out the title, the list and the active page from the section tree.
 * A top-level page has no parent inside the section, so it is the title and
 * its children are the list.
 */
function buildNavModel(section, currentId) {
    const path = findPath(section, currentId);
    if (!path) {
        return null;
    }

    const current = path[path.length - 1];
    const parent = path.length > 1 ? path[path.length - 2] : null;

    if (!parent) {
        return {
            title: current,
            items: current.children ?? [],
            activeId: '',
            activeChildren: [],
        };
    }

    return {
        title: parent,
        items: parent.children ?? [],
        activeId: String(current.id),
        activeChildren: current.children ?? [],
    };
}

/**
 * Navigation model for the current page.
 * With no page asset (Storybook, or the editor preview) the fixture tree is used.
 * Live output with no page asset has no navigation.
 */
async function resolveNavModel(componentUtilities, editMode) {
    const assetId = resolveCtxAssetId(componentUtilities);

    if (!assetId) {
        const isPreview = !componentUtilities || editMode;
        return isPreview ? buildNavModel(previewNavigation.section, previewNavigation.currentAssetId) : null;
    }

    try {
        const lineage = await fetchSiteLineage(componentUtilities);
        const [section] = siteLineageToSectionNav(lineage, {
            assetId,
            pageUrl: resolveCtxPageUrl(componentUtilities),
            untypedLinksVisible: true,
        });
        return section ? buildNavModel(section, assetId) : null;
    } catch {
        return null;
    }
}

function renderNavLink(item) {
    return html`<a class="nav-link" href="${escapeAttribute(item.url)}">${xssSafeContent(item.title)}</a>`;
}

/** Level two: the children of the active page. */
function renderChildList(children) {
    if (children.length === 0) {
        return '';
    }

    return html`<ul>
    ${children.map((child) => html`<li class="nav-item">${renderNavLink(child)}</li>`).join('')}
  </ul>`;
}

/** Level one: the list of sibling pages, with the active page expanded. */
function renderLevelOne(item, activeId, activeChildren) {
    if (String(item.id) === activeId) {
        return html`<li class="nav-item active">
      <span class="nav-link" aria-current="page">${xssSafeContent(item.title)}</span>
      ${renderChildList(activeChildren)}
    </li>`;
    }

    return html`<li class="nav-item">${renderNavLink(item)}</li>`;
}

/**
 * Side navigation component
 */
export default {
    async main(input, componentUtilities) {
        const {collapseTitle, showChildren, wrapperClasses} = input || {};
        const editMode = Boolean(componentUtilities?.ctx?.editor);
        const model = await resolveNavModel(componentUtilities, editMode);

        // Live output with nothing to navigate is empty. Edit mode keeps the markup
        // so the editor can still set the collapse title.
        if (!model && !editMode) {
            return '';
        }

        const activeChildren = showChildren === false ? [] : (model?.activeChildren ?? []);

        return html`
      <nav
        class="qld-side-navigation ${escapeAttribute(wrapperClasses)}"
        aria-label="Side Navigation"
      >
        <button
          class="accordion-button collapsed d-lg-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#sideNavCollapse"
          aria-expanded="false"
          aria-controls="sideNavCollapse"
          ${editorSqField(editMode, 'collapseTitle')}
        >
          ${xssSafeContent(collapseTitle ?? '')}
        </button>
        <div class="nav-wrapper collapse d-lg-block" id="sideNavCollapse">
          ${model ? html`<h2 class="nav-title">${renderNavLink(model.title)}</h2>` : ''}
          <!-- Level One -->
          <ul class="nav" aria-label="section navigation">
            ${model ? model.items.map((item) => renderLevelOne(item, model.activeId, activeChildren)).join('') : ''}
          </ul>
        </div>
      </nav>
    `;
    },
};
