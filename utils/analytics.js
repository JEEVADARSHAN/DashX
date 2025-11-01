// === Global Variables ===
let usageData = null;
let trackingEnabled = false;
let todayDoughnutChart = null;
let weekLineChart = null;
let radarCategoryChart = null;
let longestSessionsChart = null;

const secretKey = 'offline-secret-key';
const storageKey = 'usageData';

// === Helpers ===
const getDomain = url => {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return null;
    }
};

const friendlyName = domain => {
    if (!domain) return '-';
    const parts = domain.split('.');
    const main = parts.length >= 2 ? parts[parts.length - 2] : domain;
    return main.charAt(0).toUpperCase() + main.slice(1);
};

function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    seconds = Math.round(seconds);  // ROUND here!

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    let parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (h === 0 && m === 0) parts.push(`${s}s`);
    return parts.join(' ');
}



const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
};

// === Data Loading ===
async function loadTrackingStatus() {
    return new Promise(resolve => {
        chrome.storage.local.get(['trackingEnabled'], res => {
            trackingEnabled = res.trackingEnabled === true;
            resolve(trackingEnabled);
        });
    });
}

async function loadUsageData() {
    return new Promise(resolve => {
        chrome.storage.local.get(storageKey, async res => {
            if (res[storageKey]) {
                usageData = await decrypt(res[storageKey], secretKey);
            } else {
                usageData = null;
            }
            resolve(usageData);
        });
    });
}

// === UI Control ===
function togglePlaceholders(showTrackingOff, showNoData) {
    document.getElementById('tracking-disabled-placeholder').style.display = showTrackingOff ? 'block' : 'none';
    document.getElementById('no-data-placeholder').style.display = showNoData ? 'block' : 'none';
    document.getElementById('analytics-drawer').style.display = (!showTrackingOff && !showNoData) ? 'block' : 'none';
}

function isUsageEmpty(data) {
    if (!data?.daily) return true;
    return !Object.values(data.daily).some(day => Object.keys(day).length > 0);
}

function destroyCharts() {
    todayDoughnutChart?.destroy(); todayDoughnutChart = null;
    weekLineChart?.destroy(); weekLineChart = null;
    radarCategoryChart?.destroy(); radarCategoryChart = null;
    longestSessionsChart?.destroy(); longestSessionsChart = null;
}

// === Main Init ===
async function init() {
    const tracking = await loadTrackingStatus();

    if (!tracking) {
        usageData = null;
        await chrome.storage.local.remove(storageKey);
        destroyCharts();
        togglePlaceholders(true, false);
        return;
    }

    await loadUsageData();

    if (!usageData || isUsageEmpty(usageData)) {
        destroyCharts();
        togglePlaceholders(false, true);
        return;
    }

    togglePlaceholders(false, false);
    renderCharts();
    updateTodaySummary(usageData);
}

function updateTodaySummary(usage) {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayData = usage.daily?.[todayStr] || {};

    // Count unique sites visited
    const sitesVisited = Object.keys(dayData).length;

    // Calculate average session duration across all sessions today
    let totalDuration = 0;
    let totalSessions = 0;

    for (const domain in dayData) {
        const sessions = dayData[domain]?.sessions || [];
        sessions.forEach(sess => {
            const dur = (sess.end - sess.start) / 1000; // duration in seconds
            if (dur > 0) {
                totalDuration += dur;
                totalSessions++;
            }
        });
    }

    const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // Update DOM elements
    document.getElementById('sites-visited').textContent = sitesVisited;
    document.getElementById('avg-session-duration').textContent = formatTime(avgDuration);
}

// === Data Processing ===
function splitUsageByTime(data) {
    const todayStr = new Date().toISOString().split('T')[0];
    const last7Days = getLast7Days();
    const today = {}, week = {}, dailyTotals = {};

    for (const date of last7Days) {
        const dayData = data.daily?.[date] || {};
        let dayTotal = 0;
        for (const domain in dayData) {
            const dur = dayData[domain].totalDuration || 0;
            dayTotal += dur;
            week[domain] = (week[domain] || 0) + dur;
            if (date === todayStr) today[domain] = dur;
        }
        dailyTotals[date] = dayTotal;
    }

    return { today, week, dailyTotals };
}

// === Chart Rendering ===
function renderCharts() {
    const { today, week, dailyTotals } = splitUsageByTime(usageData);
    renderDoughnutChart(today);
    renderLineChart(dailyTotals);
    renderRadarChart(today);
    renderLongestSessionsChart(usageData);
}
function renderDoughnutChart(todayUsage) {
    const canvas = document.getElementById('today-pie-chart');
    const ctx = canvas.getContext('2d');
    if (todayDoughnutChart) todayDoughnutChart.destroy();
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Ensure clean slate

    const usageArray = Object.entries(todayUsage).sort((a, b) => b[1] - a[1]);
    const topUsage = usageArray.slice(0, 7); // Max 7 top domains
    const otherUsage = usageArray.slice(7);  // The rest goes into "Other"

    const domains = topUsage.map(([domain]) => domain);
    const data = topUsage.map(([_, time]) => time);

    // Add "Other" if applicable
    if (otherUsage.length > 0) {
        const otherTotal = otherUsage.reduce((sum, [_, time]) => sum + time, 0);
        domains.push('Other'); // label
        data.push(otherTotal); // value
    }

    const labels = domains.map(domain =>
        domain === 'Other' ? 'Other' : friendlyName(domain)
    );
    const total = data.reduce((a, b) => a + b, 0);

    getColor(); // Ensures technoColors is defined
    while (technoColors.length < domains.length) {
        // Add fallback colors if fewer defined
        technoColors.push([Math.floor(Math.random() * 360), 70, 50]);
    }

    const gradients = [];
    const flatColors = [];

    domains.forEach((_, i) => {
        const [h1, s1, l1] = technoColors[i % technoColors.length];
        const h2 = (h1 + 30) % 360;
        const l2 = Math.max(l1 - 20, 30);

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${h1}, ${s1}%, ${l1}%)`);
        gradient.addColorStop(1, `hsl(${h2}, ${s1}%, ${l2}%)`);
        gradients.push(gradient);

        flatColors.push(`hsl(${h1}, ${s1}%, ${l1}%)`);
    });

    const externalLegendPlugin = {
        id: 'externalLegend',
        afterUpdate(chart, args, options) {
            const container = document.getElementById(options.containerID);
            if (!container) return;
            container.innerHTML = '';

            const items = chart.options.plugins.legend.labels.generateLabels(chart);
            items.forEach((item, i) => {
                const div = document.createElement('div');
                div.className = 'chart-legend-item';

                const box = document.createElement('span');
                box.className = 'chart-legend-color-box';
                box.style.background = flatColors[item.index] || '#ccc';

                const text = document.createElement('span');
                text.textContent = item.text;

                div.appendChild(box);
                div.appendChild(text);
                div.onclick = () => {
                    chart.toggleDataVisibility(item.index);
                    chart.update();
                };
                container.appendChild(div);
            });
        }
    };

    if (!Chart.registry.plugins.get('externalLegend')) {
        Chart.register(externalLegendPlugin);
    }

    todayDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: gradients,
                borderWidth: 0,
                hoverOffset: 15,
                spacing: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateRotate: false,
            },
            cutout: '85%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: bgColor,
                    borderColor: primaryColor,
                    borderWidth: 1,
                    titleColor: primaryColor,
                    bodyColor: primaryColor,
                    callbacks: {
                        label: ctx => `${ctx.label}: ${formatTime(ctx.parsed)}`
                    }
                },
                externalLegend: {
                    containerID: 'chart-legend'
                }
            }
        }
    });

    // Set center time in donut
    document.getElementById('donut-center-time').textContent = formatTime(total);
}

function renderLineChart(dailyTotals) {
    const canvas = document.getElementById('week-line-chart');
    const ctx = canvas.getContext('2d');
    if (weekLineChart) weekLineChart.destroy();

    const labels = [];
    const data = [];
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const label = weekDays[d.getDay() === 0 ? 6 : d.getDay() - 1];
        labels.push(label);
        data.push(dailyTotals[iso] || 0);
    }

    const maxUsage = Math.max(...data); // in seconds

    // Choose a good step size (in seconds) based on max usage
    let stepSize;
    if (maxUsage <= 1800) { // less than 30 mins
        stepSize = 300; // 5 min
    } else if (maxUsage <= 3600) {
        stepSize = 600; // 10 min
    } else if (maxUsage <= 7200) {
        stepSize = 1800; // 30 min
    } else {
        stepSize = 3600; // 1 hour
    }

    // Gradient for techno fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, accentColor);
    gradient.addColorStop(1, 'rgba(0,255,255,0.08)');
    getColor();
    weekLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Usage',
                data,
                borderColor: accentColor,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: accentColor,
                pointBorderWidth: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: stepSize,
                        color: primaryColor,
                        callback: value => formatTime(value) // shows hh:mm:ss
                    },
                    grid: {
                        display: false,
                    }
                },
                x: {
                    ticks: {
                        color: primaryColor,
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: bgColor,
                    borderColor: primaryColor,
                    borderWidth: 1,
                    titleColor: primaryColor,
                    bodyColor: primaryColor,
                    callbacks: {
                        label: ctx => `Time: ${formatTime(ctx.parsed.y)}`
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderRadarChart(todayUsage) {
    const ctx = document.getElementById('category-radar-chart').getContext('2d');
    if (radarCategoryChart) radarCategoryChart.destroy();

    getColor();
    const gridColor = 'rgba(100,181,246,1)';
    const labelColor = 'rgba(180, 210, 255, 0.8)';

    // Initialize categories with 0
    const categories = { entertainment: 0, social: 0, productivity: 0, news: 0, other: 0 };

    // Helper to normalize category from getCategory output
    const normalizeCategory = (cat) => {
        if (!cat) return 'other';
        cat = cat.toLowerCase();
        if (cat === 'entertainment') return 'entertainment';
        if (cat === 'social media') return 'social';
        if (cat === 'productivity' || cat === 'education') return 'productivity';
        if (cat === 'news') return 'news';
        return 'other';
    };

    for (const domain in todayUsage) {
        const cat = getCategory(domain);
        const radarCat = normalizeCategory(cat);
        categories[radarCat] = (categories[radarCat] || 0) + todayUsage[domain];
    }

    // Capitalize labels for radar chart
    const labels = Object.keys(categories).map(c => c.charAt(0).toUpperCase() + c.slice(1));

    // Gradient fill for radar dataset
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, accentColor);
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.1)');

    radarCategoryChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: 'Category Time',
                data: Object.values(categories),
                fill: true,
                backgroundColor: gradient,
                borderColor: accentColor,
                borderWidth: 2,
                // Remove dots by setting point radius and hover radius to 0
                pointBackgroundColor: primaryColor,
                pointBorderColor: accentColor,
                pointRadius: 1,
                pointHoverRadius: 5,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: {
                        color: primaryColor,
                        font: { size: 14, weight: '600' }
                    },
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: bgColor,
                    borderColor: accentColor,
                    borderWidth: 1,
                    titleColor: accentColor,
                    bodyColor: primaryColor,
                    callbacks: {
                        label: ctx => {
                            const time = formatTime(ctx.parsed.r);
                            return `${ctx.label}: ${time}`;
                        }
                    }
                }
            }
        }
    });
}

function renderLongestSessionsChart(usage) {
    const canvas = document.getElementById('longest-sessions-chart');
    const ctx = canvas.getContext('2d');
    if (longestSessionsChart) longestSessionsChart.destroy();

    const todayStr = new Date().toISOString().split('T')[0];
    const dayData = usage.daily?.[todayStr] || {};
    const sessions = [];

    // Collect longest session per domain
    for (const domain in dayData) {
        const sessionList = dayData[domain]?.sessions || [];
        const longest = sessionList.reduce((max, sess) => {
            const dur = Math.floor((sess.end - sess.start) / 1000);
            return Math.max(max, dur);
        }, 0);
        if (longest > 0) sessions.push({ domain, duration: longest, icon: getFavicon(domain) });
    }

    // Sort descending by duration and take top 5
    const topSessions = sessions.sort((a, b) => b.duration - a.duration).slice(0, 5);

    const labels = topSessions.map(() => '');  // No labels on y-axis ticks
    const data = topSessions.map(d => d.duration);
    const icons = topSessions.map(d => d.icon);

    const gradients = technoColors.map(([h1, s1, l1]) => {
        const h2 = (h1 + 30) % 360;
        const l2 = Math.max(l1 - 20, 30);
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, `hsl(${h1}, ${s1}%, ${l1}%)`);
        gradient.addColorStop(1, `hsl(${h2}, ${s1}%, ${l2}%)`);
        return gradient;
    });

    // Preload favicon images to avoid flicker
    const faviconImages = icons.map(src => {
        const img = new Image();
        img.src = src;
        return img;
    });

    longestSessionsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: gradients,
                barThickness: 8,
                borderRadius: 0,
                maxBarThickness: 10,
                hoverOffset: 4,
                spacing: 1
            }]
        },
        options: {
            indexAxis: 'y',
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => formatTime(ctx.raw)
                    },
                    backgroundColor: bgColor,
                    borderColor: accentColor,
                    borderWidth: 1,
                    titleColor: primaryColor,
                    bodyColor: accentColor
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: primaryColor,
                        callback: v => formatTime(v),
                        maxTicksLimit: 6,
                    },
                    grid: {
                        color: 'rgba(187,222,251,0.2)'
                    },
                    beginAtZero: true,
                },
                y: {
                    ticks: { color: 'transparent', callback: () => '' },
                    grid: { display: false },
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 48  // space for favicons
                }
            }
        },
        plugins: [{
            id: 'faviconIcons',
            afterDraw(chart) {
                const ctx = chart.ctx;
                faviconImages.forEach((img, i) => {
                    if (!img.complete) return; // wait for image to load

                    const y = chart.scales.y.getPixelForTick(i) - 12;
                    const x = chart.chartArea.right + 12;
                    ctx.drawImage(img, x, y, 24, 24);
                });
            }
        }]
    });
}


// === Event Listeners ===
document.getElementById('tracking-toggle').addEventListener('change', async (e) => {
    const enabled = e.target.checked;

    await chrome.storage.local.set({ trackingEnabled: enabled });

    if (!enabled) {
        await chrome.storage.local.remove(storageKey);
        usageData = null;
    }

    init();
});


document.getElementById('clear-data-btn').addEventListener('click', async () => {
    if (confirm('Clear all tracking data?')) {
        const response = await chrome.runtime.sendMessage({ action: 'clear-data' });
        if (response?.success) {
            createPopup("Successfully deleted data", "success");
            usageData = null;
            init();
        } else {
            createPopup("Failed to clear tracking data.");
        }
    }
});


document.addEventListener('DOMContentLoaded', init);

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.trackingEnabled || changes.usageData)) {
        init();
    }
});
