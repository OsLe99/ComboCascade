const board = document.getElementById('game-board');
const status = document.getElementById('status');
const gridSize = 10; // Size of the grid (10x10)
let combos = 0;
let movesLeft = 20;
let selectedTile = null;
let isAnimating = false; // Track animation state
let score = 0; // Initialize the score
let chainingCombos = false; // Track if combos are part of a chain reaction
let penaltyEligible = false; // Track if penalty is eligible for the current move
let highestCombo = 0; // Track the highest combo multiplier in a sequence

// Initialize the board
const tiles = [];
const colors = ['red', 'blue', 'green', 'yellow', 'purple'];

function initBoard() {
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.color = colors[Math.floor(Math.random() * colors.length)];
    tile.style.backgroundColor = tile.dataset.color;
    tile.addEventListener('click', () => handleTileClick(i));
    board.appendChild(tile);
    tiles.push(tile);
  }
}

function handleTileClick(index) {
  if (isAnimating) return; // Ignore clicks during animations

  const tile = tiles[index];

  if (!selectedTile) {
    // Select the first tile
    selectedTile = tile;
    tile.classList.add('selected'); // Add the selected class
  } else {
    // Attempt to swap with the second tile
    const selectedIndex = tiles.indexOf(selectedTile);
    if (areAdjacent(selectedIndex, index)) {
      chainingCombos = false; // Reset chaining flag for a new move
      combos = 0; // Reset the combo counter for a new move
      penaltyEligible = true; // Enable penalty for this move
      swapTiles(selectedIndex, index);
    }
    selectedTile.classList.remove('selected'); // Remove the selected class
    selectedTile = null;
  }

  movesLeft--;
  status.textContent = `Score: ${score} | Moves Left: ${movesLeft}`;
  if (movesLeft <= 0) {
    showGameOverMessage(); // Show the "Game Over" overlay
  }
}

function areAdjacent(index1, index2) {
  const row1 = Math.floor(index1 / gridSize);
  const col1 = index1 % gridSize;
  const row2 = Math.floor(index2 / gridSize);
  const col2 = index2 % gridSize;

  return (
    (row1 === row2 && Math.abs(col1 - col2) === 1) || // Same row, adjacent columns
    (col1 === col2 && Math.abs(row1 - row2) === 1)    // Same column, adjacent rows
  );
}

function swapTiles(index1, index2) {
  const tile1 = tiles[index1];
  const tile2 = tiles[index2];

  // Swap colors
  const tempColor = tile1.dataset.color;
  tile1.dataset.color = tile2.dataset.color;
  tile1.style.backgroundColor = tile2.dataset.color;
  tile2.dataset.color = tempColor;
  tile2.style.backgroundColor = tempColor;

  // Add a slight delay to allow the swap animation to complete
  setTimeout(() => checkMatches(), 300);
}

function checkMatches() {
  const matches = new Set();

  // Check rows for matches
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize - 2; col++) {
      const index = row * gridSize + col;
      if (
        tiles[index].dataset.color === tiles[index + 1].dataset.color &&
        tiles[index].dataset.color === tiles[index + 2].dataset.color
      ) {
        matches.add(index);
        matches.add(index + 1);
        matches.add(index + 2);
      }
    }
  }

  // Check columns for matches
  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row < gridSize - 2; row++) {
      const index = row * gridSize + col;
      if (
        tiles[index].dataset.color === tiles[index + gridSize].dataset.color &&
        tiles[index].dataset.color === tiles[index + 2 * gridSize].dataset.color
      ) {
        matches.add(index);
        matches.add(index + gridSize);
        matches.add(index + 2 * gridSize);
      }
    }
  }

  if (matches.size > 0) {
    penaltyEligible = false; // Reset penalty eligibility since matches were found
    clearMatches(matches);
  } else if (penaltyEligible) {
    applyPenalty(); // Apply penalty only if eligible
  }
}

function clearMatches(matches) {
  isAnimating = true; // Lock interactions during animations

  matches.forEach(index => {
    const tile = tiles[index];
    tile.classList.add('clearing'); // Add clearing animation
    setTimeout(() => {
      tile.dataset.color = '';
      tile.style.backgroundColor = 'white';
      tile.classList.remove('clearing'); // Remove the class after animation
    }, 500); // Match the duration of the fadeOut animation
  });

  combos++;
  highestCombo = Math.max(highestCombo, combos); // Update the highest combo multiplier
  const points = matches.size * 10 * combos; // Multiply score by the combo count
  score += points; // Add the calculated points to the score
  movesLeft += 2; // Add 2 extra moves for every combo

  // Show the combo multiplier and points
  showComboMultiplier(combos, points);

  // Only play the combo sound if it's part of a chain reaction
  if (chainingCombos) {
    playComboSound(combos);
  }

  status.textContent = `Score: ${score} | Moves Left: ${movesLeft}`;

  // Update the win condition to require 10,000 points
  if (score >= 10000) {
    showWinMessage(); // Show the win overlay
  }

  setTimeout(() => {
    if (matches.size > 0) {
      dropTiles();
    } else {
      // If no chain reactions occur, show the encouragement message
      showEncouragementMessage(highestCombo);
      highestCombo = 0; // Reset the highest combo for the next sequence
      isAnimating = false; // Unlock interactions
    }
  }, 500); // Wait for clearing animation to finish
}

function dropTiles() {
  for (let col = 0; col < gridSize; col++) {
    let emptySpots = 0;

    for (let row = gridSize - 1; row >= 0; row--) {
      const index = row * gridSize + col;
      if (tiles[index].dataset.color === '') {
        emptySpots++;
      } else if (emptySpots > 0) {
        const targetIndex = (row + emptySpots) * gridSize + col;
        tiles[targetIndex].dataset.color = tiles[index].dataset.color;
        tiles[targetIndex].style.backgroundColor = tiles[index].dataset.color;
        tiles[targetIndex].classList.add('dropping'); // Add dropping animation
        setTimeout(() => tiles[targetIndex].classList.remove('dropping'), 500);
        tiles[index].dataset.color = '';
        tiles[index].style.backgroundColor = 'white';
      }
    }

    // Fill empty spots at the top
    for (let row = 0; row < emptySpots; row++) {
      const index = row * gridSize + col;
      tiles[index].dataset.color = colors[Math.floor(Math.random() * colors.length)];
      tiles[index].style.backgroundColor = tiles[index].dataset.color;
      tiles[index].classList.add('dropping'); // Add dropping animation
      setTimeout(() => tiles[index].classList.remove('dropping'), 500);
    }
  }

  // Check for new matches after tiles drop
  setTimeout(() => {
    chainingCombos = true; // Set chaining flag for chain reactions BEFORE checking matches
    checkMatches();

    // If no more matches are found, show the encouragement message
    if (!isAnimating) {
      showEncouragementMessage(highestCombo);
      highestCombo = 0; // Reset the highest combo for the next sequence
      isAnimating = false; // Unlock interactions
    }
  }, 500); // Wait for dropping animation to finish
}

function playComboSound(combo) {
  const soundMap = {
    1: 'sounds/combo1.wav',
    2: 'sounds/combo2.wav',
    3: 'sounds/combo3.wav',
    4: 'sounds/combo4.wav',
    5: 'sounds/combo5.wav',
    6: 'sounds/combo6.wav',
    7: 'sounds/combo7.wav',
    8: 'sounds/combo8.wav'
  };

  const soundFile = soundMap[combo];
  if (soundFile) {
    const audio = new Audio(soundFile);
    audio.volume = 0.5; // Set volume to 50%
    audio.play();
  }
}

function showComboMultiplier(multiplier, points) {
  const comboDisplay = document.getElementById('combo-display');
  comboDisplay.textContent = `x${multiplier} (+${points} points)`; // Update the multiplier and points text
  comboDisplay.style.display = 'block'; // Show the combo display

  // Hide the combo display after the animation
  setTimeout(() => {
    comboDisplay.style.display = 'none';
  }, 1000); // Match the duration of the fadeOut animation
}

function showEncouragementMessage(multiplier) {
  const encouragementDisplay = document.createElement('div');
  encouragementDisplay.id = 'encouragement-display';

  // Define message variations for each combo level
  const messages = {
    8: ['GODLIKE!', 'UNSTOPPABLE!', 'LEGENDARY!'],
    6: ['AMAZING!', 'INCREDIBLE!', 'SPECTACULAR!'],
    4: ['GOOD!', 'NICE!', 'WELL DONE!'],
    2: ['Meh!', 'OKAY!', 'NOT BAD!'],
    1: ['My grandmother could do better...', 'Is that all you got?', 'Try harder next time!']
  };

  // Determine the message based on the combo multiplier
  let message = '';
  if (multiplier >= 8) {
    message = messages[8][Math.floor(Math.random() * messages[8].length)];
  } else if (multiplier >= 6) {
    message = messages[6][Math.floor(Math.random() * messages[6].length)];
  } else if (multiplier >= 4) {
    message = messages[4][Math.floor(Math.random() * messages[4].length)];
  } else if (multiplier >= 2) {
    message = messages[2][Math.floor(Math.random() * messages[2].length)];
  } else if (multiplier === 1) {
    message = messages[1][Math.floor(Math.random() * messages[1].length)];
  } else {
    return; // No message for zero combos
  }

  encouragementDisplay.textContent = message;
  encouragementDisplay.style.position = 'absolute';
  encouragementDisplay.style.top = '50%';
  encouragementDisplay.style.left = '50%';
  encouragementDisplay.style.transform = 'translate(-50%, -50%)';
  encouragementDisplay.style.fontSize = '2rem';
  encouragementDisplay.style.fontWeight = 'bold';
  encouragementDisplay.style.color = '#ff5722';
  encouragementDisplay.style.background = 'rgba(255, 255, 255, 0.8)';
  encouragementDisplay.style.padding = '10px 20px';
  encouragementDisplay.style.borderRadius = '10px';
  encouragementDisplay.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
  encouragementDisplay.style.zIndex = '1000';
  encouragementDisplay.style.animation = 'fadeOut 2s ease-in-out forwards';

  document.body.appendChild(encouragementDisplay);

  // Remove the message after the animation
  setTimeout(() => {
    encouragementDisplay.remove();
  }, 2000);
}

function showWinMessage() {
  const winOverlay = document.getElementById('win-overlay');
  winOverlay.style.display = 'flex'; // Show the overlay

  const restartButton = document.getElementById('restart-button');
  restartButton.addEventListener('click', restartGame);
}

function showGameOverMessage() {
  const winOverlay = document.getElementById('win-overlay');
  const winMessage = document.getElementById('win-message');

  // Update the overlay content for "Game Over"
  winMessage.innerHTML = `
    <h2>Game Over!</h2>
    <button id="restart-button">Try Again</button>
  `;

  winOverlay.style.display = 'flex'; // Show the overlay

  // Add event listener to the restart button
  const restartButton = document.getElementById('restart-button');
  restartButton.addEventListener('click', restartGame);
}

function restartGame() {
  const winOverlay = document.getElementById('win-overlay');
  winOverlay.style.display = 'none'; // Hide the overlay

  // Reset game variables
  combos = 0;
  movesLeft = 20;
  score = 0; // Reset the score
  status.textContent = `Score: ${score} | Moves Left: ${movesLeft} | Goal: 10,000 Points`;

  // Clear and reinitialize the board
  board.innerHTML = '';
  tiles.length = 0; // Clear the tiles array
  initBoard();
}

function applyPenalty() {
  movesLeft--; // Deduct 1 move as a penalty
  score = Math.max(0, score - 50); // Deduct 50 points, but ensure the score doesn't go below 0
  status.textContent = `Score: ${score} | Moves Left: ${movesLeft}`;

  if (movesLeft <= 0) {
    showGameOverMessage(); // Show the "Game Over" overlay
  }
}

initBoard();