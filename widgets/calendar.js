export function createWidget() {
    const widgetEl = document.createElement("div");
    widgetEl.id = "calendar";
    widgetEl.classList.add("glass");

    let currentDate = new Date();

    function rendercalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = `
            <div class="close-btn">&#x2715;</div>
            <div class="drag-btn"><img src="../assets/other/drag.png"></div>
            <div class="calendar-header">
                <button id="prev-month" aria-label="Previous Month">&#9664;</button>
                <span id="month-display" tabindex="0">${monthNames[month]}</span>
                <span id="year-display" tabindex="0">${year}</span>
                <button id="next-month" aria-label="Next Month">&#9658;</button>
                
            </div>
            <div>
                <input type="checkbox" id="month-checkbox">
                <input type="checkbox" id="year-checkbox">
                <div id="picker-container" class="picker-container">
                    <div id="month-picker" class="picker scrollable">
                        ${monthNames.map((m, i) =>
            `<div class="picker-item${i === month ? ' selected' : ''}" data-month="${i}">${m}</div>`
        ).join('')}
                    </div>
                    <div id="year-picker" class="picker scrollable">
                        ${generateYearList(year, 1950, 2050)}
                    </div>
                </div>
            </div>
            <div id="dates-container">
                <div class="calendar-grid">
                    <div class="calendar-day-name">Sun</div>
                    <div class="calendar-day-name">Mon</div>
                    <div class="calendar-day-name">Tue</div>
                    <div class="calendar-day-name">Wed</div>
                    <div class="calendar-day-name">Thu</div>
                    <div class="calendar-day-name">Fri</div>
                    <div class="calendar-day-name">Sat</div>
        `;

        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        for (let date = 1; date <= daysInMonth; date++) {
            const isToday = date === day && month === new Date().getMonth() && year === new Date().getFullYear();
            html += `<div class="calendar-day${isToday ? ' today' : ''}">${date}</div>`;
        }

        let todayDate = new Date();
        const dateString = todayDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        html += `</div></div>`; // close calendar-grid and dates-container
        
        html += `
            <hr style="margin-bottom:5px;">
            <div class="today-date" style="display:flex; flex-direction:row; justify-content: space-between;">
                <span>${dateString}</span>
                <button id="current-date-btn" aria-label="Go to Current Date">⟲</button>
            </div>
        `;
        widgetEl.innerHTML = html;

        addListeners();
    }

    function generateYearList(currentYear, startYear, endYear) {
        let list = '';
        for (let y = startYear; y <= endYear; y++) {
            list += `<div class="picker-item${y === currentYear ? ' selected' : ''}" data-year="${y}">${y}</div>`;
        }
        return list;
    }

    function addListeners() {
        const prevBtn = widgetEl.querySelector('#prev-month');
        const nextBtn = widgetEl.querySelector('#next-month');
        const monthDisplay = widgetEl.querySelector('#month-display');
        const yearDisplay = widgetEl.querySelector('#year-display');
        const currentDateBtn = widgetEl.querySelector('#current-date-btn');
        const monthCheckbox = widgetEl.querySelector('#month-checkbox');
        const yearCheckbox = widgetEl.querySelector('#year-checkbox');
        const monthPicker = widgetEl.querySelector('#month-picker');
        const yearPicker = widgetEl.querySelector('#year-picker');
        const datesContainer = widgetEl.querySelector('#dates-container');

        prevBtn.addEventListener('click', () => {
            monthCheckbox.checked = false;
            yearCheckbox.checked = false;
            changeMonth(-1);
        });

        nextBtn.addEventListener('click', () => {
            monthCheckbox.checked = false;
            yearCheckbox.checked = false;
            changeMonth(1);
        });

        monthDisplay.addEventListener('click', () => {
            const isOpen = monthCheckbox.checked;
            monthCheckbox.checked = !isOpen;
            yearCheckbox.checked = false;
            updateDateContainerVisibility();
        });

        yearDisplay.addEventListener('click', () => {
            const isOpen = yearCheckbox.checked;
            yearCheckbox.checked = !isOpen;
            monthCheckbox.checked = false;
            updateDateContainerVisibility();
        });

        function updateDateContainerVisibility() {
            if (monthCheckbox.checked || yearCheckbox.checked) {
                datesContainer.classList.add('collapsed');
            } else {
                datesContainer.classList.remove('collapsed');
            }
        }

        currentDateBtn.addEventListener('click', () => {
            currentDate = new Date();
            rendercalendar();
        });

        monthPicker.querySelectorAll('.picker-item').forEach(item => {
            item.addEventListener('click', () => {
                const month = parseInt(item.dataset.month);
                currentDate.setMonth(month);
                monthCheckbox.checked = false;
                updateDateContainerVisibility();
                rendercalendar();
            });
        });

        yearPicker.querySelectorAll('.picker-item').forEach(item => {
            item.addEventListener('click', () => {
                const year = parseInt(item.dataset.year);
                currentDate.setFullYear(year);
                yearCheckbox.checked = false;
                updateDateContainerVisibility();
                rendercalendar();
            });
        });

        document.addEventListener('click', (e) => {
            if (!widgetEl.contains(e.target)) {
                monthCheckbox.checked = false;
                yearCheckbox.checked = false;
                updateDateContainerVisibility();
            }
        });
    }

    function changeMonth(offset) {
        currentDate.setMonth(currentDate.getMonth() + offset);
        rendercalendar();
    }

    // Initial render
    rendercalendar();

    return widgetEl;
}
