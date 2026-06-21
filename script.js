const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const bestScoreElement = document.querySelector('#best-score');
const messageElement = document.querySelector('#message');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const restartButton = document.querySelector('#restart-button');
const touchButtons = document.querySelectorAll('[data-direction]');

const cellSize = 24;
const cells = canvas.width / cellSize;
const tickMs = 115;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem('snake-best-score') || 0);
let timerId;
let running = false;
let paused = false;

bestScoreElement.textContent = bestScore;
resetGame();
draw();

function resetGame() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  direction = directions.right;
  nextDirection = directions.right;
  score = 0;
  food = createFood();
  running = false;
  paused = false;
  updateScore();
  setMessage('Нажмите «Старт» или пробел, чтобы начать');
}

function startGame() {
  if (running && !paused) {
    return;
  }

  running = true;
  paused = false;
  setMessage('');
  clearInterval(timerId);
  timerId = setInterval(tick, tickMs);
}

function togglePause() {
  if (!running) {
    startGame();
    return;
  }

  paused = !paused;
  setMessage(paused ? 'Пауза' : '');
}

function restartGame() {
  clearInterval(timerId);
  resetGame();
  draw();
  startGame();
}

function tick() {
  if (paused) {
    return;
  }

  direction = nextDirection;
  const head = snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

  if (isWallHit(nextHead) || isSnakeHit(nextHead)) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    score += 1;
    updateScore();
    food = createFood();
  } else {
    snake.pop();
  }

  draw();
}

function createFood() {
  let candidate;

  do {
    candidate = {
      x: Math.floor(Math.random() * cells),
      y: Math.floor(Math.random() * cells),
    };
  } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));

  return candidate;
}

function setDirection(newDirection) {
  const wanted = directions[newDirection];
  const isOpposite = wanted.x + direction.x === 0 && wanted.y + direction.y === 0;

  if (!isOpposite) {
    nextDirection = wanted;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFood();
  drawSnake();
}

function drawFood() {
  const center = food.x * cellSize + cellSize / 2;
  const middle = food.y * cellSize + cellSize / 2;

  ctx.fillStyle = '#ff5367';
  ctx.beginPath();
  ctx.arc(center, middle, cellSize * 0.38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9dffbd';
  ctx.fillRect(center + 2, middle - 12, 7, 5);
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const inset = index === 0 ? 3 : 4;
    const gradient = ctx.createLinearGradient(
      segment.x * cellSize,
      segment.y * cellSize,
      (segment.x + 1) * cellSize,
      (segment.y + 1) * cellSize,
    );
    gradient.addColorStop(0, index === 0 ? '#e3ffe7' : '#66f2a5');
    gradient.addColorStop(1, index === 0 ? '#66f2a5' : '#20c77c');
    ctx.fillStyle = gradient;
    roundRect(
      segment.x * cellSize + inset,
      segment.y * cellSize + inset,
      cellSize - inset * 2,
      cellSize - inset * 2,
      7,
    );
    ctx.fill();
  });
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function isWallHit(position) {
  return position.x < 0 || position.x >= cells || position.y < 0 || position.y >= cells;
}

function isSnakeHit(position) {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}

function endGame() {
  clearInterval(timerId);
  running = false;
  paused = false;
  setMessage('Игра окончена! Нажмите «Заново», чтобы попробовать ещё раз');
}

function updateScore() {
  scoreElement.textContent = score;

  if (score > bestScore) {
    bestScore = score;
    bestScoreElement.textContent = bestScore;
    localStorage.setItem('snake-best-score', String(bestScore));
  }
}

function setMessage(text) {
  messageElement.textContent = text;
  messageElement.hidden = text.length === 0;
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', restartGame);

touchButtons.forEach((button) => {
  button.addEventListener('click', () => setDirection(button.dataset.direction));
});

document.addEventListener('keydown', (event) => {
  const keyMap = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
  };

  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
    return;
  }

  const selectedDirection = keyMap[event.code];
  if (selectedDirection) {
    event.preventDefault();
    setDirection(selectedDirection);
  }
});
