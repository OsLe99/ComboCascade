const board = document.getElementById('game-board');
const status = document.getElementById('status');
const gridSize = 10; // Grid size (10x10)
let combos = 0; // Current combo count
let movesLeft = 20;
let selectedTile = null;
let isAnimating = false; // Animation state
let score = 0; // Player's score
let chainingCombos = false; // Chain reaction tracking
let penaltyEligible = false; // Penalty eligibility
let highestCombo = 0; // Highest combo in a sequence

// Game settings
let soundVolume = 0.5; // Default sound volume
let targetScore = 10000; // Default target score

// Event listeners for settings modal
document.getElementById('settings-button').addEventListener('click', () => {
  document.getElementById('settings-modal').style.display = 'flex';
});

document.getElementById('close-settings').addEventListener('click', () => {
  document.getElementById('settings-modal').style.display = 'none';
});

document.getElementById('save-settings').addEventListener('click', () => {
  soundVolume = parseFloat(document.getElementById('volume-slider').value);
  targetScore = parseInt(document.getElementById('target-score').value, 10);
  status.textContent = `Score: ${score} | Moves Left: ${movesLeft} | Goal: ${targetScore} Points`;
  document.getElementById('settings-modal').style.display = 'none';
});

// Initialize the game board
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
    tile.classList.add('selected');
  } else {
    // Attempt to swap with the second tile
    const selectedIndex = tiles.indexOf(selectedTile);
    if (areAdjacent(selectedIndex, index)) {
      chainingCombos = false;
      combos = 0;
      penaltyEligible = true;
      swapTiles(selectedIndex, index);
    }
    selectedTile.classList.remove('selected');
    selectedTile = null;
  }
}

function areAdjacent(index1, index2) {
  const row1 = Math.floor(index1 / gridSize);
  const col1 = index1 % gridSize;
  const row2 = Math.floor(index2 / gridSize);
  const col2 = index2 % gridSize;

  return (
    (row1 === row2 && Math.abs(col1 - col2) === 1) || // Adjacent in the same row
    (col1 === col2 && Math.abs(row1 - row2) === 1)    // Adjacent in the same column
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

  movesLeft--; // Deduct a move
  status.textContent = `Score: ${score} | Moves Left: ${movesLeft}`;

  if (movesLeft <= 0) {
    showGameOverMessage();
  }

  setTimeout(() => checkMatches(), 300); // Delay for swap animation
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

  console.log('Matches size:', matches.size);

  if (matches.size > 0) {
    penaltyEligible = false; // Reset penalty eligibility
    clearMatches(matches);
  } else if (penaltyEligible) {
    applyPenalty();
  }

  if (matches.size === 0) {
    chainingCombos = false;
  }
}

function clearMatches(matches) {
  isAnimating = true;

  matches.forEach(index => {
    const tile = tiles[index];
    tile.classList.add('clearing');
    setTimeout(() => {
      tile.dataset.color = '';
      tile.style.backgroundColor = 'white';
      tile.classList.remove('clearing');
    }, 500);
  });

  combos++;
  highestCombo = Math.max(highestCombo, combos);
  console.log('Updated highestCombo:', highestCombo);
  console.log('Combos:', combos, 'Highest Combo:', highestCombo);
  const points = matches.size * 10 * combos;
  score += points;
  movesLeft += 2;

  showComboMultiplier(combos, points);

  if (combos >= 1) {
    playComboSound(combos - 1);
  }

  status.textContent = `Score: ${score} | Moves Left: ${movesLeft} | Goal: ${targetScore} Points`;

  if (score >= targetScore) {
    showWinMessage();
  }

  setTimeout(() => {
    if (matches.size > 0) {
      console.log('Dropping tiles...');
      dropTiles();
    } else {
      console.log('No more matches. Highest Combo:', highestCombo);
      console.log('Calling showEncouragementMessage with highestCombo:', highestCombo);
      console.log('chainingCombos value before calling showEncouragementMessage:', chainingCombos);
      showEncouragementMessage(highestCombo); // Called here
      highestCombo = 0;
      isAnimating = false;
    }
  }, 500);
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
        tiles[targetIndex].classList.add('dropping');
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
      tiles[index].classList.add('dropping');
      setTimeout(() => tiles[index].classList.remove('dropping'), 500);
    }
  }

  setTimeout(() => {
    chainingCombos = true;
    console.log('chainingCombos set to true. Checking matches...');
    checkMatches();
    isAnimating = false;
    console.log('isAnimating set to false.');

    if (!chainingCombos) {
      console.log('No chaining combos. Highest Combo:', highestCombo);
      console.log('Calling showEncouragementMessage with highestCombo:', highestCombo);
      showEncouragementMessage(highestCombo);
      highestCombo = 0; // Reset here
    }
  }, 500);
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
    audio.volume = soundVolume;
    audio.play();
  }
}

function showComboMultiplier(multiplier, points) {
  const comboDisplay = document.getElementById('combo-display');
  comboDisplay.textContent = `x${multiplier} (+${points} points)`;
  comboDisplay.style.display = 'block';

  setTimeout(() => {
    comboDisplay.style.display = 'none';
  }, 1000);
}

function showEncouragementMessage(multiplier) {
  // Remove any existing message
  const existingMessage = document.getElementById('encouragement-display');
  if (existingMessage) {
    existingMessage.remove();
  }

  const encouragementDisplay = document.createElement('div');
  encouragementDisplay.id = 'encouragement-display';

  const messages = {
    8: ['GODLIKE!', 'UNSTOPPABLE!', 'LEGENDARY!'],
    6: ['AMAZING!', 'INCREDIBLE!', 'SPECTACULAR!'],
    4: ['GOOD!', 'NICE!', 'WELL DONE!'],
    2: ['Meh!', 'OKAY!', 'NOT BAD!'],
    1: ['My grandmother could do better...', 'Is that all you got?', 'Try harder next time!']
  };

  let message = '';
  if (multiplier >= 8) {
    message = messages[8][Math.floor(Math.random() * messages[8].length)];
  } else if (multiplier >= 6) {
    message = messages[6][Math.floor(Math.random() * messages[6].length)];
  } else if (multiplier >= 4) {
    message = messages[4][Math.floor(Math.random() * messages[4].length)];
  } else if (multiplier >= 2) {
    message = messages[2][Math.floor(Math.random() * messages[2].length)];
  } else if (multiplier >= 1) {
    message = messages[1][Math.floor(Math.random() * messages[1].length)];
  } else {
    message = 'Keep going! You can do it!';
  }

  encouragementDisplay.textContent = message;
  encouragementDisplay.style.position = 'absolute';
  encouragementDisplay.style.top = '50%';
  encouragementDisplay.style.left = '50%';
  encouragementDisplay.style.transform = 'translate(-50%, -50%)';
  encouragementDisplay.style.fontSize = '2rem';
  encouragementDisplay.style.fontWeight = 'bold';
  encouragementDisplay.style.color = '#ff5722';
  encouragementDisplay.style.background = 'rgba(255, 255, 255, 0.9)';
  encouragementDisplay.style.padding = '10px 20px';
  encouragementDisplay.style.borderRadius = '10px';
  encouragementDisplay.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
  encouragementDisplay.style.zIndex = '9999';

  document.body.appendChild(encouragementDisplay);

  setTimeout(() => {
    encouragementDisplay.remove();
  }, 2000);
}

function showWinMessage() {
  const winOverlay = document.getElementById('win-overlay');
  winOverlay.style.display = 'flex';

  const restartButton = document.getElementById('restart-button');
  restartButton.addEventListener('click', restartGame);
}

function showGameOverMessage() {
  const winOverlay = document.getElementById('win-overlay');
  const winMessage = document.getElementById('win-message');

  winMessage.innerHTML = `
    <h2>Game Over!</h2>
    <button id="restart-button">Try Again</button>
  `;

  winOverlay.style.display = 'flex';

  const restartButton = document.getElementById('restart-button');
  restartButton.addEventListener('click', restartGame);
}

function restartGame() {
  const winOverlay = document.getElementById('win-overlay');
  winOverlay.style.display = 'none';

  combos = 0;
  movesLeft = 20;
  score = 0;
  status.textContent = `Score: ${score} | Moves Left: ${movesLeft} | Goal: ${targetScore} Points`;

  board.innerHTML = '';
  tiles.length = 0;
  initBoard();
}

function applyPenalty() {
  movesLeft--;
  score = Math.max(0, score - 50);
  status.textContent = `Score: ${score} | Moves Left: ${movesLeft}`;

  if (movesLeft <= 0) {
    showGameOverMessage();
  }
}

initBoard();