const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let dx = 1;
let dy = 0;
let food = { x: 5, y: 5 };
let speed = 150;
let score = 0;
let gameInterval;
let gamePaused = false;

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snake.forEach(segment => drawCell(segment.x, segment.y, "#00ff00"));
    drawCell(food.x, food.y, "red");
    document.getElementById("score").textContent = `Score: ${score}`;
    animateScore();
}

function animateScore() {
    let scoreText = document.getElementById("score");
    scoreText.style.transition = "font-size 0.3s ease-in-out";
    scoreText.style.fontSize = "1.8rem";
    setTimeout(() => {
        scoreText.style.fontSize = "1.5rem";
    }, 300);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wrap around edges
    head.x = (head.x + tileCount) % tileCount;
    head.y = (head.y + tileCount) % tileCount;

    // Check collision with the snake itself
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        createPopup("Game Over!");
        resetGame();
        return;
    }

    snake.unshift(head);

    // Check if the snake eats food
    if (head.x === food.x && head.y === food.y) {
        score++;
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        speed = Math.max(50, speed - 5); // Increase speed
    } else {
        snake.pop();
    }

    drawGame();
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 1;
    dy = 0;
    score = 0;
    speed = 150;
    clearInterval(gameInterval);
    gamePaused = false;
    document.getElementById("startBtn").disabled = false;
}

function startGame() {
    gamePaused = false;
    document.getElementById("startBtn").disabled = true;
    gameInterval = setInterval(moveSnake, speed);
}

function pauseGame() {
    clearInterval(gameInterval);
    gamePaused = true;
}

document.addEventListener("keydown", e => {
    if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -1; }
    if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 1; }
    if (e.key === "ArrowLeft" && dx === 0) { dx = -1; dy = 0; }
    if (e.key === "ArrowRight" && dx === 0) { dx = 1; dy = 0; }
});

document.getElementById("startBtn").addEventListener("click", () => {
    if (gamePaused) {
        startGame();
    } else {
        resetGame();
        startGame();
    }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
    if (!gamePaused) {
        pauseGame();
    }
});

document.getElementById("resetBtn").addEventListener("click", () => {
    resetGame();
    drawGame();
});

// Initialize the game
drawGame();
