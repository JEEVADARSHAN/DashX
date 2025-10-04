// widgets/weatherCompact.js

export function createWidget() {
    const container = document.createElement("div");
    container.id = "weather-widget_small";
    container.className = "weather-widget widget glass";

    container.innerHTML = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div class="weather-compact">
            <div class="weather-icon">?</div>
            <h2 style="font-size:1.5em;font-weight: 600;" class="temperature">- °C</h2>
            <p class="weather-name">Loading</p>
        </div>
    `;

    // Try localStorage → fallback to default (New York)
    const stored = JSON.parse(localStorage.getItem("weather_location"));
    const lat = stored?.lat ?? 40.7128;
    const lon = stored?.lon ?? -74.0060;

    updateCompactWeather(lat, lon, container);
    setInterval(() => updateCompactWeather(lat, lon, container), 600000);

    return container;
}

async function updateCompactWeather(lat, lon, widget) {
    if (!widget) return;

    if (!navigator.onLine) {
        widget.innerHTML = offlineCompactHTML();
        return;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const cw = data.current_weather;
        const code = cw.weathercode;

        const content = widget.querySelector('.weather-compact');
        content.innerHTML = `
            <div class="weather-icon">${getIcon(code)}</div>
            <h2 style="font-size:1.5em;font-weight: 600;" class="temperature">${cw.temperature}°C</h2>
            <p class="weather-name">${weatherCodeMapping(code)}</p>
        `;

        widget.style.backgroundColor = getWidgetBackgroundColor(code);
    } catch (err) {
        console.error("Weather update failed:", err);
        widget.innerHTML = offlineCompactHTML();
        widget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
    }
}

function offlineCompactHTML() {
    return `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div class="weather-compact">
            <div class="weather-icon">?</div>
            <h2 style="font-size:1.5em;font-weight: 600;" class="temperature">- °C</h2>
            <p class="weather-name">Offline</p>
        </div>
    `;
}



function weatherCodeMapping(code) {
    const map = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
        100: "Wind"
    };
    return map[code] || "-";
}

function getIcon(code) {
    const icons = {
        0: "☀️",    // Clear sky
        1: "🌤️",   // Mainly clear
        2: "⛅",     // Partly cloudy
        3: "☁️",    // Overcast
        45: "🌫️",   // Fog
        48: "🌫️",   // Rime fog
        51: "🌦️",   // Light drizzle
        53: "🌦️",   // Moderate drizzle
        55: "🌦️",   // Dense drizzle
        56: "🌦️",   // Light freezing drizzle
        57: "🌦️",   // Dense freezing drizzle
        61: "🌧️",   // Slight rain
        63: "🌧️",   // Moderate rain
        65: "🌧️",   // Heavy rain
        66: "🌧️",   // Light freezing rain
        67: "🌧️",   // Heavy freezing rain
        71: "🌨️",   // Slight snowfall
        73: "🌨️",   // Moderate snowfall
        75: "🌨️",   // Heavy snowfall
        77: "❄️",    // Snow grains
        80: "🌦️",   // Slight rain showers
        81: "🌧️",   // Moderate rain showers
        82: "🌧️",   // Violent rain showers
        85: "🌨️",   // Slight snow showers
        86: "🌨️",   // Heavy snow showers
        95: "⛈️",   // Thunderstorm
        96: "⛈️",   // Thunderstorm with slight hail
        99: "⛈️",   // Thunderstorm with heavy hail
        100: "💨"   // Wind
    };

    return icons[code] || "❓";
}

function getWidgetBackgroundColor(code) {
    const map = {
        0: "rgba(129, 212, 250, 0.5)",   // Clear sky
        1: "rgba(179, 229, 252, 0.5)",   // Mainly clear
        2: "rgba(176, 190, 195, 0.5)",   // Partly cloudy
        3: "rgba(144, 164, 174, 0.5)",   // Overcast
        45: "rgba(144, 164, 174, 0.5)",  // Fog
        48: "rgba(144, 164, 174, 0.5)",  // Rime fog
        51: "rgba(129, 212, 250, 0.4)",  // Light drizzle
        53: "rgba(129, 212, 250, 0.4)",  // Moderate drizzle
        55: "rgba(129, 212, 250, 0.4)",  // Dense drizzle
        56: "rgba(120, 144, 156, 0.4)",  // Light freezing drizzle
        57: "rgba(120, 144, 156, 0.4)",  // Dense freezing drizzle
        61: "rgba(96, 125, 139, 0.5)",   // Slight rain
        63: "rgba(96, 125, 139, 0.5)",   // Moderate rain
        65: "rgba(84, 110, 122, 0.5)",   // Heavy rain
        66: "rgba(84, 110, 122, 0.5)",   // Light freezing rain
        67: "rgba(69, 90, 100, 0.5)",    // Heavy freezing rain
        71: "rgba(225, 245, 254, 0.6)",  // Slight snowfall
        73: "rgba(207, 216, 220, 0.6)",  // Moderate snowfall
        75: "rgba(176, 190, 197, 0.6)",  // Heavy snowfall
        77: "rgba(200, 220, 220, 0.5)",  // Snow grains
        80: "rgba(129, 212, 250, 0.5)",  // Slight rain showers
        81: "rgba(96, 125, 139, 0.5)",   // Moderate rain showers
        82: "rgba(84, 110, 122, 0.5)",   // Violent rain showers
        85: "rgba(207, 216, 220, 0.6)",  // Slight snow showers
        86: "rgba(176, 190, 197, 0.6)",  // Heavy snow showers
        95: "rgba(55, 71, 79, 0.7)",     // Thunderstorm
        96: "rgba(55, 71, 79, 0.7)",     // Thunderstorm with slight hail
        99: "rgba(55, 71, 79, 0.7)",     // Thunderstorm with heavy hail
        100: "rgba(178, 223, 219, 0.5)"  // Wind
    };

    return map[code] || "rgba(255, 255, 255, 0.5)";
}
