// ======= COLORS ============//
const computedStyles = getComputedStyle(document.documentElement);

var primaryColor = computedStyles.getPropertyValue('--font-color').trim();
var shadow = computedStyles.getPropertyValue('--box-shadow')?.trim();
var accentColor = computedStyles.getPropertyValue('--accent-color')?.trim();
var bgColor = computedStyles.getPropertyValue('--background-color').trim();
const technoColors = [
    [200, 100, 60],
    [280, 100, 65],
    [120, 100, 50],
    [45, 100, 60],
    [330, 100, 65],
    [180, 100, 50],
    [0, 100, 60],
];
function getColor(){
    primaryColor = computedStyles.getPropertyValue('--font-color').trim();
    shadow = computedStyles.getPropertyValue('--box-shadow')?.trim();
    accentColor = computedStyles.getPropertyValue('--accent-color')?.trim();
    bgColor = computedStyles.getPropertyValue('--background-color').trim();
}
getColor();

// ====== SITES =========== //

const websites = [
    // Ecommerce
    { name: 'Amazon', url: 'https://www.amazon.com', category: 'Shopping' },
    { name: 'Flipkart', url: 'https://www.flipkart.com', category: 'Shopping' },
    { name: 'eBay', url: 'https://www.ebay.com', category: 'Shopping' },
    { name: 'Myntra', url: 'https://www.myntra.com', category: 'Shopping' },

    // Games
    { name: 'CrazyGames', url: 'https://www.crazygames.com', category: 'Games' },
    { name: 'GameSnacks', url: 'https://gamesnacks.com', category: 'Games' },
    { name: 'Chess.com', url: 'https://www.chess.com/', category: 'Games' },
    { name: 'Poki', url: 'https://poki.com/', category: 'Games' },

    // Education
    { name: 'Coursera', url: 'https://www.coursera.org', category: 'Education' },
    { name: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org', category: 'Education' },
    { name: 'LeetCode', url: 'https://leetcode.com', category: 'Education' },
    { name: 'NPTEL', url: 'https://nptel.ac.in', category: 'Education' },
    { name: 'TutorialsPoint', url: 'https://www.tutorialspoint.com', category: 'Education' },
    { name: 'Udemy', url: 'https://www.udemy.com', category: 'Education' },
    { name: 'W3Schools', url: 'https://www.w3schools.com', category: 'Education' },

    // Social Media
    { name: 'Facebook', url: 'https://www.facebook.com', category: 'Social Media' },
    { name: 'Instagram', url: 'https://www.instagram.com', category: 'Social Media' },
    { name: 'Twitter', url: 'https://www.twitter.com', category: 'Social Media' },
    { name: 'WhatsApp', url: 'https://web.whatsapp.com', category: 'Social Media' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com', category: 'Social Media' },
    { name: 'Medium', url: 'https://medium.com', category: 'Social Media' },
    { name: 'Pinterest', url: 'https://www.pinterest.com', category: 'Social Media' },
    { name: 'Quora', url: 'https://www.quora.com', category: 'Social Media' },
    { name: 'Reddit', url: 'https://www.reddit.com', category: 'Social Media' },

    // Productivity / Tools
    { name: 'ChatGPT', url: 'https://chatgpt.com', category: 'Productivity' },
    { name: 'Gemini', url: 'https://gemini.google.com', category: 'Productivity' },
    { name: 'GitHub', url: 'https://www.github.com', category: 'Productivity' },
    { name: 'Gmail', url: 'https://mail.google.com', category: 'Productivity' },
    { name: 'Google Drive', url: 'https://drive.google.com', category: 'Productivity' },
    { name: 'Gmeet', url: 'https://meet.google.com/', category: 'Productivity' },
    { name: 'Outlook', url: 'https://outlook.live.com', category: 'Productivity' },
    { name: 'StackOverflow', url: 'https://stackoverflow.com', category: 'Productivity' },

    // Entertainment
    { name: 'Hotstar', url: 'https://www.hotstar.com', category: 'Entertainment' },
    { name: 'Netflix', url: 'https://www.netflix.com', category: 'Entertainment' },
    { name: 'Prime Video', url: 'https://www.primevideo.com/', category: 'Entertainment' },
    { name: 'Spotify', url: 'https://www.spotify.com', category: 'Entertainment' },
    { name: 'YouTube', url: 'https://www.youtube.com', category: 'Entertainment' },
    { name: 'ZEE5', url: 'https://www.zee5.com/', category: 'Entertainment' },

    // Search Engines / Information
    { name: 'Google', url: 'https://www.google.com', category: 'Other' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org', category: 'Other' },
    { name: 'Yahoo', url: 'https://www.yahoo.com', category: 'Other' }
];

// ====== GET FAVICONS =========== //

const getFavicon = (domain) => {
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
};

// ====== GET CATEGORY =========== //

const getCategory = (domain) => {
    domain = domain?.toLowerCase() || '';

    for (let i = 0; i < websites.length; i++) {
        const site = websites[i];
        const siteDomain = new URL(site.url).hostname.toLowerCase();

        if (domain.includes(siteDomain)) {
            // Return the simplified category mapping
            switch (site.category) {
                case 'Entertainment':
                    return 'Entertainment';
                case 'Games': // In case you ever add more raw "Games" category entries
                    return 'Entertainment';
                case 'Social Media':
                    return 'Social Media';
                case 'Productivity':
                case 'Education': // In case you forgot to remap in websites
                    return 'Productivity';
                case 'Shopping':
                    return 'Shopping';
            }
        }
    }

    return 'Other';
};

// ====== DATA ENCRYPTION =========== //

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

// ====== FAVICONS =========== //

    async function detectBrowser() {
    const ua = navigator.userAgent;

    if (navigator.brave && await navigator.brave.isBrave()) return "brave";
    if (ua.includes("OPR") || ua.includes("Opera")) return "opera";
    if (ua.includes("Edg")) return "edge";
    if (ua.includes("Firefox")) return "firefox";
    if (ua.includes("Chrome")) return "chrome";
    if (ua.includes("Safari")) return "safari";

    return "default";
  }

    function setFavicon(path) {
        let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
    }
    link.href = path;
  }

  (async () => {
    const browser = await detectBrowser();

    const favicons = {
        chrome: "assets/favicon/l1.png",
        brave: "assets/favicon/l2.png",
        edge: "assets/favicon/l3.png",
        firefox: "assets/favicon/l4.png",
        safari: "assets/favicon/l5.png",
        opera: "assets/favicon/l6.png",
        default: "assets/favicon/dashX.png"
    };

    setFavicon(favicons[browser] || favicons["default"]);
  })();
