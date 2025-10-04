function createWidget() {
    const widget = document.createElement("div");
    widget.id = "stpClock-widget";
    widget.classList.add("glass");

    let startTime = 0;
    let elapsed = 0;
    let running = false;
    let frameId = null;

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        return {
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0'),
            milliseconds: String(milliseconds).padStart(2, '0')
        };
    }

    function renderStopClock() {
        widget.innerHTML = `
            <div class="close-btn">&#x2715;</div>
            <div class="drag-btn"><img src="../assets/other/drag.png"></div>
            <div class="stopclock-container">
            <p>Stop Clock</p>
                <div class="stopclock-display">
                    <div class="time-unit minute-container">
                        <span class="time-digit" id="minute-display">00</span>
                    </div> :
                    <div class="time-unit second-container">
                        <span class="time-digit" id="second-display">00</span>
                    </div> .
                    <div class="time-unit millisecond-container">
                        <span class="time-digit" id="millisecond-display">00</span>
                    </div>
                </div>
                <div class="stopclock-controls">
                    <button class="stopclock-startstop">&#9658;</button>
                    <button class="stopclock-reset" disabled>&#x23F9;</button>
                </div>
            </div>
        `;
        addListeners();
    }

    function updateDisplay() {
        const now = performance.now();
        const time = elapsed + (now - startTime);
        const { minutes, seconds, milliseconds } = formatTime(time);

        document.getElementById('minute-display').textContent = minutes;
        document.getElementById('second-display').textContent = seconds;
        document.getElementById('millisecond-display').textContent = milliseconds;

        frameId = requestAnimationFrame(updateDisplay);
    }



    function addListeners() {
        const startStopBtn = widget.querySelector(".stopclock-startstop");
        const resetBtn = widget.querySelector(".stopclock-reset");

        if (!startStopBtn || !resetBtn) return;

        startStopBtn.addEventListener("click", () => {
            if (!running) {
                running = true;
                startTime = performance.now();
                startStopBtn.innerHTML = "&#x23F8;"; // Pause symbol
                resetBtn.disabled = false; // Enable reset button
                updateDisplay();
            } else {
                running = false;
                elapsed += performance.now() - startTime;
                cancelAnimationFrame(frameId);
                startStopBtn.innerHTML = "&#9658;"; // Play symbol
            }
        });

        resetBtn.addEventListener("click", () => {
            if (running) {
                running = false;
                cancelAnimationFrame(frameId);
            }
            elapsed = 0;
            const { minutes, seconds, milliseconds } = formatTime(0);
            document.getElementById('minute-display').textContent = minutes;
            document.getElementById('second-display').textContent = seconds;
            document.getElementById('millisecond-display').textContent = milliseconds;
            startStopBtn.innerHTML = "&#9658;";
            resetBtn.disabled = true; // Disable reset after reset
        });
    }

    renderStopClock();
    return widget;
}

export { createWidget };
