// Word list - American themed words
const words = [
  'liberty', 'freedom', 'justice', 'eagle', 'baseball', 'football',
  'hollywood', 'burger', 'cowboy', 'texas', 'california', 'america',
  'president', 'congress', 'democracy', 'independence', 'statue',
  'broadway', 'jazz', 'blues', 'country', 'basketball', 'hockey'
];

// Game state variables
let currentWord = '';
let displayedWord = [];
let usedLetters = new Set();
let wrongGuesses = 0;
const maxWrongGuesses = 6;
let gameActive = true;

// DOM elements
const wordDisplay = document.getElementById('word-display');
const alphabetContainer = document.getElementById('alphabet');
const messageElement = document.getElementById('message');
const guessesLeftElement = document.getElementById('guesses-left');
const usedListElement = document.getElementById('used-list');
const resetBtn = document.getElementById('resetBtn');
const hangmanParts = document.querySelectorAll('.hangman [data-part]');

// Initialize game on page load
const initGame = () => {
  createAlphabetButtons();
  resetBtn.addEventListener('click', resetGame);
  startNewGame();
};

// Create alphabet buttons (A-Z)
const createAlphabetButtons = () => {
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const button = document.createElement('button');
    button.textContent = letter;
    button.classList.add('letter-btn');
    button.setAttribute('data-letter', letter.toLowerCase());
    button.addEventListener('click', () => handleGuess(letter.toLowerCase()));
    alphabetContainer.appendChild(button);
  }
};

// Start a new game
const startNewGame = () => {
  // Reset game state
  currentWord = selectRandomWord();
  displayedWord = Array(currentWord.length).fill('_');
  usedLetters.clear();
  wrongGuesses = 0;
  gameActive = true;
  
  // Reset UI
  updateDisplay();
  updateMessage('Guess the word!');
  updateGuessesLeft();
  resetAlphabetButtons();
  hideHangmanParts();
  updateUsedLetters();
};

// Select random word from list
const selectRandomWord = () => {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
};

// Handle letter guess
const handleGuess = (letter) => {
  // Ignore if game is over or letter already used
  if (!gameActive || usedLetters.has(letter)) {
    return;
  }
  
  // Add to used letters
  usedLetters.add(letter);
  
  // Get button element
  const button = document.querySelector(`[data-letter="${letter}"]`);
  button.disabled = true;
  
  // Check if letter is in word
  if (currentWord.includes(letter)) {
    // Correct guess
    button.classList.add('correct');
    updateWordWithLetter(letter);
    updateDisplay();
    
    // Check for win
    if (checkWin()) {
      gameActive = false;
      updateMessage('🎉 You Win! The word was: ' + currentWord.toUpperCase());
    }
  } else {
    // Wrong guess
    button.classList.add('wrong');
    wrongGuesses++;
    updateGuessesLeft();
    drawHangman(wrongGuesses);
    
    // Check for loss
    if (checkLose()) {
      gameActive = false;
      updateMessage('💀 Game Over! The word was: ' + currentWord.toUpperCase());
      revealWord();
    }
  }
  
  updateUsedLetters();
};

// Update displayed word with correctly guessed letter
const updateWordWithLetter = (letter) => {
  for (let i = 0; i < currentWord.length; i++) {
    if (currentWord[i] === letter) {
      displayedWord[i] = letter;
    }
  }
};

// Update word display in DOM
const updateDisplay = () => {
  wordDisplay.innerHTML = '';
  displayedWord.forEach(letter => {
    const letterBox = document.createElement('div');
    letterBox.classList.add('letter-box');
    letterBox.textContent = letter === '_' ? '' : letter;
    wordDisplay.appendChild(letterBox);
  });
};

// Update message display
const updateMessage = (text) => {
  messageElement.textContent = text;
};

// Update remaining guesses display
const updateGuessesLeft = () => {
  guessesLeftElement.textContent = maxWrongGuesses - wrongGuesses;
};

// Update used letters display
const updateUsedLetters = () => {
  if (usedLetters.size === 0) {
    usedListElement.textContent = 'None';
  } else {
    usedListElement.textContent = Array.from(usedLetters)
      .map(l => l.toUpperCase())
      .join(', ');
  }
};

// Draw hangman part based on wrong guess count
const drawHangman = (stage) => {
  if (stage > 0 && stage <= maxWrongGuesses) {
    const part = document.querySelector(`[data-part="${stage}"]`);
    if (part) {
      part.classList.add('show');
    }
  }
};

// Hide all hangman parts
const hideHangmanParts = () => {
  hangmanParts.forEach(part => {
    part.classList.remove('show');
  });
};

// Check if player has won
const checkWin = () => {
  return !displayedWord.includes('_');
};

// Check if player has lost
const checkLose = () => {
  return wrongGuesses >= maxWrongGuesses;
};

// Reveal the complete word on loss
const revealWord = () => {
  displayedWord = currentWord.split('');
  updateDisplay();
};

// Reset alphabet buttons
const resetAlphabetButtons = () => {
  const buttons = document.querySelectorAll('.letter-btn');
  buttons.forEach(button => {
    button.disabled = false;
    button.classList.remove('correct', 'wrong');
  });
};

// Reset game
const resetGame = () => {
  startNewGame();
};

// Start the game when page loads
initGame();
