const secretKey = 'offline-secret-key';
const storageKey = 'usageData';
const trackingKey = 'trackingEnabled';
const retentionDays = 8;

let enabledTracking = false;
let storedData = { daily: {} };
let currentSession = null; // { domain, start }
let lastTrackedDomain = null;
let saveTimeout = null;

const MAX_SESSIONS_PER_DOMAIN = 50;

// === UTILS ===

const getDateString = (date = new Date()) => date.toISOString().split('T')[0];

function getDomain(url) {
    try {
        let hostname = new URL(url).hostname.toLowerCase();
        return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    } catch {
        return null;
    }
}

// === STORAGE ===

async function loadData() {
    return new Promise(resolve => {
        chrome.storage.local.get([storageKey, trackingKey], async result => {
            enabledTracking = !!result[trackingKey];
            if (result[storageKey]) {
                storedData = await decrypt(result[storageKey], secretKey);
            }
            resolve();
        });
    });
}

// Cleanup old data ONLY during init or periodically (optional)
function cleanupOldData() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffStr = getDateString(cutoff);
    for (const date in storedData.daily) {
        if (date < cutoffStr) {
            delete storedData.daily[date];
        }
    }
}

// Debounced save to reduce frequent storage writes
function saveDataDebounced() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const encrypted = await encrypt(storedData, secretKey);
        chrome.storage.local.set({ [storageKey]: encrypted });
        saveTimeout = null;
    }, 1000);
}

// === TRACKING ===

function trackTabChange(domain) {
    if (domain === lastTrackedDomain) return;  // Skip if no domain change

    const now = Date.now();

    // Record the previous session duration
    if (currentSession?.domain) {
        const duration = Math.floor((now - currentSession.start) / 1000);
        if (duration > 1) {
            const dateStr = getDateString();

            if (!storedData.daily[dateStr]) storedData.daily[dateStr] = {};
            if (!storedData.daily[dateStr][currentSession.domain]) {
                storedData.daily[dateStr][currentSession.domain] = { totalDuration: 0, sessions: [] };
            }

            const domainData = storedData.daily[dateStr][currentSession.domain];

            domainData.totalDuration += duration;
            domainData.sessions.push({ start: currentSession.start, end: now });

            // Limit sessions array size
            if (domainData.sessions.length > MAX_SESSIONS_PER_DOMAIN) {
                domainData.sessions.shift();
            }
        }
    }

    currentSession = domain ? { domain, start: now } : null;
    lastTrackedDomain = domain;

    saveDataDebounced();
}

// === ENCRYPTION / DECRYPTION ===

async function encrypt(data, secretKey) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(secretKey), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('some-static-salt'), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );
    const encoded = enc.encode(JSON.stringify(data));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipher), iv.byteLength);
    return btoa(String.fromCharCode(...combined));
}

async function decrypt(cipherText, secretKey) {
    try {
        const enc = new TextEncoder();
        const combined = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(secretKey), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: enc.encode('some-static-salt'), iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        const decoded = new TextDecoder().decode(decrypted);
        return JSON.parse(decoded) || { daily: {} };
    } catch (e) {
        console.warn('Decryption failed:', e);
        return { daily: {} };
    }
}

// === EVENT HANDLERS ===

async function clearAllData() {
    storedData = { daily: {} };
    currentSession = null;
    lastTrackedDomain = null;
    await chrome.storage.local.remove(storageKey);
}

async function handleTabActivated({ tabId }) {
    if (!enabledTracking) return;
    const tab = await chrome.tabs.get(tabId);
    trackTabChange(getDomain(tab.url));
}

function handleTabUpdated(tabId, changeInfo, tab) {
    if (!enabledTracking || changeInfo.status !== 'complete') return;
    trackTabChange(getDomain(tab.url));
}

async function handleWindowFocus(windowId) {
    if (!enabledTracking) return;

    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        trackTabChange(null);
        return;
    }

    const tabs = await chrome.tabs.query({ active: true, windowId });
    const domain = tabs.length > 0 ? getDomain(tabs[0].url) : null;
    trackTabChange(domain);
}

// === LISTENERS ===

function initListeners() {
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.windows.onFocusChanged.addListener(handleWindowFocus);
}

function removeListeners() {
    chrome.tabs.onActivated.removeListener(handleTabActivated);
    chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    chrome.windows.onFocusChanged.removeListener(handleWindowFocus);
}

// === INITIALIZATION ===

async function init() {
    await loadData();

    // Clean old data ONCE here
    cleanupOldData();

    if (!enabledTracking) return;

    initListeners();

    const window = await chrome.windows.getLastFocused({ populate: true });
    if (window.focused) {
        const activeTab = window.tabs.find(t => t.active);
        if (activeTab) {
            trackTabChange(getDomain(activeTab.url));
        }
    }
}

// === STORAGE CHANGE LISTENER ===

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes[trackingKey]) {
        (async () => {
            const wasEnabled = enabledTracking;
            const { trackingEnabled: newVal } = await chrome.storage.local.get(trackingKey);
            enabledTracking = !!newVal;

            if (enabledTracking && !wasEnabled) {
                // Start tracking
                initListeners();
                // Load stored data and cleanup once on enabling tracking
                storedData = await decrypt((await chrome.storage.local.get(storageKey))[storageKey] || '', secretKey).catch(() => ({ daily: {} }));
                cleanupOldData();
            } else if (!enabledTracking && wasEnabled) {
                // Stop tracking & clear data
                removeListeners();
                await clearAllData();
            }
        })();
    }
});

// === DELETE DATA MESSAGE ===

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action === 'clear-data') {
        clearAllData().then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// Start extension
init();
