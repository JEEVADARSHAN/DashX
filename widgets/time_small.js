export function createWidget() {
    const widget = document.createElement("div");
    widget.id = "time-widget_small";
    widget.style.padding = 0;
    widget.style.justifyItems = "start";
    widget.classList.add("time-widget");

    widget.innerHTML = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div style="display:flex; flex-direction: column; align-items:start;padding-left: 14px;">
        <div class="time" style="font-size:30px">--:--</div>
        <div class="date" style="font-size:15px;backdrop-filter:none;">Loading date...</div>
        </div>
    `;

    function updateTime() {
        const now = new Date();

        const timeString = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        const dateString = now.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        widget.querySelector(".time").textContent = timeString;
        widget.querySelector(".date").textContent = dateString;
    }

    function scheduleMidnightUpdate() {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(24, 0, 0, 0);
        const msUntilMidnight = nextMidnight - now;

        setTimeout(() => {
            updateTime();
            scheduleMidnightUpdate();
        }, msUntilMidnight);
    }

    updateTime();
    scheduleMidnightUpdate();
    setInterval(updateTime, 1000);

    return widget;
}
