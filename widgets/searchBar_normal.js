export function createWidget() {
    const container = document.createElement("div");
    container.id = "searchBar-widget_normal";
    container.classList.add("searchBar-widget");

    const searchEngines = {
        Google: 'https://www.google.com/search?q=',
        Bing: 'https://www.bing.com/search?q=',
        DuckDuckGo: 'https://duckduckgo.com/?q=',
        Brave: 'https://search.brave.com/search?q='
    };

    let currentEngine = 'Google';

    function renderSearchBar() {
        const html = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div class="txt">
            <p>What would you like to do?</p>
        </div>
        <div class="search-input-wrapper">
            <div class="custom-dropdown" id="custom-dropdown">
                <img id="selected-engine-icon" src="assets/searchEngine/${currentEngine.toLowerCase()}.png" alt="${currentEngine}" />
                <ul id="engine-options" class="dropdown-options">
                    ${Object.keys(searchEngines).map(engine =>
            `<li data-engine="${engine}">
                            <img src="assets/searchEngine/${engine.toLowerCase()}.png" alt="${engine}" />
                        </li>`).join('')}
                </ul>
            </div>
            <input type="text" id="search-input" placeholder="Search the web..." autofocus/>
            <button id="search-button" title="Search"><img src="assets/other/search.png" style="height: 24px;width:24px;"></button>
            <button id="voice-search-button" title="Voice search"><img src="assets/other/mic.png" style="height: 26px;width:26px;"></button>
        </div>
        `;
        container.innerHTML = html;
        addSearchListeners();
    }

    function addSearchListeners() {
        const searchInput = container.querySelector('#search-input');
        const searchButton = container.querySelector('#search-button');
        const voiceButton = container.querySelector('#voice-search-button');
        const dropdown = container.querySelector('#custom-dropdown');
        const optionsList = container.querySelector('#engine-options');
        const selectedIcon = container.querySelector('#selected-engine-icon');

        dropdown.addEventListener('click', () => {
            dropdown.classList.toggle('expanded');
        });

        optionsList.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const engine = item.getAttribute('data-engine');
                currentEngine = engine;
                selectedIcon.src = `assets/searchEngine/${engine.toLowerCase()}.png`;
                selectedIcon.alt = engine;
                dropdown.classList.remove('expanded');
            });
        });

        function doSearch(query) {
            if (!query.trim()) return;
            const url = searchEngines[currentEngine] + encodeURIComponent(query);
            window.location.href = url;
        }

        searchButton.addEventListener('click', () => {
            doSearch(searchInput.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                doSearch(searchInput.value);
            }
        });

        voiceButton.addEventListener('click', () => {
            if (!('webkitSpeechRecognition' in window)) {
                alert('Voice search is not supported in this browser.');
                return;
            }

            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const query = event.results[0][0].transcript;
                searchInput.value = query;
                doSearch(query);
            };

            recognition.onerror = (event) => {
                alert('Voice recognition error: ' + event.error);
            };

            recognition.start();
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('expanded');
            }
        });
    }

    renderSearchBar();
    return container;
}
