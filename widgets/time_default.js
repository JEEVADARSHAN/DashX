export function createWidget() {
    const widget = document.createElement("div");
    widget.id = "time-widget_default";
    widget.classList.add("time-widget");

    widget.innerHTML = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div class="time">--:--</div>
        <div class="date">Loading date...</div>
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
