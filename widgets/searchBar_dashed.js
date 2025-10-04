export function createWidget() {
    const container = document.createElement("div");
    container.id = "searchBar-widget_dashed";
    container.classList.add("searchBar-widget");

    function renderSearchBar() {
        const html = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div class="txt" style="padding-bottom: 0;">
            <p>Let's find something amazing.</p>
        </div>
        <div class="search-input-wrapper" style="background:rgba(0,0,0,0);backdrop-filter: blur(8px);-webkit-backdrop-filter: blur(8px); border:none; border-bottom: 3px solid #ccc; border-radius:4px; box-shadow:0 0 transparent">
            <input type="text" style="color: white; font-size: 1rem;" id="search-input" placeholder="" autofocus/>
        </div>
        `;
        container.innerHTML = html;
        addSearchListeners();
    }

    function addSearchListeners() {
        const searchInput = container.querySelector('#search-input');


        function doSearch(query) {
            if (!query.trim()) return;
            const url = encodeURIComponent(query);
            window.location.href = url;
        }

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                doSearch(searchInput.value);
            }
        });
    }

    renderSearchBar();
    return container;
}
