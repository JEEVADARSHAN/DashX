// widgets/ram.js
function bytesToGB(bytes) {
    return (bytes / (1024 ** 3)).toFixed(2);
}

function createWidget() {
    const widget = document.createElement("div");
    widget.id = "ram-widget_default";
    widget.className = "ram-widget glass";
    widget.innerHTML = `
    <div class="close-btn">&#x2715;</div>
    <div class="drag-btn"><img src="../assets/other/drag.png"></div>
    <div class="container">
    <img src="assets/other/ram.png">
    <div style="width: 100%;">
    <h3 style="font-weight:200;">Memory Used</h3>
    <p>Loading...</p>
    <div style="display: flex; align-items: center; gap: 10px;">
        <div style="background: #fff; border-radius: 8px; height: 12px; flex-grow: 1; overflow: hidden;">
            <div class="ram-bar"></div>
        </div>
        <small>0% used</small>
    </div>
    </div>
    </div>
`;

    // Update RAM data every 5 seconds
    function updateRAMWidget() {
        chrome.system.memory.getInfo((info) => {
            const total = info.capacity;
            const available = info.availableCapacity;
            const used = total - available;

            const usedGB = bytesToGB(used);
            const totalGB = bytesToGB(total);
            const usagePercent = ((used / total) * 100).toFixed(1);

            const bar = widget.querySelector(".ram-bar");
            const paragraph = widget.querySelector("p");
            const small = widget.querySelector("small");

            if (bar && paragraph && small) {
                bar.style.width = `${usagePercent}%`;
                paragraph.textContent = `${usedGB} / ${totalGB} GB`;
                small.textContent = `${usagePercent}%`;
            }
        });
    }

    updateRAMWidget();
    setInterval(updateRAMWidget, 5000);

    return widget;
}

export { createWidget };
