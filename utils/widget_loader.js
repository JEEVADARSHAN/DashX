// Constants for grid size
const CELL_WIDTH = 117;
const CELL_HEIGHT = 100;
const CELL_GAP = 16;
const CONTAINER = document.querySelector(".widget-area");

// Widget layout data
const DEFAULT_LAYOUT = [
    { id: "time_default", x: 3, y: 0, width: 3, height: 2 },
    { id: "time_small", x: 3, y: 0, width: 2, height: 1 },
    { id: "weather_default", x: 0, y: 0, width: 2, height: 1 },
    { id: "weather_small", x: 0, y: 0, width: 1, height: 1 },
    { id: "ram_default", x: 7, y: 0, width: 2, height: 1 },
    { id: "ram_small", x: 0, y: 0, width: 1, height: 1 },
    { id: "stpClock", x: 0, y: 4, width: 2, height: 1 },
    { id: "calendar", x: 0, y: 1, width: 2, height: 3 },
    { id: "searchBar_normal", x: 2, y: 2, width: 5, height: 1 },
    { id: "searchBar_dashed", x: 2, y: 2, width: 3, height: 1 },
    { id: "quotes", x: 2, y: 3, width: 5, height: 1 },
    { id: "bookMark", x: 7, y: 1, width: 2, height: 2 },
    { id: "rss", x: 0, y: 0, width: 2, height: 2 },
    { id: "todo", x: 0, y: 0, width: 2, height: 2 },
    { id: "g2048", x: 0, y: 0, width: 1, height: 1 },
    { id: "snake", x: 0, y: 0, width: 1, height: 1 },
];

// Widget State data
const DEFAULT_STATE = {
    time_default: true,
    time_small: false,
    weather_default: true,
    weather_small:false,
    ram_default: true,
    ram_small: false,
    stpClock: false,
    calendar: false,
    searchBar_normal: true,
    searchBar_dashed: false,
    quotes: true,
    bookMark: false,
    rss: false,
    todo: false,
    g2048: false,
    snake: false,
};


// Get the widget layout from localStorage or fallback to DEFAULT_LAYOUT
let widgetLayout = JSON.parse(localStorage.getItem("widgetLayout")) || DEFAULT_LAYOUT;
let widgetState = JSON.parse(localStorage.getItem("widgetState")) || DEFAULT_STATE;

if (!localStorage.getItem("widgetLayout")) {
    localStorage.setItem("widgetLayout", JSON.stringify(DEFAULT_LAYOUT));
}

// Ensure widget state is saved if not present in localStorage
if (!localStorage.getItem("widgetState")) {
    localStorage.setItem("widgetState", JSON.stringify(DEFAULT_STATE));
}

// Function to calculate widget position based on x, y, width, and height
function calculatePosition(x, y, width, height) {
    const left = x * (CELL_WIDTH + CELL_GAP);
    const top = y * (CELL_HEIGHT + CELL_GAP);
    const widgetWidth = width * (CELL_WIDTH + CELL_GAP) - CELL_GAP;
    const widgetHeight = height * (CELL_HEIGHT + CELL_GAP) - CELL_GAP;

    return { left, top, width: widgetWidth, height: widgetHeight };
}

// Function to find the nearest grid position for the widget
function findNearestGrid(x, y) {
    const columns = Math.floor(CONTAINER.clientWidth / (CELL_WIDTH + CELL_GAP));
    const rows = Math.floor(CONTAINER.clientHeight / (CELL_HEIGHT + CELL_GAP));

    const nearestX = Math.floor(x / (CELL_WIDTH + CELL_GAP));
    const nearestY = Math.floor(y / (CELL_HEIGHT + CELL_GAP));

    return {
        x: Math.min(Math.max(nearestX, 0), columns - 1),
        y: Math.min(Math.max(nearestY, 0), rows - 1),
    };
}

// Function to make the widget draggable and snap to the grid
function makeDraggable(widgetEl) {
    let offsetX = 0;
    let offsetY = 0;

    const dragHandle = widgetEl.querySelector(".drag-btn");

    if (!dragHandle) return;

    const SCALE = 0.9;

    const onMouseDown = (e) => {
        e.preventDefault();

        if (!widgetEl.classList.contains("edit-mode")) return;

        widgetEl.classList.add("is-moving");

        const containerRect = CONTAINER.getBoundingClientRect();

        offsetX = (e.clientX - containerRect.left - widgetEl.offsetLeft * SCALE) / SCALE;
        offsetY = (e.clientY - containerRect.top - widgetEl.offsetTop * SCALE) / SCALE;

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
        e.preventDefault();

        const containerRect = CONTAINER.getBoundingClientRect();

        const x = (e.clientX - containerRect.left - offsetX * SCALE) / SCALE;
        const y = (e.clientY - containerRect.top - offsetY * SCALE) / SCALE;

        widgetEl.style.left = `${x}px`;
        widgetEl.style.top = `${y}px`;
    };

    const onMouseUp = (e) => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        widgetEl.classList.remove("is-moving");

        const id = widgetEl.dataset.id;
        const original = widgetLayout.find(w => w.id === id);
        if (!original) return;

        const cellWidth = parseInt(widgetEl.dataset.width);
        const cellHeight = parseInt(widgetEl.dataset.height);

        const { x: snapX, y: snapY } = findNearestGrid(e.clientX, e.clientY);

        const sameSpot = snapX === original.x && snapY === original.y;

        if (!sameSpot && isPositionOccupied(snapX, snapY, cellWidth, cellHeight, id)) {

            const { left, top, width: pixelWidth, height: pixelHeight } = calculatePosition(original.x, original.y, original.width, original.height);

            widgetEl.style.left = `${left}px`;
            widgetEl.style.top = `${top}px`;
            widgetEl.style.width = `${pixelWidth}px`;
            widgetEl.style.height = `${pixelHeight}px`;

            return;
        }

        const { left, top, width: pixelWidth, height: pixelHeight } = calculatePosition(snapX, snapY, cellWidth, cellHeight);

        widgetEl.style.left = `${left}px`;
        widgetEl.style.top = `${top}px`;
        widgetEl.style.width = `${pixelWidth}px`;
        widgetEl.style.height = `${pixelHeight}px`;

        widgetEl.dataset.x = snapX;
        widgetEl.dataset.y = snapY;

        const widgetData = widgetLayout.find(w => w.id === id);
        if (widgetData) {
            widgetData.x = snapX;
            widgetData.y = snapY;
            widgetData.width = cellWidth;
            widgetData.height = cellHeight;
            saveLayout();
        }
    };

    dragHandle.addEventListener("mousedown", onMouseDown);
}



function isPositionOccupied(newX, newY, newWidth, newHeight, movingWidgetId) {
    for (const widget of widgetLayout) {
        const { id, x, y, width, height } = widget;

        // Skip hidden widgets or the one being moved
        if (id === movingWidgetId || widgetState[id] === false) continue;

        const xOverlap = newX < x + width && newX + newWidth > x;
        const yOverlap = newY < y + height && newY + newHeight > y;

        if (xOverlap && yOverlap) {
            return true;
        }
    }
    return false;
}




// Function to save widget layout to localStorage
function saveLayout() {
    localStorage.setItem("widgetLayout", JSON.stringify(widgetLayout));
}

// Function to load and render widgets based on their layout
async function loadWidgets() {
    for (const { id, x, y, width, height } of widgetLayout) {
        // Skip hidden or disabled widgets
        if (widgetState.hasOwnProperty(id) && widgetState[id] === false) {
            continue;
        }

        try {
            // Dynamically import widget module
            const module = await import(`../widgets/${id}.js`);
            const widgetEl = await module.createWidget();

            widgetEl.classList.add("widget");
            widgetEl.dataset.id = id;
            widgetEl.dataset.x = x;
            widgetEl.dataset.y = y;
            widgetEl.dataset.width = width;
            widgetEl.dataset.height = height;

            const { left, top, width: widgetWidth, height: widgetHeight } = calculatePosition(x, y, width, height);
            widgetEl.style.left = `${left}px`;
            widgetEl.style.top = `${top}px`;
            widgetEl.style.width = `${widgetWidth}px`;
            widgetEl.style.height = `${widgetHeight}px`;
            makeDraggable(widgetEl);

            CONTAINER.appendChild(widgetEl);
        } catch (err) {
            console.error(`Failed to load widget "${id}":`, err);
        }
    }
}
function reloadWidgets() {
    CONTAINER.innerHTML = ``;
    let widgetLayout = JSON.parse(localStorage.getItem("widgetLayout")) || DEFAULT_LAYOUT;
    let widgetState = JSON.parse(localStorage.getItem("widgetState")) || DEFAULT;
    loadWidgets();
}

// Initialize widget layout and load widgets
loadWidgets();