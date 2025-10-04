const fallbackUrl = chrome.runtime.getURL("assets/icons/default.png");

function createAppIcon(site) {
    const icon = document.createElement('div');
    icon.className = 'app-icon';
    icon.title = site.name;

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = getFavicon(site.url);
    img.alt = `${site.name}`;

    img.onerror = () => {
        img.src = fallbackUrl;
        img.style.background = "black";
    };

    // Add site name text below the icon
    const label = document.createElement('div');
    label.className = 'app-label';   // for styling
    label.textContent = site.name;

    icon.onclick = () => {
        // Prevent multiple clicks
        if (icon.dataset.clicked === 'true') return;
        icon.dataset.clicked = 'true';

        // Create the animation overlay
        const overlay = document.createElement('div');
        overlay.className = 'app-launching-animation';

        const animatedIcon = document.createElement('img');
        animatedIcon.src = img.src; // Use favicon
        animatedIcon.alt = site.name;

        overlay.appendChild(animatedIcon);
        document.body.appendChild(overlay);

        // Wait for animation, then redirect
        setTimeout(() => {
            document.body.classList.add('fade-out');

            setTimeout(() => {
                window.open(site.url, "_self");
            }, 300); // match fade-out duration
        }, 500); // delay for launch animation
    };



    icon.appendChild(img);
    icon.appendChild(label);  // append text label below image

    return icon;
}

function loadAppDrawer() {
    const container = document.getElementById('app-drawer');
    container.innerHTML = '';

    // Group sites by category
    const categories = {};

    websites.forEach(site => {
        if (!categories[site.category]) {
            categories[site.category] = [];
        }
        categories[site.category].push(site);
    });

    // For each category, add heading, hr and grid container with icons
    for (const category in categories) {
        // Create category header
        const heading = document.createElement('h3');
        heading.textContent = category;
        heading.className = 'category-header';

        // Create hr element
        const hr = document.createElement('hr');

        // Create grid container for icons
        const grid = document.createElement('div');
        grid.className = 'category-grid';

        categories[category].forEach(site => {
            const icon = createAppIcon(site);
            grid.appendChild(icon);
        });

        // Append heading, hr, and grid to main container
        container.appendChild(heading);
        container.appendChild(hr);
        container.appendChild(grid);
    }
}

document.addEventListener('DOMContentLoaded', loadAppDrawer);

const drawerToggles = Array.from(document.querySelectorAll('.drawer-toggle'));
const drawers = Array.from(document.querySelectorAll('.drawer'));
const widgetArea = document.getElementById('widget-area');

function anyDrawerOpen() {
    return drawerToggles.some(toggle => toggle.checked);
}

function updateDrawerModeClass() {
    widgetArea.classList.toggle('drawer-mode', anyDrawerOpen());
}

drawerToggles.forEach(currentToggle => {
    currentToggle.addEventListener('change', () => {
        if (currentToggle.checked) {
            drawerToggles.forEach(toggle => {
                if (toggle !== currentToggle) toggle.checked = false;
            });
        }
        
        drawerToggles.forEach(toggle => {
            const label = document.querySelector(`label[for="${toggle.id}"]`);
            if (!label) return;
            if (toggle.checked) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
        updateDrawerModeClass();
    });
});

const homeImg = document.getElementById('home');

if (homeImg) {
    homeImg.addEventListener('click', () => {
        drawerToggles.forEach(toggle => {
            toggle.checked = false;
        });

        updateDrawerModeClass();
    });
}
