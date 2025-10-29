document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score');
    const gameOverDisplay = document.querySelector('.game-over');
    const newGameBtn = document.getElementById('new-game');
    const tryAgainBtn = document.getElementById('try-again');
    
    let board = [];
    let score = 0;
    let bestScore = localStorage.getItem('bestScore') || 0;
    let gameOver = false;
    const size = 4;
    
    // Initialize the game
    function initGame() {
        createBoard();
        addNewTile();
        addNewTile();
        updateBestScore();
        render();
    }
    
    // Create the game board
    function createBoard() {
        grid.innerHTML = '';
        board = Array(size).fill().map(() => Array(size).fill(0));
        
        // Create grid cells
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            grid.appendChild(cell);
        }
        
        // Add grid background
        grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        
        // Reset game state
        score = 0;
        gameOver = false;
        gameOverDisplay.style.display = 'none';
        updateScore();
    }
    
    // Add a new tile (2 or 4) to a random empty cell
    function addNewTile() {
        const emptyCells = [];
        
        // Find all empty cells
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }
        
        // If there are empty cells, add a new tile
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
            
            // Add animation class to the new tile
            const index = randomCell.x * size + randomCell.y;
            const cells = document.querySelectorAll('.cell');
            cells[index].classList.add('new-tile');
            
            // Remove animation class after animation ends
            setTimeout(() => {
                cells[index].classList.remove('new-tile');
            }, 200);
        }
    }
    
    // Update the score display
    function updateScore() {
        scoreDisplay.textContent = score;
        if (score > bestScore) {
            bestScore = score;
            updateBestScore();
            localStorage.setItem('bestScore', bestScore);
        }
    }
    
    // Update the best score display
    function updateBestScore() {
        bestScoreDisplay.textContent = bestScore;
    }
    
    // Check if there are any moves left
    function hasNoMoves() {
        // Check for any empty cells
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) return false;
                
                // Check adjacent cells for possible merges
                if (i < size - 1 && board[i][j] === board[i + 1][j]) return false;
                if (j < size - 1 && board[i][j] === board[i][j + 1]) return false;
            }
        }
        return true;
    }
    
    // Check if the game is over
    function checkGameOver() {
        if (hasNoMoves()) {
            gameOver = true;
            gameOverDisplay.style.display = 'flex';
        }
    }
    
    // Move tiles in the specified direction
    function moveTiles(direction) {
        if (gameOver) return false;
        
        let moved = false;
        const newBoard = board.map(row => [...row]);
        
        // Process movement based on direction
        switch (direction) {
            case 'up':
                moved = moveUp();
                break;
            case 'right':
                moved = moveRight();
                break;
            case 'down':
                moved = moveDown();
                break;
            case 'left':
                moved = moveLeft();
                break;
        }
        
        // If the board changed, add a new tile and check game over
        if (moved) {
            addNewTile();
            render();
            checkGameOver();
        }
        
        return moved;
    }
    
    // Movement helper functions
    function moveUp() {
        let moved = false;
        
        for (let j = 0; j < size; j++) {
            let col = [];
            // Extract column
            for (let i = 0; i < size; i++) {
                if (board[i][j] !== 0) col.push(board[i][j]);
            }
            
            // Merge tiles
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    score += col[i];
                    col.splice(i + 1, 1);
                    moved = true;
                }
            }
            
            // Fill with zeros
            while (col.length < size) col.push(0);
            
            // Update board
            for (let i = 0; i < size; i++) {
                if (board[i][j] !== col[i]) {
                    board[i][j] = col[i];
                    moved = true;
                }
            }
        }
        
        if (moved) updateScore();
        return moved;
    }
    
    function moveRight() {
        rotateBoard(2);
        const moved = moveLeft();
        rotateBoard(2);
        return moved;
    }
    
    function moveDown() {
        rotateBoard(3);
        const moved = moveLeft();
        rotateBoard(1);
        return moved;
    }
    
    function moveLeft() {
        let moved = false;
        
        for (let i = 0; i < size; i++) {
            let row = board[i].filter(x => x !== 0);
            
            // Merge tiles
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    score += row[j];
                    row.splice(j + 1, 1);
                    moved = true;
                }
            }
            
            // Fill with zeros
            while (row.length < size) row.push(0);
            
            // Update board
            for (let j = 0; j < size; j++) {
                if (board[i][j] !== row[j]) {
                    board[i][j] = row[j];
                    moved = true;
                }
            }
        }
        
        if (moved) updateScore();
        return moved;
    }
    
    // Rotate the board 90 degrees clockwise n times
    function rotateBoard(n) {
        for (let k = 0; k < n; k++) {
            const newBoard = Array(size).fill().map(() => Array(size).fill(0));
            
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    newBoard[j][size - 1 - i] = board[i][j];
                }
            }
            
            board = newBoard;
        }
    }
    
    // Render the game board
    function render() {
        const cells = document.querySelectorAll('.cell');
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const index = i * size + j;
                const cell = cells[index];
                const value = board[i][j];
                
                // Clear previous classes
                cell.className = 'cell';
                cell.textContent = '';
                
                // Add value and corresponding class
                if (value > 0) {
                    cell.textContent = value;
                    cell.classList.add(`tile-${value}`);
                    
                    // Add different background colors based on tile value
                    if (value <= 2048) {
                        cell.classList.add(`tile`);
                    } else {
                        cell.classList.add('tile-super');
                    }
                }
            }
        }
    }
    
    // Event Listeners
    document.addEventListener('keydown', (e) => {
        let moved = false;
        
        switch (e.key) {
            case 'ArrowUp':
                moved = moveTiles('up');
                break;
            case 'ArrowRight':
                moved = moveTiles('right');
                break;
            case 'ArrowDown':
                moved = moveTiles('down');
                break;
            case 'ArrowLeft':
                moved = moveTiles('left');
                break;
            default:
                return; // Ignore other keys
        }
        
        // Prevent default only for arrow keys
        if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    // Touch event handling for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Determine the direction of the swipe
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                moveTiles('left');
            } else {
                moveTiles('right');
            }
        } else {
            // Vertical swipe
            if (diffY > 0) {
                moveTiles('up');
            } else {
                moveTiles('down');
            }
        }
        
        // Reset touch coordinates
        touchStartX = 0;
        touchStartY = 0;
    }, { passive: true });
    
    // New game button
    newGameBtn.addEventListener('click', initGame);
    tryAgainBtn.addEventListener('click', initGame);
    
    // Initialize the game
    initGame();
});
