import { registerSW } from "virtual:pwa-register";

if ("serviceWorker" in navigator) {
  registerSW();
}

const fileInput = document.getElementById("file-input") as HTMLInputElement;
const startButton = document.getElementById("start-game") as HTMLButtonElement;
const randomRevealButton = document.getElementById("random-reveal") as HTMLButtonElement;
const revealAllButton = document.getElementById("reveal-all") as HTMLButtonElement;
const gridContainer = document.getElementById("grid-container") as HTMLDivElement;
const guessMessage = document.getElementById("guess-message") as HTMLParagraphElement;
const setupButtons = document.getElementById("setup-buttons") as HTMLDivElement;
const gameButtons = document.getElementById("game-buttons") as HTMLDivElement;

let imageUrl: string | null = null;
let gridSize = { rows: 6, cols: 6 };
let overlaySquares: HTMLDivElement[][] = [];
let revealCount = 0;

// Function to save game state to localStorage
const saveGameState = () => {
  const revealedState = overlaySquares.map(row => row.map(square => square.style.visibility === "hidden"));
  const gameState = {
    imageUrl,
    revealedState,
    gridSize
  };
  localStorage.setItem("pictureGuessGameState", JSON.stringify(gameState));
};

// Function to load game state from localStorage
const loadGameState = () => {
  const savedState = localStorage.getItem("pictureGuessGameState");
  if (savedState) {
    const { imageUrl: savedImageUrl, revealedState, gridSize: savedGridSize } = JSON.parse(savedState);
    imageUrl = savedImageUrl;
    revealCount = revealedState.flat().reduce((sum: number, value: number) => sum + (value ? 1 : 0), 0);
    gridSize = savedGridSize || gridSize;
    initializeGame(revealedState);
    setupButtons.style.visibility = "hidden";
    gameButtons.style.visibility = "visible";
    guessMessage.textContent = `Revealed cells: ${revealCount}`;
  }
};

// Function to initialize the game
const initializeGame = (revealedState?: boolean[][]) => {
  if (!imageUrl) return false;

  gridContainer.innerHTML = "";
  overlaySquares = [];
  // Only reset reveal count when not loading saved game
  if (!revealedState) {
    revealCount = 0;
  }

  gridContainer.style.backgroundImage = `url(${imageUrl})`;
  loadImageAndSetGrid(revealedState);

  guessMessage.textContent = "Guess the picture!";

  return true;
};

// Function to dynamically set grid size based on image dimensions
const loadImageAndSetGrid = (revealedState?: boolean[][]) => {
  const img = new Image();
  img.src = imageUrl as string;
  img.onload = () => {
    const aspectRatio = img.width / img.height;
    const containerWidth = 1000;
    const containerHeight = containerWidth / aspectRatio;
    gridContainer.style.width = `${containerWidth}px`;
    gridContainer.style.height = `${containerHeight}px`;

    const totalSquares = 36;
    gridSize.rows = Math.round(Math.sqrt(totalSquares / aspectRatio));
    gridSize.cols = Math.round(gridSize.rows * aspectRatio);

    gridContainer.style.gridTemplateColumns = `repeat(${gridSize.cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${gridSize.rows}, 1fr)`;

    createOverlaySquares(containerWidth, containerHeight, revealedState);
  };
};

// Function to create overlay squares
const createOverlaySquares = (containerWidth: number, containerHeight: number, revealedState?: boolean[][]) => {
  const squareWidth = containerWidth / gridSize.cols;
  const squareHeight = containerHeight / gridSize.rows;

  let i = 1;

  for (let row = 0; row < gridSize.rows; row++) {
    const rowOverlays: HTMLDivElement[] = [];
    for (let col = 0; col < gridSize.cols; col++) {
      const overlay = document.createElement("div");
      overlay.classList.add("overlay-square");
      overlay.dataset.row = row.toString();
      overlay.dataset.col = col.toString();

      overlay.style.width = `${squareWidth}px`;
      overlay.style.height = `${squareHeight}px`;

      overlay.textContent = i.toString();

      // Apply saved visibility state if available
      if (revealedState && revealedState[row] && revealedState[row][col]) {
        overlay.style.visibility = "hidden";
      }

      overlay.addEventListener("click", () => revealSquare(row, col));
      gridContainer.appendChild(overlay);
      rowOverlays.push(overlay);
      i++;
    }
    overlaySquares.push(rowOverlays);
  }
};

// Function to reveal a specific square
const revealSquare = (row: number, col: number) => {
  const overlay = overlaySquares[row][col];
  if (!overlay || overlay.style.visibility === "hidden") return;

  overlay.style.visibility = "hidden";
  revealCount++;

  guessMessage.textContent = `Revealed cells: ${revealCount}`;
  saveGameState(); // Save state after revealing a square
};

// Function to reveal a random unrevealed square
const revealRandomSquare = () => {
  const unrevealedSquares: [number, number][] = [];

  for (let row = 0; row < gridSize.rows; row++) {
    for (let col = 0; col < gridSize.cols; col++) {
      if (overlaySquares[row][col].style.visibility !== "hidden") {
        unrevealedSquares.push([row, col]);
      }
    }
  }

  if (unrevealedSquares.length > 0) {
    const randomIndex = Math.floor(Math.random() * unrevealedSquares.length);
    const [randomRow, randomCol] = unrevealedSquares[randomIndex];
    revealSquare(randomRow, randomCol);

    if (unrevealedSquares.length == 1) {
      finishGame();
    }
  } else {
    finishGame();
  }
};

// Function to reveal all squares and finish the game
const revealAllSquares = () => {
  for (let row = 0; row < gridSize.rows; row++) {
    for (let col = 0; col < gridSize.cols; col++) {
      revealSquare(row, col);
    }
  }

  finishGame();
};

// Function that sets the game as finished and clear the local storage
const finishGame = () => {
  guessMessage.textContent = "All cells have been revealed!";
  localStorage.clear();
  setupButtons.style.visibility = "visible";
  gameButtons.style.visibility = "hidden";
};

// Handle file input
fileInput.addEventListener("change", (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageUrl = e.target?.result as string;
      guessMessage.textContent = "Image uploaded! Press 'Start Game' to play.";
      saveGameState();
    };
    reader.readAsDataURL(file);
  }
});

// Start game on button click
startButton.addEventListener("click", () => {
  if (initializeGame()) {
    saveGameState();
    setupButtons.style.visibility = "hidden";
    gameButtons.style.visibility = "visible";
  } else {
    alert("Upload a picture first.");
  }
});

// Random reveal button click
randomRevealButton.addEventListener("click", revealRandomSquare);

// Reveal all squares button click
revealAllButton.addEventListener("click", revealAllSquares);

// Load the game state on page load
window.addEventListener("load", loadGameState);
