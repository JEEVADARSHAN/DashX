// Available widgets (just a sample, update with actual widgets)
const AVAILABLE_WIDGETS = [
    { id: "time_default", name: "Time", tag: "Time" },
    { id: "time_small", name: "Time", tag: "Time" },
    { id: "weather_default", name: "Weather", tag: "Weather" },
    { id: "weather_small", name: "Weather", tag: "Weather" },
    { id: "ram_default", name: "RAM", tag: "Performance" },
    { id: "ram_small", name: "RAM", tag: "Performance" },
    { id: "calendar", name: "Calendar", tag: "Calendar" },
    { id: "searchBar_normal", name: "Search Bar", tag: "Browser" },
    { id: "searchBar_dashed", name: "Search Bar", tag: "Browser" },
    { id: "bookMark", name: "Bookmarks", tag: "Browser" },
    { id: "stpClock", name: "Stop Watch", tag: "Productivity" },
    { id: "quotes", name: "Quotes", tag: "Productivity" },
    { id: "todo", name: "To Do", tag: "Productivity" },
    { id: "rss", name: "News", tag: "News" },
    { id: "g2048", name: "2048", tag: "Games" },
    { id: "snake", name: "snake", tag: "Games" },
];



// Create the widget wizard modal
function createWidgetWizard() {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    const modal = document.createElement("div");
    modal.classList.add("widget-wizard");

    // Group widgets by tag
    const groupedWidgets = AVAILABLE_WIDGETS.reduce((acc, widget) => {
        if (!acc[widget.tag]) acc[widget.tag] = [];
        acc[widget.tag].push(widget);
        return acc;
    }, {});

    modal.innerHTML = `
    <div style="width: 100%; padding: 20px; display: flex; justify-content:space-between;align-items: center;">
        <h2 class="title">Select a Widget to Add</h2>
        <button class="close-btn">
            <img src="../assets/other/close.svg">
        </button>
    </div>
    <div class="widget-list">
        ${Object.entries(groupedWidgets).map(([tag, widgets]) => `
            <div class="widget-card">
                <h4 class="label">${tag}</h4>
                <div class="widget-group">
                    ${widgets.map(widget => {
                const item = DEFAULT_LAYOUT.find(i => i.id === widget.id);
                return `
                            <div class="widget-item" data-id="${widget.id}">
                                <div class="widget-preview" id="preview-${widget.id}"></div>
                                <p class="label">${item.width} x ${item.height}</p>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `).join("")}
    </div>
`;

    AVAILABLE_WIDGETS.forEach(widget => {
        import(`../widgets/${widget.id}.js`)
            .then(module => {
                const layoutItem = DEFAULT_LAYOUT.find(item => item.id === widget.id);
                const previewContainer = modal.querySelector(`#preview-${widget.id}`);
                if (previewContainer) {
                    const widgetEl = module.createWidget();
                    widgetEl.classList.add("widget", "widget-preview-mode");
                    previewContainer.style.width = `${layoutItem.width * (CELL_WIDTH + CELL_GAP) - CELL_GAP}px`;
                    previewContainer.style.height = `${layoutItem.height * (CELL_HEIGHT + CELL_GAP) - CELL_GAP}px`;
                    previewContainer.appendChild(widgetEl);
                }
            })
            .catch(error => {
                console.error(`Failed to load preview for widget "${widget.id}":`, error);
            });
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Trigger transitions
    requestAnimationFrame(() => {
        overlay.classList.add("show");
        modal.classList.add("show");
    });

    // Widget selection
    modal.querySelectorAll(".widget-item").forEach(widgetItem => {
        widgetItem.addEventListener("click", () => {
            const widgetId = widgetItem.dataset.id;
            addWidgetToLayout(widgetId);
            closeModal();
        });
    });


    // Close button
    modal.querySelector(".close-btn").addEventListener("click", () => {
        closeModal();
    });

    function closeModal() {
        overlay.classList.remove("show");
        modal.classList.remove("show");

        setTimeout(() => {
            overlay.remove();
        }, 300); // Match transition duration
    }
}


// Add the selected widget to the layout
function addWidgetToLayout(widgetId) {

    widgetState = JSON.parse(localStorage.getItem("widgetState"));
    // If the widget has already been added (checked in widgetState), alert the user
    if (widgetState[widgetId] === true) {
        createPopup(`The widget which you have selected is already present on the screen.`);
        return;
    }

    // Find the next available grid position (find the first empty spot)
    let x = 0;
    let y = 0;
    const columns = Math.floor(CONTAINER.clientWidth / (CELL_WIDTH + CELL_GAP));
    const rows = Math.floor(CONTAINER.clientHeight / (CELL_HEIGHT + CELL_GAP));

    let widgetLayout = JSON.parse(localStorage.getItem("widgetLayout"));
    let found = false;

    // Get the widget's default width and height
    const widgetDefault = DEFAULT_LAYOUT.find(widget => widget.id === widgetId);
    const widgetWidth = widgetDefault.width;
    const widgetHeight = widgetDefault.height;

    // Loop to find the first empty position considering widget's full width and height
    for (let row = 0; row < rows && !found; row++) {
        for (let col = 0; col < columns && !found; col++) {
            const isOccupied = checkIfPositionOccupied(col, row, widgetWidth, widgetHeight, widgetLayout);

            if (!isOccupied) {
                x = col;
                y = row;
                console.log("Found empty position at:", x, y);
                found = true;
            }
        }
    }

    if (found) {
        const newWidget = {
            id: widgetId,
            x: x,
            y: y,
            width: widgetWidth,
            height: widgetHeight,
        };

        // Set widget state to true (added)
        widgetState[widgetId] = true;
        const widgetIndex = widgetLayout.findIndex(widget => widget.id === widgetId);
        widgetLayout[widgetIndex].x = x;
        widgetLayout[widgetIndex].y = y;
        localStorage.setItem("widgetLayout", JSON.stringify(widgetLayout));

        saveState();

        // Render the new widget
        renderWidget(newWidget);

        // Close the widget wizard modal
        document.querySelector(".widget-wizard").remove();
    } else {
        createPopup("No available space to add this widget.");
    }
}

// Check if the area is occupied by another widget
function checkIfPositionOccupied(col, row, widgetWidth, widgetHeight, layout) {
    for (let i = 0; i < widgetWidth; i++) {
        for (let j = 0; j < widgetHeight; j++) {
            const occupied = layout.some(widget => {
                if (!widgetState[widget.id]) return false;
                const widgetRight = widget.x + widget.width;
                const widgetBottom = widget.y + widget.height;

                return (widget.x <= col + i && widgetRight > col + i &&
                    widget.y <= row + j && widgetBottom > row + j);
            });

            if (occupied) {
                return true;
            }
        }
    }
    return false;
}

// Save widget state to localStorage
function saveState() {
    localStorage.setItem("widgetState", JSON.stringify(widgetState));
}

// Render the widget based on layout
function renderWidget(widgetData) {
    import(`../widgets/${widgetData.id}.js`).then(module => {
        const widgetEl = module.createWidget();
        widgetEl.classList.add("widget");
        widgetEl.classList.add("widget", "edit-mode");
        widgetEl.dataset.id = widgetData.id;
        widgetEl.dataset.x = widgetData.x;
        widgetEl.dataset.y = widgetData.y;
        widgetEl.dataset.width = widgetData.width;
        widgetEl.dataset.height = widgetData.height;

        const { left, top, width, height } = calculatePosition(widgetData.x, widgetData.y, widgetData.width, widgetData.height);
        widgetEl.style.left = `${left}px`;
        widgetEl.style.top = `${top}px`;
        widgetEl.style.width = `${width}px`;
        widgetEl.style.height = `${height}px`;

        makeDraggable(widgetEl);

        CONTAINER.appendChild(widgetEl);
    }).catch(error => {
        console.error(`Error loading widget: ${error}`);
    });
}


// Trigger the widget wizard (for example, when the "Add Widget" button is clicked)
document.getElementById("add").addEventListener("click", createWidgetWizard);