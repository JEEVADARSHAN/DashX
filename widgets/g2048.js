export function createWidget() {
    const widget = document.createElement("div");
    widget.id = "g2048-widget";
    widget.style.justifyItems = "start";
    widget.classList.add("game-widget");
    widget.style.padding = "0";
    widget.innerHTML = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div style="width:100%; height:100%; display: flex; flex-direction: column;">
        <div style="position: relative;display:flex; flex-direction: column; width: 100%; height:100%;">
            <img style="height:100%; width:100%; object-fit:fill; border-radius: 16px;" src="../assets/game/g2048.png" style=" position: absolute; top:0; left:50%; height:100%;transform: translateX(-50%)">
            <button class="game-description">Play</button>
        </div>
        </div>
    `;

    // Get the button element
    const playButton = widget.querySelector(".game-description");

    // Handle click to launch the game only when the button is clicked
    playButton.addEventListener('click', (event) => {
        // Prevent the click event from propagating to the widget
        event.stopPropagation();
        window.open('../../games/2048/index.html');
    });

    return widget;
}
