// widgets/weather.js

export function createWidget() {
    const container = document.createElement("div");
    container.id = "weather-widget_default";
    container.className = "weather-widget widget glass";

    // Set initial loading HTML
    container.innerHTML = fullWidgetHTML("Loading", "-", "-", "-");

    const stored = JSON.parse(localStorage.getItem("weather_location"));
    const lat = stored?.lat ?? 40.7128;      // Default: New York
    const lon = stored?.lon ?? -74.0060;
    const city = stored?.city ?? "New York";

    fetchAndRenderWeather(lat, lon, city, container);
    setInterval(() => fetchAndRenderWeather(lat, lon, city, container), 600000); // every 10 min

    return container;
}

function fullWidgetHTML(city, icon, weather, temp, wind = "-") {
    return `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div class="widget-content">
            ${contentHTML(city, icon, weather, temp, wind)}
        </div>
    `;
}

function contentHTML(city, icon, weather, temp, wind = "-") {
    return `
        <div style="overflow: hidden;">
            <h2 class="city-name">${city}</h2>
            <div style="display:flex;align-items:center;">
                <div class="weather-icon">${icon}</div>
                <p style="font-size: 0.7rem;" class="weather-name">${weather}</p>
            </div>
        </div>
        <div class="right-side">
            <h2 class="temperature">${temp}°C</h2>
            <p><span>༄</span> Wind: ${wind} km/hr</p>
        </div>
    `;
}

function offlineHTML() {
    return `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div class="widget-content">
            ${contentHTML("You are Offline", "", "-", "-")}
        </div>
    `;
}

async function fetchAndRenderWeather(lat, lon, fallbackCity, widget) {
    if (!widget) return;

    if (!navigator.onLine) {
        widget.innerHTML = offlineHTML();
        return;
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

    try {
        const res = await fetch(weatherUrl);
        const data = await res.json();
        const cw = data.current_weather;
        const code = cw.weathercode;

        // Get city from localStorage or reverse geocode
        const stored = JSON.parse(localStorage.getItem("weather_location"));
        const city = stored?.city || await getCityName(lat, lon);

        // Update only the inner content
        widget.querySelector(".widget-content").innerHTML = contentHTML(
            city,
            getIcon(code),
            weatherCodeMapping(code),
            cw.temperature,
            cw.windspeed
        );

        // Update background color based on weather code
        widget.style.backgroundColor = getWidgetBackgroundColor(code);

    } catch (err) {
        console.error("Weather fetch failed:", err);
        widget.innerHTML = offlineHTML();
        widget.style.backgroundColor = "rgba(255,255,255,0.5)";
    }
}

async function getCityName(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        return data.address.city || data.address.town || data.address.village || "Unknown";
    } catch {
        return "Unknown";
    }
}




// geocode-input.js
document.getElementById("city-name").addEventListener("change", async function () {
    const city = this.value.trim();

    // Allow only letters and spaces (2+ characters, no digits, no punctuation)
    const cityPattern = /^[A-Za-z\s]{2,}$/;

    if (!city) {
        createPopup("Please enter a city name.");
        return;
    }

    if (!cityPattern.test(city)) {
        createPopup("Invalid input. Please enter a valid city name without numbers or special characters.");
        return;
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
        const data = await res.json();

        if (data.length === 0) {
            createPopup("City not found. Please try again with a valid name.");
            return;
        }

        const location = data[0];
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);
        const displayName = location.display_name.split(",")[0]; // Shorten name

        // Store in "DB"
        localStorage.setItem("weather_location", JSON.stringify({ lat, lon, city: displayName }));

        createPopup(`Location saved: ${displayName}`, "success");
    } catch (err) {
        console.error("Geocoding error:", err);
        createPopup("Failed to get location. Try again later.");
    }
});



export function weatherCodeMapping(code) {
    const map = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Drizzle",
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
        80: "Slight rain",
        81: "Moderate rain",
        82: "Violent rain",
        85: "Slight snow",
        86: "Heavy snow",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
        100: "Wind"
    };
    return map[code] || "-";
}

export function getIcon(code) {
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

export function getWidgetBackgroundColor(code) {
    const map = {
        0: "rgba(129, 212, 250, 0.6)",   // Clear sky
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
        100: "rgba(178, 223, 219, 0.6)"  // Wind
    };

    return map[code] || "rgba(255, 255, 255, 0.5)";
}
