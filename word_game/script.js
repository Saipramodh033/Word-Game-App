let selectedWordObj;
let maxAttempts = 5;
let attemptsLeftPlayer1 = maxAttempts;
let attemptsLeftPlayer2 = maxAttempts;
let scorePlayer1 = 0;
let scorePlayer2 = 0;
let currentPlayer = 1;
let timerDuration = 30; // Timer duration in seconds
let timer;
let timerDisplay;

// Initialize Game on Window Load
window.onload = () => {
    timerDisplay = document.getElementById('timer');
    initializeGame();
};

// Function to Initialize Game
async function initializeGame() {
    // Reset attempts and scores
    attemptsLeftPlayer1 = maxAttempts;
    attemptsLeftPlayer2 = maxAttempts;
    document.getElementById('player1-attempts-count').innerText = attemptsLeftPlayer1;
    document.getElementById('player2-attempts-count').innerText = attemptsLeftPlayer2;
    document.getElementById('player1-score').innerText = scorePlayer1;
    document.getElementById('player2-score').innerText = scorePlayer2;
    document.getElementById('hint-area').innerText = '';
    document.getElementById('message-area').innerText = '';

    // Fetch a word and hint (definition) from Free Dictionary API
    selectedWordObj = await fetchWord();
    const word = selectedWordObj.word.toUpperCase();
    const wordLength = word.length;

    // Randomly reveal two letters
    const revealedIndices = new Set();
    while (revealedIndices.size < Math.min(2, wordLength)) {
        revealedIndices.add(Math.floor(Math.random() * wordLength));
    }

    // Generate letter boxes
    const guessArea = document.getElementById('guess-area');
    guessArea.innerHTML = ''; // Clear previous content

    for (let i = 0; i < wordLength; i++) {
        const letterBox = document.createElement('div');
        letterBox.classList.add('letter-box');

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.dataset.index = i;

        if (revealedIndices.has(i)) {
            input.value = word[i];
            input.disabled = true;
            letterBox.classList.add('correct');
        } else {
            input.addEventListener('input', handleInput);
        }

        letterBox.appendChild(input);
        guessArea.appendChild(letterBox);
    }

    startTimer(); // Start the timer for the first player
}

// Function to Fetch a Random Word and Detailed Hint from Free Dictionary API
async function fetchWord() {
    try {
        // Fetch a random word
        const response = await fetch('https://random-word-api.herokuapp.com/word');
        const data = await response.json();
        const randomWord = data[0];

        // Fetch the definition of the random word from Free Dictionary API
        const definitionResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${randomWord}`);
        const definitionData = await definitionResponse.json();
        const definition = definitionData[0]?.meanings[0]?.definitions[0]?.definition || 'No definition available.';

        return {
            word: randomWord.toUpperCase(),
            hint: definition // Use the definition as the hint
        };
    } catch (error) {
        console.error('Error fetching word:', error);
        return { word: 'DEFAULT', hint: 'No hint available.' };
    }
}

// Handle Input in Letter Boxes
function handleInput(e) {
    const input = e.target;
    input.value = input.value.toUpperCase();

    const index = parseInt(input.dataset.index);
    const correctLetter = selectedWordObj.word[index].toUpperCase();

    if (input.value === correctLetter) {
        input.parentElement.classList.add('correct');
        input.disabled = true;
        updateScore();
        checkWinCondition();
    } else {
        input.parentElement.classList.add('wrong');
        setTimeout(() => {
            input.parentElement.classList.remove('wrong');
            input.value = '';
        }, 500);
        decreaseAttempts();
    }

    // Move focus to next available input
    moveToNextInput(index);
}

// Move Focus to Next Input Field
function moveToNextInput(currentIndex) {
    const inputs = document.querySelectorAll('.letter-box input');
    for (let i = currentIndex + 1; i < inputs.length; i++) {
        if (!inputs[i].disabled) {
            inputs[i].focus();
            return;
        }
    }
}

// Decrease Attempts and Check for Game Over
function decreaseAttempts() {
    if (currentPlayer === 1) {
        attemptsLeftPlayer1--;
        document.getElementById('player1-attempts-count').innerText = attemptsLeftPlayer1;
        if (attemptsLeftPlayer1 === 0) {
            endGame(false);
        }
    } else {
        attemptsLeftPlayer2--;
        document.getElementById('player2-attempts-count').innerText = attemptsLeftPlayer2;
        if (attemptsLeftPlayer2 === 0) {
            endGame(false);
        }
    }
    switchPlayer();
}

// Switch Player Turn
function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    startTimer(); // Restart the timer for the next player
}

// Update Score for Correct Guess
function updateScore() {
    if (currentPlayer === 1) {
        scorePlayer1++;
        document.getElementById('player1-score').innerText = scorePlayer1;
    } else {
        scorePlayer2++;
        document.getElementById('player2-score').innerText = scorePlayer2;
    }
}

// Check if Player has Won
function checkWinCondition() {
    const inputs = document.querySelectorAll('.letter-box input');
    const allCorrect = Array.from(inputs).every(input => input.disabled);
    if (allCorrect) {
        endGame(true);
    }
}

// End Game with Win or Lose Message
function endGame(win) {
    clearInterval(timer); // Stop the timer
    const messageArea = document.getElementById('message-area');
    if (win) {
        const winner = scorePlayer1 > scorePlayer2 ? 'Player 1' : 'Player 2';
        messageArea.innerText = `🎉 ${winner} wins!`;
        messageArea.style.color = '#2ecc71';
    } else {
        messageArea.innerText = `😞 Game Over! The correct word was "${selectedWordObj.word.toUpperCase()}".`;
        messageArea.style.color = '#e74c3c';
        disableAllInputs();
    }
}

// Disable All Input Fields
function disableAllInputs() {
    const inputs = document.querySelectorAll('.letter-box input');
    inputs.forEach(input => input.disabled = true);
}

// Show Hint
function showHint() {
    document.getElementById('hint-area').innerText = selectedWordObj.hint;
}

// Reset Game
function resetGame() {
    clearInterval(timer); // Stop any existing timer
    initializeGame();
}

// Start Timer
function startTimer() {
    clearInterval(timer); // Clear any existing timer
    let timeLeft = timerDuration;
    timerDisplay.innerText = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timer);
            decreaseAttempts(); // Automatically decrease attempts if time runs out
        }
    }, 1000);
}
