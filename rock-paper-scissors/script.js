// Game object to encapsulate state and logic
const game = {
  // Game state
  playerScore: 0,
  computerScore: 0,
  ties: 0,
  isPlaying: false,
  
  // Choice options
  choices: ['rock', 'paper', 'scissors'],
  
  // Choice emojis for display
  choiceEmojis: {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  },
  
  // DOM elements
  elements: {
    playerScoreEl: document.getElementById('player-score'),
    computerScoreEl: document.getElementById('computer-score'),
    tiesScoreEl: document.getElementById('ties-score'),
    playerChoiceDisplay: document.getElementById('player-choice-display'),
    computerChoiceDisplay: document.getElementById('computer-choice-display'),
    resultMessage: document.getElementById('result-message'),
    choiceButtons: document.querySelectorAll('.choice-btn'),
    resetBtn: document.getElementById('resetBtn')
  },
  
  // Initialize game
  init() {
    this.elements.choiceButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const choice = e.currentTarget.getAttribute('data-choice');
        this.handlePlayerChoice(choice);
      });
    });
    
    this.elements.resetBtn.addEventListener('click', () => this.resetGame());
  },
  
  // Handle player's choice
  handlePlayerChoice(playerChoice) {
    // Prevent multiple clicks during animation
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.disableButtons();
    
    // Get computer's choice
    const computerChoice = this.getComputerChoice();
    
    // Add shake animation
    this.elements.playerChoiceDisplay.classList.add('shake');
    this.elements.computerChoiceDisplay.classList.add('shake');
    
    // Show choices after animation
    setTimeout(() => {
      this.elements.playerChoiceDisplay.textContent = this.choiceEmojis[playerChoice];
      this.elements.computerChoiceDisplay.textContent = this.choiceEmojis[computerChoice];
      
      this.elements.playerChoiceDisplay.classList.remove('shake');
      this.elements.computerChoiceDisplay.classList.remove('shake');
      
      // Determine winner
      const result = this.determineWinner(playerChoice, computerChoice);
      this.updateScores(result);
      this.displayResult(result, playerChoice, computerChoice);
      
      // Re-enable buttons after showing result
      setTimeout(() => {
        this.isPlaying = false;
        this.enableButtons();
      }, 1000);
    }, 500);
  },
  
  // Get random computer choice
  getComputerChoice() {
    const randomIndex = Math.floor(Math.random() * this.choices.length);
    return this.choices[randomIndex];
  },
  
  // Determine winner based on choices
  determineWinner(player, computer) {
    // Tie condition
    if (player === computer) {
      return 'tie';
    }
    
    // Win conditions for player
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win';
    }
    
    // Otherwise, computer wins
    return 'lose';
  },
  
  // Update scores based on result
  updateScores(result) {
    if (result === 'win') {
      this.playerScore++;
      this.elements.playerScoreEl.textContent = this.playerScore;
    } else if (result === 'lose') {
      this.computerScore++;
      this.elements.computerScoreEl.textContent = this.computerScore;
    } else {
      this.ties++;
      this.elements.tiesScoreEl.textContent = this.ties;
    }
  },
  
  // Display result message
  displayResult(result, playerChoice, computerChoice) {
    const resultEl = this.elements.resultMessage;
    
    // Remove previous result classes
    resultEl.classList.remove('win', 'lose', 'tie');
    
    // Set message and class based on result
    if (result === 'win') {
      resultEl.textContent = `You Win! ${this.capitalize(playerChoice)} beats ${this.capitalize(computerChoice)}!`;
      resultEl.classList.add('win');
    } else if (result === 'lose') {
      resultEl.textContent = `You Lose! ${this.capitalize(computerChoice)} beats ${this.capitalize(playerChoice)}!`;
      resultEl.classList.add('lose');
    } else {
      resultEl.textContent = `It's a Tie! Both chose ${this.capitalize(playerChoice)}!`;
      resultEl.classList.add('tie');
    }
  },
  
  // Disable choice buttons
  disableButtons() {
    this.elements.choiceButtons.forEach(button => {
      button.disabled = true;
    });
  },
  
  // Enable choice buttons
  enableButtons() {
    this.elements.choiceButtons.forEach(button => {
      button.disabled = false;
    });
  },
  
  // Reset game scores
  resetGame() {
    // Reset scores
    this.playerScore = 0;
    this.computerScore = 0;
    this.ties = 0;
    
    // Update UI
    this.elements.playerScoreEl.textContent = '0';
    this.elements.computerScoreEl.textContent = '0';
    this.elements.tiesScoreEl.textContent = '0';
    
    // Reset displays
    this.elements.playerChoiceDisplay.textContent = '?';
    this.elements.computerChoiceDisplay.textContent = '?';
    
    // Reset message
    this.elements.resultMessage.textContent = 'Make your choice!';
    this.elements.resultMessage.classList.remove('win', 'lose', 'tie');
  },
  
  // Utility: Capitalize first letter
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

// Initialize game when page loads
game.init();
