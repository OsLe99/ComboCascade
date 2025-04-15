const board = document.getElementById('game-board');
const status = document.getElementById('status');
const gridSize = 6;
let combos = 0;
let movesLeft = 20;
let selectedTile = null;
let isAnimating = false; // Track animation state

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
      swapTiles(selectedIndex, index);
    }
    selectedTile.classList.remove('selected'); // Remove the selected class
    selectedTile = null;
  }

  movesLeft--;
  status.textContent = `Combos: ${combos}/8 | Moves Left: ${movesLeft}`;
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
    clearMatches(matches);
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
  playComboSound(combos); // Play the sound for the current combo
  status.textContent = `Combos: ${combos}/8 | Moves Left: ${movesLeft}`;
  if (combos >= 8) {
    showWinMessage(); // Show the win overlay
  }

  setTimeout(() => {
    dropTiles();
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
    checkMatches();
    isAnimating = false; // Unlock interactions after animations
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
  status.textContent = `Combos: ${combos}/8 | Moves Left: ${movesLeft}`;

  // Clear and reinitialize the board
  board.innerHTML = '';
  tiles.length = 0; // Clear the tiles array
  initBoard();
}

initBoard();