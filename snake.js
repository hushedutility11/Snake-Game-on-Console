#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const inquirer = require('inquirer');

const HIGHSCORE_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.snake_highscores.json');
const GRID_SIZE = 10;
const INITIAL_SNAKE = [{ row: 5, col: 5 }];
const DIRECTIONS = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

// Load high scores
async function loadHighScores() {
  try {
    const data = await fs.readFile(HIGHSCORE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save high score
async function saveHighScore(score, name) {
  const highScores = await loadHighScores();
  highScores.push({ name, score, date: new Date().toISOString() });
  highScores.sort((a, b) => b.score - a.score);
  highScores.splice(5); // Keep top 5 scores
  await fs.writeFile(HIGHSCORE_FILE, JSON.stringify(highScores, null, 2));
}

// Display high scores
async function showHighScores() {
  const highScores = await loadHighScores();
  if (!highScores.length) {
    console.log(chalk.yellow('No high scores yet.'));
    return;
  }
  console.log(chalk.blue('High Scores:'));
  highScores.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.name} - ${entry.score} points (${entry.date})`);
  });
}

// Reset high scores
async function resetHighScores() {
  await fs.writeFile(HIGHSCORE_FILE, JSON.stringify([], null, 2));
  console.log(chalk.green('High scores cleared!'));
}

// Generate random food position
function generateFood(snake) {
  let food;
  do {
    food = {
      row: Math.floor(Math.random() * GRID_SIZE),
      col: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.row === food.row && segment.col === food.col));
  return food;
}

// Check for collision
function isCollision(pos, snake) {
  return (
    pos.row < 0 ||
    pos.row >= GRID_SIZE ||
    pos.col < 0 ||
    pos.col >= GRID_SIZE ||
    snake.some(segment => segment.row === pos.row && segment.col === pos.col)
  );
}

// Display grid
function displayGrid(snake, food) {
  console.clear();
  for (let row = 0; row < GRID_SIZE; row++) {
    let rowStr = '';
    for (let col = 0; col < GRID_SIZE; col++) {
      if (snake[0].row === row && snake[0].col === col) {
        rowStr += chalk.green('█'); // Snake head
      } else if (snake.some(segment => segment.row === row && segment.col === col)) {
        rowStr += chalk.green('▒'); // Snake body
      } else if (food.row === row && food.col === col) {
        rowStr += chalk.red('●'); // Food
      } else {
        rowStr += ' ';
      }
    }
    console.log(rowStr);
  }
  console.log(chalk.cyan(`Score: ${snake.length - 1}`));
}

// Play the game
async function playGame() {
  let snake = [...INITIAL_SNAKE];
  let direction = 'right';
  let food = generateFood(snake);
  let score = 0;

  console.log(chalk.cyan('Welcome to the Snake Game!'));
  console.log(chalk.cyan('Use WASD or arrow keys to move. Press Q to quit.'));

  // Set up keypress listener
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  let lastDirection = direction;

  const gameLoop = setInterval(() => {
    const head = { ...snake[0] };
    head.row += DIRECTIONS[direction].row;
    head.col += DIRECTIONS[direction].col;

    if (isCollision(head, snake.slice(1))) {
      clearInterval(gameLoop);
      process.stdin.setRawMode(false);
      console.log(chalk.red(`Game over! Your score: ${score}`));
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter your name to save your score:',
          default: 'Player',
        },
      ]);
      await saveHighScore(score, name);
      return;
    }

    snake.unshift(head);
    if (head.row === food.row && head.col === food.col) {
      score++;
      food = generateFood(snake);
    } else {
      snake.pop();
    }

    displayGrid(snake, food);
  }, 500);

  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'q') {
      clearInterval(gameLoop);
      process.stdin.setRawMode(false);
      process.exit();
    }
    const newDirection = key.name === 'up' || str === 'w' ? 'up' :
                         key.name === 'down' || str === 's' ? 'down' :
                         key.name === 'left' || str === 'a' ? 'left' :
                         key.name === 'right' || str === 'd' ? 'right' : null;
    if (newDirection && !isOppositeDirection(newDirection, lastDirection)) {
      direction = newDirection;
      lastDirection = newDirection;
    }
  });

  function isOppositeDirection(dir1, dir2) {
    return (dir1 === 'up' && dir2 === 'down') ||
           (dir1 === 'down' && dir2 === 'up') ||
           (dir1 === 'left' && dir2 === 'right') ||
           (dir1 === 'right' && dir2 === 'left');
  }
}

// Set up commands
program
  .command('play')
  .description('Start the game')
  .action(() => playGame());

program
  .command('highscore')
  .description('View high scores')
  .action(() => showHighScores());

program
  .command('reset')
  .description('Clear high scores')
  .action(() => resetHighScores());

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log(chalk.cyan('Use the "play" command to start the game!'));
}
