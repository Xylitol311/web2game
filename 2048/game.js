document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score');
    const newGameBtn = document.getElementById('new-game');
    const tryAgainBtn = document.getElementById('try-again');
    const gameOverDisplay = document.querySelector('.game-over');
    
    let board = [];
    let idBoard = [];
    let score = 0;
    let gameOver = false;
    let bestScore = localStorage.getItem('bestScore') || 0;
    let nextId = 1;
    bestScoreDisplay.textContent = bestScore;
    
    // Vehicle emoji mapping
    const vehicleMap = {
        2: '👟',
        4: '🛴',
        8: '🚲',
        16: '🏍️',
        32: '🚕',
        64: '🚗',
        128: '🏎️',
        256: '🚁',
        512: '✈️',
        1024: '🚀',
        2048: '🛸'
    };
    
    function getVehicle(value) {
        return vehicleMap[value] || '🌟';
    }
    
    // Initialize the game
    function initGame() {
        // Clear the board
        board = Array(4).fill().map(() => Array(4).fill(0));
        idBoard = Array(4).fill().map(() => Array(4).fill(null));
        score = 0;
        gameOver = false;
        scoreDisplay.textContent = score;
        gameOverDisplay.classList.remove('show');
        
        // Clear the grid
        grid.innerHTML = '';
        
        // Create the grid cells
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            grid.appendChild(cell);
        }
        
        // Add initial tiles
        addRandomTile();
        addRandomTile();
        
        // Initial render
        renderAllTilesFresh();
    }
    
    // Add a random tile (2 or 4) to an empty cell
    function addRandomTile() {
        const emptyCells = [];
        
        // Find all empty cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        // If there are empty cells, add a new tile
        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[row][col] = Math.random() < 0.9 ? 2 : 4; 
            const id = nextId++;
            idBoard[row][col] = id;
            // Create and animate the new tile
            createTile(row, col, board[row][col], id, true);
        }
    }
    
    // Create a tile element
    function createTile(row, col, value, id, isNew = false) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        tile.textContent = getVehicle(value);
        tile.id = `tile-${row}-${col}`;
        tile.dataset.id = String(id);
        
        // Disable transition for initial positioning
        tile.style.transition = 'none';
        
        // Add the tile to the grid first
        grid.appendChild(tile);
        
        // Position immediately after DOM insertion
        updateTilePosition(tile, row, col);
        
        // Force reflow to apply position without transition
        tile.offsetHeight;
        
        // Re-enable transition and add animation class
        if (isNew) {
            requestAnimationFrame(() => {
                tile.style.transition = '';
                tile.classList.add('new-tile');
            });
        } else {
            tile.style.transition = '';
        }
        
        return tile;
    }
    
    // Compute grid metrics based on actual layout
    function getGridMetrics() {
        const styles = getComputedStyle(grid);
        const gap = parseFloat(styles.gap || styles.gridGap || 15);
        const cols = 4;
        const gridWidth = grid.clientWidth;
        const cellSize = (gridWidth - gap * (cols - 1)) / cols;
        return { gap, cellSize };
    }

    // Update the position and size of a tile
    function updateTilePosition(tile, row, col) {
        const { gap, cellSize } = getGridMetrics();
        const x = col * (cellSize + gap);
        const y = row * (cellSize + gap);

        // Size the tile
        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;

        // Ensure absolute positioning doesn't stretch the tile
        tile.style.left = '0';
        tile.style.top = '0';
        tile.style.right = 'auto';
        tile.style.bottom = 'auto';

        tile.style.transform = `translate(${x}px, ${y}px)`;
    }
    
    // Fresh render (used only at init or full sync)
    function renderAllTilesFresh() {
        // Remove all tiles
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
        // Add all tiles from the board
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (board[row][col] !== 0) {
                    createTile(row, col, board[row][col], idBoard[row][col]);
                }
            }
        }
        updateScores();
    }

    function updateScores() {
        scoreDisplay.textContent = score;
        if (score > bestScore) {
            bestScore = score;
            bestScoreDisplay.textContent = bestScore;
            localStorage.setItem('bestScore', bestScore);
        }
    }
    
    // Move tiles in a direction
    function moveTiles(direction) {
        if (gameOver) return;

        const ops = []; // {id, from:{r,c}, to:{r,c}, remove:boolean, merged:boolean, newValue?:number}
        let moved = false;
        const newBoard = Array(4).fill().map(() => Array(4).fill(0));
        const newIdBoard = Array(4).fill().map(() => Array(4).fill(null));

        const applyRow = (row, toRight) => {
            const arr = [];
            for (let c = 0; c < 4; c++) if (board[row][c] !== 0) arr.push({ v: board[row][c], id: idBoard[row][c], from: c });
            if (toRight) arr.reverse();
            let write = 0;
            for (let i = 0; i < arr.length; i++) {
                if (i + 1 < arr.length && arr[i].v === arr[i + 1].v) {
                    const place = write++;
                    const targetCol = toRight ? (3 - place) : place;
                    const keep = arr[i];
                    const drop = arr[i + 1];
                    newBoard[row][targetCol] = keep.v * 2;
                    newIdBoard[row][targetCol] = keep.id;
                    ops.push({ id: keep.id, from: { r: row, c: keep.from }, to: { r: row, c: targetCol }, merged: true, remove: false, newValue: keep.v * 2 });
                    ops.push({ id: drop.id, from: { r: row, c: drop.from }, to: { r: row, c: targetCol }, merged: false, remove: true });
                    score += keep.v * 2;
                    i++;
                } else {
                    const place = write++;
                    const targetCol = toRight ? (3 - place) : place;
                    const item = arr[i];
                    newBoard[row][targetCol] = item.v;
                    newIdBoard[row][targetCol] = item.id;
                    ops.push({ id: item.id, from: { r: row, c: item.from }, to: { r: row, c: targetCol }, merged: false, remove: false });
                }
            }
            if (JSON.stringify(newBoard[row]) !== JSON.stringify(board[row])) moved = true;
        };

        const applyCol = (col, toDown) => {
            const arr = [];
            for (let r = 0; r < 4; r++) if (board[r][col] !== 0) arr.push({ v: board[r][col], id: idBoard[r][col], from: r });
            if (toDown) arr.reverse();
            let write = 0;
            for (let i = 0; i < arr.length; i++) {
                if (i + 1 < arr.length && arr[i].v === arr[i + 1].v) {
                    const place = write++;
                    const targetRow = toDown ? (3 - place) : place;
                    const keep = arr[i];
                    const drop = arr[i + 1];
                    newBoard[targetRow][col] = keep.v * 2;
                    newIdBoard[targetRow][col] = keep.id;
                    ops.push({ id: keep.id, from: { r: keep.from, c: col }, to: { r: targetRow, c: col }, merged: true, remove: false, newValue: keep.v * 2 });
                    ops.push({ id: drop.id, from: { r: drop.from, c: col }, to: { r: targetRow, c: col }, merged: false, remove: true });
                    score += keep.v * 2;
                    i++;
                } else {
                    const place = write++;
                    const targetRow = toDown ? (3 - place) : place;
                    const item = arr[i];
                    newBoard[targetRow][col] = item.v;
                    newIdBoard[targetRow][col] = item.id;
                    ops.push({ id: item.id, from: { r: item.from, c: col }, to: { r: targetRow, c: col }, merged: false, remove: false });
                }
            }
            const colPrev = [board[0][col], board[1][col], board[2][col], board[3][col]];
            const colNew = [newBoard[0][col], newBoard[1][col], newBoard[2][col], newBoard[3][col]];
            if (JSON.stringify(colPrev) !== JSON.stringify(colNew)) moved = true;
        };

        if (direction === 'left') {
            for (let r = 0; r < 4; r++) applyRow(r, false);
        } else if (direction === 'right') {
            for (let r = 0; r < 4; r++) applyRow(r, true);
        } else if (direction === 'up') {
            for (let c = 0; c < 4; c++) applyCol(c, false);
        } else if (direction === 'down') {
            for (let c = 0; c < 4; c++) applyCol(c, true);
        }

        if (moved) {
            // Ensure DOM elements exist for all current tiles
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (board[r][c] !== 0) {
                        const id = idBoard[r][c];
                        if (!grid.querySelector(`[data-id="${id}"]`)) {
                            createTile(r, c, board[r][c], id);
                        }
                    }
                }
            }

            // Animate moves
            ops.forEach(op => {
                const el = grid.querySelector(`[data-id="${op.id}"]`);
                if (!el) return;
                updateTilePosition(el, op.to.r, op.to.c);
            });

            const ANIM_MS = 160;
            setTimeout(() => {
                // Apply merges/removals
                ops.forEach(op => {
                    const el = grid.querySelector(`[data-id="${op.id}"]`);
                    if (!el) return;
                    if (op.remove) {
                        el.remove();
                    } else if (op.merged) {
                        // Disable transition temporarily to prevent flicker
                        el.style.transition = 'none';
                        el.textContent = getVehicle(op.newValue);
                        el.className = `tile tile-${op.newValue} merged-tile`;
                        // Re-apply position to ensure it stays in place
                        const pos = op.to;
                        updateTilePosition(el, pos.r, pos.c);
                        // Force reflow
                        el.offsetHeight;
                        // Re-enable transition
                        el.style.transition = '';
                        setTimeout(() => el.classList.remove('merged-tile'), 200);
                    }
                });

                board = newBoard;
                idBoard = newIdBoard;
                updateScores();
                addRandomTile();
                if (isGameOver()) {
                    gameOver = true;
                    gameOverDisplay.classList.add('show');
                }
            }, ANIM_MS);
        }
    }
    
    // Check if the game is over
    function isGameOver() {
        // Check for any empty cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // Check for possible merges
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const value = board[row][col];
                
                // Check right neighbor
                if (col < 3 && board[row][col + 1] === value) {
                    return false;
                }
                
                // Check bottom neighbor
                if (row < 3 && board[row + 1][col] === value) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Event listeners
    document.addEventListener('keydown', (e) => {
        if (gameOver) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                moveTiles('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveTiles('right');
                break;
            case 'ArrowUp':
                e.preventDefault();
                moveTiles('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveTiles('down');
                break;
        }
    });
    
    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);
    
    document.addEventListener('touchend', (e) => {
        if (gameOver) return;
        
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Determine the direction of the swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                moveTiles('right');
            } else {
                moveTiles('left');
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                moveTiles('down');
            } else {
                moveTiles('up');
            }
        }
    }, false);
    
    // New game button
    newGameBtn.addEventListener('click', initGame);
    tryAgainBtn.addEventListener('click', initGame);
    
    // Start the game
    initGame();

    // Reposition tiles on resize for responsive layout
    window.addEventListener('resize', () => {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            // Recompute position based on current transform target from idBoard
            const id = tile.dataset.id;
            let found = null;
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (idBoard[r][c] && String(idBoard[r][c]) === id) {
                        found = { r, c };
                        break;
                    }
                }
                if (found) break;
            }
            if (found) updateTilePosition(tile, found.r, found.c);
        });
    });
});
