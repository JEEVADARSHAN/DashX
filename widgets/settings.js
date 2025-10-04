(function () {
    document.addEventListener("DOMContentLoaded", () => {
        const defaults = {
            wallpaper: null,
            fontColor: '#ffffff',
            blur: '8',
            transparency: '0.1',
            appBar: 'True',
            theme: 'dark',
        };

        let currentSettings = loadSettings();

        chrome.storage.local.get("dashx_tour_done", (res) => {
            if (!res.dashx_tour_done) {
                // Set wallpaper to w3.png if not already set
                if (!currentSettings.wallpaper) {
                    currentSettings.wallpaper = chrome.runtime.getURL("../assets/wallpaper/w3.jpg");
                    saveSettings(currentSettings);
                    applySettings(currentSettings);
                }
            }
        });

        const elements = {
            settingsDrawer: document.getElementById('settings-drawer'),
            blurRange: document.getElementById('blur-range'),
            transparencyRange: document.getElementById('transparency-range'),
            appBarToggle: document.getElementById('app-bar-toggle'),
            fontColorPicker: document.getElementById('font-color-picker'),
            wallpaperInput: document.getElementById('wallpaper-input'),
            themeToggle: document.getElementById('theme-toggle-btn'),
            resetBtn: document.getElementById('reset-btn'),
            wallpaperThumbs: document.querySelectorAll('.wallpaper-thumb'),
            colorSwatches: document.querySelectorAll('.color-swatch'),
            appContainer: document.getElementById('app-container'),
            toggleDrawer: document.getElementById('toggle-settings-drawer'),
            settingsNavButtons: document.querySelectorAll('#settings-nav button'),
        };

        if (!elements.settingsDrawer) return;

        // Utility
        const throttle = (fn, delay) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn(...args), delay);
            };
        };

        // Settings
        function loadSettings() {
            return { ...defaults, ...JSON.parse(localStorage.getItem('settings') || '{}') };
        }

        function saveSettings(settings) {
            localStorage.setItem('settings', JSON.stringify(settings));
        }

        function applySettings(settings, changedKeys = []) {
            const all = changedKeys.length === 0;

            if (all || changedKeys.includes('wallpaper')) {
                updateWallpaper(settings.wallpaper);
                elements.wallpaperThumbs.forEach(t =>
                    t.classList.toggle('selected', t.dataset.src === settings.wallpaper)
                );
            }

            if (all || changedKeys.includes('fontColor')) {
                document.body.style.setProperty('--custom-color', settings.fontColor);
                elements.colorSwatches.forEach(s =>
                    s.classList.toggle('selected', s.dataset.color === settings.fontColor)
                );
            }

            if (all || changedKeys.includes('blur')) {
                document.querySelectorAll('.glass').forEach(el => {
                    el.style.backdropFilter = `blur(${settings.blur}px)`;
                    el.style.webkitBackdropFilter = `blur(${settings.blur}px)`;
                });
                if (elements.blurRange) elements.blurRange.value = settings.blur;
            }

            if (all || changedKeys.includes('transparency')) {
                document.querySelectorAll('.glass').forEach(el => {
                    el.style.backgroundColor = `rgba(255, 255, 255, ${settings.transparency})`;
                });
                if (elements.transparencyRange) elements.transparencyRange.value = settings.transparency;
            }

            if (all || changedKeys.includes('appBar')) {
                if (elements.appContainer) {
                    const visible = settings.appBar === 'True';
                    elements.appContainer.style.visibility = visible ? 'visible' : 'hidden';
                    elements.appContainer.style.pointerEvents = visible ? 'auto' : 'none';
                }
                if (elements.appBarToggle) {
                    elements.appBarToggle.checked = settings.appBar === 'True';
                }
            }

            if (all || changedKeys.includes('theme')) {
                document.documentElement.setAttribute('data-theme', settings.theme);
                if (elements.themeToggle) elements.themeToggle.checked = settings.theme === 'dark';
            }

            if (elements.fontColorPicker) elements.fontColorPicker.value = settings.fontColor;
        }

        function updateWallpaper(url) {
            if (!url) {
                document.body.style.backgroundImage = '';
                return;
            }
            const img = new Image();
            img.onload = () => {
                requestAnimationFrame(() => {
                    document.body.style.backgroundImage = `url(${url})`;
                });
            };
            img.src = url;
        }

        // Initialize
        applySettings(currentSettings);

        // Listeners
        elements.blurRange?.addEventListener('input', throttle(() => {
            currentSettings.blur = elements.blurRange.value;
            applySettings(currentSettings, ['blur']);
            saveSettings(currentSettings);
        }, 150));

        elements.transparencyRange?.addEventListener('input', throttle(() => {
            currentSettings.transparency = elements.transparencyRange.value;
            applySettings(currentSettings, ['transparency']);
            saveSettings(currentSettings);
        }, 150));

        elements.appBarToggle?.addEventListener('change', () => {
            currentSettings.appBar = elements.appBarToggle.checked ? 'True' : 'False';
            applySettings(currentSettings, ['appBar']);
            saveSettings(currentSettings);
        });

        elements.fontColorPicker?.addEventListener('input', () => {
            currentSettings.fontColor = elements.fontColorPicker.value;
            applySettings(currentSettings, ['fontColor']);
            saveSettings(currentSettings);
        });

        elements.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                currentSettings.fontColor = swatch.dataset.color;
                applySettings(currentSettings, ['fontColor']);
                saveSettings(currentSettings);
            });
        });

        elements.wallpaperThumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                currentSettings.wallpaper = thumb.dataset.src;
                applySettings(currentSettings, ['wallpaper']);
                saveSettings(currentSettings);
            });
        });

        elements.wallpaperInput?.addEventListener('change', () => {
            const file = elements.wallpaperInput.files[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) { // 10MB limit for UX warning
                createPopup("Warning: Large images may load slowly and affect performance.");
            }

            const isGif = file.type === 'image/gif';
            const isPng = file.type === 'image/png';
            const isJpg = file.type === 'image/jpeg';

            const reader = new FileReader();

            reader.onload = (event) => {
                if (isGif) {
                    // For GIF, load as is (no resizing/compression)
                    currentSettings.wallpaper = event.target.result;
                    applySettings(currentSettings, ['wallpaper']);
                    saveSettings(currentSettings);
                } else if (isJpg || isPng) {
                    // Resize and compress JPG or PNG images
                    const img = new Image();
                    img.onload = () => {
                        const MAX_WIDTH = 1920;
                        const MAX_HEIGHT = 1080;
                        let { width, height } = img;

                        // Resize while maintaining aspect ratio
                        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                            const aspectRatio = width / height;
                            if (width > height) {
                                width = MAX_WIDTH;
                                height = Math.round(MAX_WIDTH / aspectRatio);
                            } else {
                                height = MAX_HEIGHT;
                                width = Math.round(MAX_HEIGHT * aspectRatio);
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to JPEG at 70% quality (PNG will convert to JPEG)
                        const compressedDataURL = canvas.toDataURL('image/jpeg', 0.7);

                        currentSettings.wallpaper = compressedDataURL;
                        applySettings(currentSettings, ['wallpaper']);
                        saveSettings(currentSettings);
                    };
                    img.src = event.target.result;
                } else {
                    // Unsupported file type or other formats - load as is
                    currentSettings.wallpaper = event.target.result;
                    applySettings(currentSettings, ['wallpaper']);
                    saveSettings(currentSettings);
                }
            };

            reader.readAsDataURL(file);
        });


        elements.themeToggle?.addEventListener('click', () => {
            currentSettings.theme = currentSettings.theme === 'dark' ? 'light' : 'dark';
            applySettings(currentSettings, ['theme']);
            saveSettings(currentSettings);
        });

        elements.resetBtn?.addEventListener('click', () => {
            currentSettings = { ...defaults };
            applySettings(currentSettings);
            saveSettings(currentSettings);
            localStorage.setItem("widgetState", JSON.stringify(DEFAULT_STATE));
            if (typeof reloadWidgets === "function") reloadWidgets();
            chrome.storage.local.remove("dashx_tour_done");
            chrome.runtime.sendMessage({ action: 'clear-data' });
            createPopup("Successfully reset", "success");
            setTimeout(() => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.reload(tabs[0].id);
                });
            }, 1500);
            closeSettingsDrawer();
        });

        elements.settingsNavButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.settingsNavButtons.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
                btn.classList.add('active');
                const tabId = `tab-${btn.dataset.tab}`;
                document.getElementById(tabId)?.classList.add('active');
            });
        });

        function closeSettingsDrawer() {
            if (elements.toggleDrawer) {
                elements.toggleDrawer.checked = false;
                elements.toggleDrawer.dispatchEvent(new Event('change'));
            }
        }

        //=============== Tracking Consent ===============//

        const trackingCheckbox = document.getElementById('toggle-tracking-consent');
        if (trackingCheckbox) {
            chrome.storage.local.get('trackingEnabled', (res) => {
                trackingCheckbox.checked = res.trackingEnabled === true;
            });

            trackingCheckbox.addEventListener('change', async (e) => {
                const isTrackingEnabled = e.target.checked;
                chrome.storage.local.set({ trackingEnabled: isTrackingEnabled }, async () => {
                    const response = await chrome.runtime.sendMessage({ action: 'clear-data' });
                    if (response?.success) {
                        createPopup(isTrackingEnabled ? "Tracking enabled" : "Tracking disabled. Usage data cleared.", "success");
                        usageData = null;
                        init();
                    } else {
                        createPopup("Failed to proceed, please try again later.");
                    }
                });
            });

            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local' && changes.trackingEnabled) {
                    trackingCheckbox.checked = changes.trackingEnabled.newValue === true;
                }
            });
        }

        //=============== Widget Edit Mode ===============//

        let widgetState = JSON.parse(localStorage.getItem("widgetState"));

        const saveState = () => localStorage.setItem("widgetState", JSON.stringify(widgetState));

        function closeWidget(widgetId) {
            widgetState[widgetId.replace("-widget", "")] = false;
            saveState();
            document.getElementById(widgetId)?.style.setProperty("display", "none");
        }

        function toggleEditMode() {
            const widgetArea = document.getElementById('widget-area');
            const editBar = document.getElementById('edit-bar');
            const docBar = elements.appContainer;

            widgetArea.classList.toggle('edit-mode');
            editBar.classList.toggle('edit-mode');

            if (widgetArea.classList.contains('edit-mode')) {
                docBar.style.pointerEvents = 'none';
                for (let i = 0; i < 36; i++) {
                    const cell = document.createElement('div');
                    cell.classList.add('widget-slot', 'edit-mode');
                    widgetArea.appendChild(cell);
                }
            } else {
                docBar.style.pointerEvents = 'auto';
                document.querySelectorAll('.widget-slot').forEach(slot => slot.remove());
            }

            document.querySelectorAll(".close-btn").forEach(button => {
                button.addEventListener("click", () => {
                    const widgetId = button.closest(".widget").id;
                    closeWidget(widgetId);
                });
            });

            closeSettingsDrawer();
        }

        document.getElementById('edit')?.addEventListener('click', toggleEditMode);
        document.getElementById('done')?.addEventListener('click', toggleEditMode);
    });
})();
