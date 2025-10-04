export function createWidget() {
    const container = document.createElement("div");
    container.id = "bookMark-widget";
    container.className = "widget";

    // Show loading UI immediately
    container.innerHTML = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn">
            <img src="../assets/other/drag.png">
        </div>
        <div class="bookmark-loading" style="padding:1em; text-align:center;">
            Loading bookmarks...
        </div>
    `;

    const fallbackUrl = chrome.runtime.getURL("assets/icons/default.png");

    function createBookmarkElement(node) {
        const faviconUrl = `https://www.google.com/s2/favicons?sz=24&domain_url=${encodeURIComponent(node.url)}`;

        const a = document.createElement('a');
        a.href = node.url;
        a.target = "_blank";  // open in new tab
        a.rel = "noopener noreferrer";

        const img = document.createElement('img');
        img.src = faviconUrl;
        img.alt = "Logo";
        img.className = "favicon";

        img.addEventListener('error', () => {
            img.src = fallbackUrl;
        });

        a.appendChild(img);
        a.appendChild(document.createTextNode(" " + node.title));
        return a;
    }

    function renderBookmarks(bookmarkNodes, depth = 0) {
        const fragment = document.createDocumentFragment();
        for (const node of bookmarkNodes) {
            if (node.title === "Other bookmarks") continue;

            const indent = depth * 10;

            if (node.children) {
                const folderId = `Folder${node.id}`;

                const folderDiv = document.createElement('div');
                folderDiv.className = 'bookmark-folder';

                const toggleSpan = document.createElement('span');
                toggleSpan.className = 'toggle-icon';
                toggleSpan.dataset.target = folderId;
                toggleSpan.textContent = '−';

                const titleStrong = document.createElement('strong');
                titleStrong.textContent = node.title;

                folderDiv.appendChild(toggleSpan);
                folderDiv.appendChild(titleStrong);
                fragment.appendChild(folderDiv);

                const childrenDiv = document.createElement('div');
                childrenDiv.className = 'bookmark-children';
                childrenDiv.id = folderId;
                childrenDiv.style.paddingBottom = '16px';

                const childrenFragment = renderBookmarks(node.children, depth + 1);
                childrenDiv.appendChild(childrenFragment);

                fragment.appendChild(childrenDiv);

                const folderState = localStorage.getItem(folderId);
                if (folderState === 'closed') {
                    childrenDiv.style.display = 'none';
                    toggleSpan.textContent = '+';
                }

            } else if (node.url) {
                const linkDiv = document.createElement('div');
                linkDiv.className = 'bookmark-link';
                linkDiv.style.marginLeft = `${indent}px`;
                linkDiv.style.marginRight = `${indent}px`;

                const bookmarkEl = createBookmarkElement(node);
                linkDiv.appendChild(bookmarkEl);
                fragment.appendChild(linkDiv);
            }
        }

        return fragment;
    }

    function addToggleHandlers() {
        const toggles = container.querySelectorAll('.toggle-icon');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetId = toggle.dataset.target;
                const target = container.querySelector(`#${targetId}`);
                if (target.style.display === 'none') {
                    target.style.display = '';
                    toggle.textContent = '−';
                    localStorage.setItem(targetId, 'open');
                } else {
                    target.style.display = 'none';
                    toggle.textContent = '+';
                    localStorage.setItem(targetId, 'closed');
                }
                // Adjust container height if needed
                const wrapper = container.querySelector('.bookmark-container');
                if (wrapper) {
                    const closedFolders = Array.from(container.querySelectorAll('.bookmark-children'))
                        .filter(div => div.style.display === 'none');
                    wrapper.style.height = closedFolders.length === 0 ? '100%' : 'auto';
                }
            });
        });
    }

    async function loadBookmarks() {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getTree((bookmarkTreeNodes) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }

                const bookmarksBar = bookmarkTreeNodes[0].children.find(
                    node => node.title === "Bookmarks Bar" || node.title === "Bookmark Bar" || node.id === "1"
                );

                if (!bookmarksBar) {
                    reject(new Error('No bookmarks bar found.'));
                    return;
                }

                resolve(bookmarksBar);
            });
        });
    }

    (async () => {
        try {
            const bookmarksBar = await loadBookmarks();

            const wrapper = document.createElement('div');
            wrapper.className = 'bookmark-container glass';
            wrapper.appendChild(renderBookmarks([bookmarksBar]));

            // Replace loading UI with actual bookmarks
            container.querySelector('.bookmark-loading').remove();
            container.appendChild(wrapper);

            addToggleHandlers();

            // Set initial wrapper height based on open/closed folders
            const closedFolders = Array.from(container.querySelectorAll('.bookmark-children'))
                .filter(div => div.style.display === 'none');

            wrapper.style.height = closedFolders.length === 0 ? '100%' : 'auto';

        } catch (error) {
            container.innerHTML = `
                <div class="close-btn">&#x2715;</div>
                <div class="drag-btn">
                    <img src="../assets/other/drag.png">
                </div>
                <div class="bookmark-error" style="padding:1em; color: red; text-align:center;">
                    Failed to load bookmarks.
                </div>
            `;
            console.error('Error loading bookmarks:', error);
        }
    })();

    return container;
}
