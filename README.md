# Snake-Game-on-Console
The player controls a snake moving on a 10x10 grid to eat food, making the snake longer and increasing the score. The game ends if the snake hits a wall or bites itself.
Initialize the project:
Create a new folder, e.g. snake-cli.
Run npm init -y to create package.json.
Install the required libraries:
bash

npm install commander chalk inquirer
Copy the above source code into the snake.js file.
Add to package.json:
json

"bin": { "snake": "./snake.js" }
Global link: npm link.
