// Game state variables
let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameActive = true;

// Winning combinations
const winningCombinations = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6]  // Diagonal top-right to bottom-left
];

// DOM elements
const cells = document.querySelectorAll('.cell');
const messageElement = document.getElementById('message');
const resetBtn = document.getElementById('resetBtn');

// Initialize game
const initGame = () => {
  cells.forEach(cell => {
    cell.addEventListener('click', handleClick);
  });
  resetBtn.addEventListener('click', resetGame);
};

// Handle cell click
const handleClick = (event) => {
  const cell = event.target;
  const index = parseInt(cell.getAttribute('data-index'));
  
  // Prevent action if cell is taken or game is over
  if (board[index] !== null || !gameActive) {
    return;
  }
  
  // Update board state
  board[index] = currentPlayer;
  
  // Update UI
  cell.textContent = currentPlayer;
  cell.classList.add('taken', currentPlayer.toLowerCase());
  
  // Check for win or draw
  if (checkWin()) {
    gameActive = false;
    messageElement.textContent = `Player ${currentPlayer} Wins!`;
    highlightWinningCells();
    return;
  }
  
  if (checkDraw()) {
    gameActive = false;
    messageElement.textContent = "It's a Draw!";
    return;
  }
  
  // Switch player
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateMessage();
};

// Check for win condition
const checkWin = () => {
  return winningCombinations.some(combination => {
    const [a, b, c] = combination;
    return board[a] !== null && 
           board[a] === board[b] && 
           board[a] === board[c];
  });
};

// Check for draw condition
const checkDraw = () => {
  return board.every(cell => cell !== null);
};

// Update message display
const updateMessage = () => {
  messageElement.textContent = `Player ${currentPlayer}'s Turn`;
};

// Highlight winning cells
const highlightWinningCells = () => {
  winningCombinations.forEach(combination => {
    const [a, b, c] = combination;
    if (board[a] !== null && 
        board[a] === board[b] && 
        board[a] === board[c]) {
      cells[a].classList.add('winner');
      cells[b].classList.add('winner');
      cells[c].classList.add('winner');
    }
  });
};

// Reset game
const resetGame = () => {
  // Reset game state
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameActive = true;
  
  // Reset UI
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('taken', 'x', 'o', 'winner');
  });
  
  updateMessage();
};

// Start the game when page loads
initGame();
