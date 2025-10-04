(function () {
    const appBarEdit = document.querySelector('#appBar-edit');
    const container = document.querySelector('#app-container');
    if (!container) return;

    const defaultApps = [
        { name: "Gmail", url: "https://mail.google.com", icon: "../assets/icons/gmail.png" },
        { name: "YouTube", url: "https://youtube.com", icon: "../assets/icons/youtube.png" },
        { name: "Google Drive", url: "https://drive.google.com", icon: "../assets/icons/drive.png" },
        { name: "Chatgpt", url: "https://chatgpt.com/", icon: "../assets/icons/chatgpt.png" },
        { name: "Maps", url: "https://maps.google.com", icon: "../assets/icons/maps.png" },
        { name: "Gmeet", url: "https://meet.google.com", icon: "../assets/icons/meet.png" },
        { name: "Gemini", url: "https://gemini.google.com/", icon: "../assets/icons/gemini.png" },
    ];

    if (!localStorage.getItem("appBarApps")) {
        localStorage.setItem("appBarApps", JSON.stringify(defaultApps));
    }

    function loadApps() {
        const savedApps = JSON.parse(localStorage.getItem('appBarApps'));
        if (savedApps && Array.isArray(savedApps)) {
            return savedApps.slice(0, 11);
        }
        return defaultApps;
    }

    function saveApps(apps) {
        if (apps.length === 0) {
            createPopup("Some fields are empty. Please fill all fields before saving.");
            return;
        }
        localStorage.setItem('appBarApps', JSON.stringify(apps.slice(0, 11)));
    }


    function renderApps(apps) {
        container.innerHTML = "";
        container.innerHTML = apps.map(app => `
            <a class="app-icon" title="${app.name}" href="${app.url}">
                <img src="${app.icon}" alt="${app.name}" onerror="this.onerror=null; this.src='assets/icons/default.png'" />
            </a>
        `).join('');
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderApps(loadApps());
    });

    function addAppField() {
        const appFieldsContainer = appBarEdit.querySelector('.app-fields');
        if (appFieldsContainer.children.length < 11) {
            const appDiv = document.createElement('div');
            appDiv.classList.add('items', 'app-entry');
            appDiv.style.style = "grid";
            appDiv.innerHTML = `
                <div>
                    <label for="app-name">App Name:</label>
                    <input type="text" class="app-name" placeholder="App name" />
                </div>
                <div>
                    <label for="app-url">App URL:</label>
                    <input type="url" class="app-url" placeholder="App URL" />
                </div>
                <button class="app-delete-btn btn">Delete</button>
            `;
            appFieldsContainer.appendChild(appDiv);
        } else {
            createPopup("You have reached the maximum number of slots.");
        }
    }

    function createPreviewAppBar(apps) {
        const previewContainer = document.querySelector('#preview-app-bar');
        previewContainer.innerHTML = apps.map(app => `
            <a class="app-icon" title="${app.name}" href="${app.url}">
                <img src="${app.icon}" alt="${app.name}" onerror="this.onerror=null; this.src='assets/icons/default.png'" />
            </a>
        `).join('');
    }

    function saveAppBar() {
        const fields = [...appBarEdit.querySelectorAll('.app-entry')];

        // Check if any field is empty
        const incomplete = fields.some(field => {
            const name = field.querySelector('.app-name').value.trim();
            const url = field.querySelector('.app-url').value.trim();
            return !name || !url;
        });

        if (incomplete) {
            createPopup("Some fields are empty. Please fill all fields before saving.");
            return;
        }

        const prebuiltIconsMap = {
            "mail.google.com": "../assets/icons/gmail.png",
            "youtube.com": "../assets/icons/youtube.png",
            "drive.google.com": "../assets/icons/drive.png",
            "chatgpt.com": "../assets/icons/chatgpt.png",
            "maps.google.com": "../assets/icons/maps.png",
            "meet.google.com": "../assets/icons/meet.png",
            "gemini.google.com": "../assets/icons/gemini.png",
        };

        const newApps = [];

        for (const field of fields) {
            const name = field.querySelector('.app-name').value.trim();
            let url = field.querySelector('.app-url').value.trim();

            // Normalize URL by adding 'https://' if missing
            if (!url.match(/^https?:\/\//)) {
                url = 'https://' + url;
            }

            let icon;
            try {
                const domain = new URL(url).hostname;

                if (prebuiltIconsMap[domain]) {
                    icon = prebuiltIconsMap[domain];
                } else {
                    icon = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
                }
            } catch (e) {
                // If URL is invalid, fallback to default icon and skip saving this app
                createPopup(`Invalid URL for app "${name}". Please check and correct.`);
                return; // stop saving
            }

            newApps.push({ name, url, icon });
        }


        saveApps(newApps);
        createPreviewAppBar(newApps);
        const editWrapper = appBarEdit.querySelector('#edit-wrapper');
        const arrow = document.querySelector('#c-arr');
        arrow.textContent = '▼';
        if (editWrapper) editWrapper.remove();
        renderApps(loadApps());
    }

    function cancelEdit() {
        const editWrapper = appBarEdit.querySelector('#edit-wrapper');
        const arrow = document.querySelector('#c-arr');
        arrow.textContent = '▼';
        if (editWrapper) editWrapper.remove();
    }

    document.querySelector('#edit-appBar').addEventListener('click', () => {

        let editWrapper = appBarEdit.querySelector('#edit-wrapper');
        const arrow = document.querySelector('#c-arr');
        // If already open, close it (toggle behavior)
        if (editWrapper) {
            editWrapper.remove();
            arrow.textContent = '▼';
            return;
        }

        // Otherwise, create and show the editor
        editWrapper = document.createElement('div');
        editWrapper.id = 'edit-wrapper';
        arrow.textContent = '▲';
        appBarEdit.appendChild(editWrapper);

        // Preview bar
        const previewContainer = document.createElement('div');
        previewContainer.id = 'preview-app-bar';
        editWrapper.appendChild(previewContainer);
        createPreviewAppBar(loadApps());

        // App fields container
        const appFieldsContainer = document.createElement('div');
        appFieldsContainer.classList.add('app-fields');
        editWrapper.appendChild(appFieldsContainer);

        // Populate app entries
        loadApps().forEach(app => {
            const appDiv = document.createElement('div');
            appDiv.classList.add('items', 'app-entry');
            appDiv.style.display = "grid";
            appDiv.innerHTML = `
            <div>
                <label for="app-name">App Name:</label>
                <input type="text" class="app-name" value="${app.name}" placeholder="App name" />
            </div>
            <div>
                <label for="app-url">App URL:</label>
                <input type="url" class="app-url" value="${app.url}" placeholder="App URL" />
            </div>
            <button class="app-delete-btn btn">Delete</button>
        `;
            appFieldsContainer.appendChild(appDiv);
        });

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('buttons-container');
        buttonsContainer.innerHTML = `
        <button id="add-btn" class="btn">Add</button>
        <button id="save-app-bar-btn" class="btn">Save</button>
        <button id="cancel-edit-btn" class="btn">Cancel</button>
    `;
        editWrapper.appendChild(buttonsContainer);

        // Add event listeners
        document.querySelector('#add-btn').addEventListener('click', addAppField);
        document.querySelector('#save-app-bar-btn').addEventListener('click', saveAppBar);
        document.querySelector('#cancel-edit-btn').addEventListener('click', cancelEdit);

        // Delete app entry logic
        appFieldsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('app-delete-btn')) {
                e.target.parentElement.remove();
            }
        });
    });
})();


document.addEventListener('DOMContentLoaded', () => {

    const docBar = document.querySelector('#app-container');
    const icons = docBar.querySelectorAll('.app-icon');

    docBar.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;

        icons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const iconCenterX = rect.left + rect.width / 2;

            const distance = Math.abs(mouseX - iconCenterX);
            const maxDistance = 150;
            const scale = Math.max(0.8, 1.5 - (distance / maxDistance));

            const translateY = -20 * (scale - 1);

            icon.style.transform = `scale(${scale}) translateY(${translateY}px)`;
        });
    });

    docBar.addEventListener('mouseleave', () => {
        icons.forEach(icon => {
            icon.style.transform = 'scale(1) translateY(0)';
        });
    });
});

