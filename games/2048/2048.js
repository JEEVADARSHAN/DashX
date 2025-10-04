(function () {
    const grid = document.getElementById('grid');
    const scoreEl = document.getElementById('score');
    const resetButton = document.getElementById('reset-button');
    const size = 4;
    let score = 0;
    let board = [];
    let gameOver = false;

    function createGrid() {
        grid.innerHTML = '';
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.val = 0;
            cell.textContent = '';
            grid.appendChild(cell);
        }
    }

    function getCells() {
        return Array.from(document.querySelectorAll('.cell'));
    }

    function updateBoard() {
        const cells = getCells();
        cells.forEach((cell, i) => {
            const val = board[i];
            cell.dataset.val = val;
            cell.textContent = val === 0 ? '' : val;
        });
        scoreEl.textContent = 'Score: ' + score;

        if (gameOver) {
            scoreEl.textContent = 'Game Over! Final Score: ' + score;
        }
    }

    function randomEmptyCell() {
        const emptyIndices = board.map((val, i) => val === 0 ? i : -1).filter(i => i !== -1);
        return emptyIndices.length ? emptyIndices[Math.floor(Math.random() * emptyIndices.length)] : null;
    }

    function addRandomTile() {
        const index = randomEmptyCell();
        if (index !== null) {
            const newTile = Math.random() < 0.9 ? 2 : (Math.random() < 0.5 ? 4 : (Math.random() < 0.33 ? 8 : 16));
            board[index] = newTile;
        }
    }

    function spawnBiggerNumbers() {
        const index = randomEmptyCell();
        if (index !== null) {
            const newTile = Math.random() < 0.8 ? 16 : (Math.random() < 0.5 ? 32 : 64);
            board[index] = newTile;
        }
    }

    function slide(row) {
        const arr = row.filter(val => val !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                score += arr[i];
                arr[i + 1] = 0;
            }
        }
        return arr.filter(val => val !== 0).concat(Array(size - arr.filter(val => val !== 0).length).fill(0));
    }

    function rotateClockwise(b) {
        return b.map((_, i) => b.map(row => row[i]).reverse());
    }

    function move(dir) {
        let newBoard = [];
        let moved = false;
        let rows = [];

        for (let i = 0; i < size; i++) {
            rows.push(board.slice(i * size, (i + 1) * size));
        }

        if (dir === 'ArrowLeft') {
            newBoard = rows.map(slide);
        } else if (dir === 'ArrowRight') {
            newBoard = rows.map(row => slide(row.reverse()).reverse());
        } else if (dir === 'ArrowUp') {
            rows = rotateClockwise(rotateClockwise(rotateClockwise(rows)));
            newBoard = rotateClockwise(rows.map(slide));
        } else if (dir === 'ArrowDown') {
            rows = rotateClockwise(rows);
            newBoard = rotateClockwise(rotateClockwise(rotateClockwise(rows.map(slide))));
        }

        newBoard = newBoard.flat();

        if (board.toString() !== newBoard.toString()) {
            board = newBoard;
            addRandomTile();
            spawnBiggerNumbers();
            checkGameOver();
            updateBoard();
        }
    }

    function checkGameOver() {
        const emptyCells = board.filter(val => val === 0).length > 0;
        if (!emptyCells) {
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const currentVal = board[i * size + j];
                    if (
                        (i < size - 1 && currentVal === board[(i + 1) * size + j]) ||
                        (j < size - 1 && currentVal === board[i * size + (j + 1)])) {
                        return;
                    }
                }
            }
            gameOver = true;
        }
    }

    function startGame() {
        board = Array(size * size).fill(0);
        score = 0;
        gameOver = false;
        addRandomTile();
        addRandomTile();
        updateBoard();
    }

    function resetGame() {
        startGame();
    }

    // Reset button event listener
    resetButton.addEventListener('click', resetGame);

    // Keyboard control
    document.addEventListener('keydown', (e) => {
        if (gameOver) return;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            move(e.key);
        }
    });

    createGrid();
    startGame();
})();
