function bytesToGB(bytes) {
    return (bytes / (1024 ** 3)).toFixed(2);
}

function polarToCartesian(cx, cy, r, angleInDeg) {
    const angleInRad = (angleInDeg - 90) * Math.PI / 180.0;
    return {
        x: cx + r * Math.cos(angleInRad),
        y: cy + r * Math.sin(angleInRad)
    };
}

function describeArcSegment(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", start.x, start.y,
        "A", r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
}

export function createWidget() {
    const widget = document.createElement("div");
    widget.id = "ram-widget_small";
    widget.className = "ram-widget glass";

    const numSegments = 30; // total segments
    const startAngle = 135;
    const endAngle = 45 + 360; // Complete loop
    const radius = 45;
    const arcGap = 4; // degrees between segments

    // Generate segments
    let segmentsHTML = '';
    for (let i = 0; i < numSegments; i++) {
        const segStart = startAngle + i * ((endAngle - startAngle) / numSegments);
        const segEnd = segStart + ((endAngle - startAngle) / numSegments) - arcGap;
        const d = describeArcSegment(60, 60, radius, segStart, segEnd);
        segmentsHTML += `<path class="ram-segment" d="${d}" />`;
    }

    widget.innerHTML = `
    <div class="close-btn">&#x2715;</div>
    <div class="drag-btn"><img src="../assets/other/drag.png"></div>
    <div class="ram-circle-widget">
      <svg width="150" height="120" viewBox="0 0 120 120" style="transform: rotateZ(90deg);">
        <defs>
          <linearGradient id="neonGradient" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4cd9fe" />
            <stop offset="100%" stop-color="#12aaff" />
          </linearGradient>
        </defs>
        ${segmentsHTML}
      </svg>
      <div class="circle-text">
        <div>RAM</div>
        <div class="ram-percent">0%</div>
      </div>
    </div>
    `;

    function updateRAMWidget() {
        chrome.system.memory.getInfo((info) => {
            const total = info.capacity;
            const available = info.availableCapacity;
            const used = total - available;

            const usagePercent = ((used / total) * 100).toFixed(1);
            const activeCount = Math.round((usagePercent / 100) * numSegments);

            const segments = widget.querySelectorAll(".ram-segment");
            segments.forEach((seg, index) => {
                if (index < activeCount) {
                    seg.classList.add("active");
                } else {
                    seg.classList.remove("active");
                }
            });

            const percentText = widget.querySelector(".ram-percent");
            if (percentText) percentText.textContent = `${usagePercent}%`;
        });
    }

    updateRAMWidget();
    setInterval(updateRAMWidget, 5000);

    return widget;
}
