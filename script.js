// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const gridWidth = canvas.width / gridSize;
const gridHeight = canvas.height / gridSize;

// Game state
let snake = [];
let direction = 'right';
let nextDirection = 'right';
let rat = { x: 0, y: 0, direction: 'random' };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameInterval;
let gameSpeed = 150;
let gameRunning = false;
let gamePaused = false;
let poisonCount = 0;
let challengeTimer = 0;
let ratMovementCounter = 0;
let ratSpeed = 3; // Move every 3 ticks
let autoChaseMode = true; // Snake automatically chases the rat
let awsQuestionProbability = 0.2; // Lower probability for AWS questions

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const poisonElement = document.getElementById('poison');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');
const usePoisonButton = document.getElementById('usePoison');
const toggleChaseModeButton = document.getElementById('toggleChaseMode');
const challengeModal = document.getElementById('challengeModal');
const challengeQuestion = document.getElementById('challengeQuestion');
const codeAnswer = document.getElementById('codeAnswer');
const submitAnswerButton = document.getElementById('submitAnswer');
const skipChallengeButton = document.getElementById('skipChallenge');

// Initialize the game
function initGame() {
    // Create snake
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    poisonCount = 0;
    challengeTimer = Math.floor(Math.random() * 50) + 50; // Challenge after 50-100 moves
    
    // Update display
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    poisonElement.textContent = poisonCount;
    toggleChaseModeButton.textContent = autoChaseMode ? 'Disable Auto-Chase' : 'Enable Auto-Chase';
    
    // Place rat
    placeRat();
    
    // Hide game over screen
    gameOverElement.style.display = 'none';
    
    // Start game loop
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    gameRunning = true;
    gamePaused = false;
}

// Place rat at random position (not on snake)
function placeRat() {
    let validPosition = false;
    
    while (!validPosition) {
        rat.x = Math.floor(Math.random() * gridWidth);
        rat.y = Math.floor(Math.random() * gridHeight);
        
        validPosition = true;
        
        // Check if rat is on snake
        for (let segment of snake) {
            if (segment.x === rat.x && segment.y === rat.y) {
                validPosition = false;
                break;
            }
        }
    }
    
    // Set random direction for rat
    const directions = ['up', 'down', 'left', 'right'];
    rat.direction = directions[Math.floor(Math.random() * directions.length)];
}

// Move rat in its current direction or change direction
function moveRat() {
    ratMovementCounter++;
    
    // Only move rat every few ticks
    if (ratMovementCounter < ratSpeed) {
        return;
    }
    
    ratMovementCounter = 0;
    
    // 20% chance to change direction
    if (Math.random() < 0.2) {
        const directions = ['up', 'down', 'left', 'right'];
        rat.direction = directions[Math.floor(Math.random() * directions.length)];
    }
    
    // Store previous position
    const prevX = rat.x;
    const prevY = rat.y;
    
    // Move rat
    switch (rat.direction) {
        case 'up':
            rat.y = (rat.y - 1 + gridHeight) % gridHeight;
            break;
        case 'down':
            rat.y = (rat.y + 1) % gridHeight;
            break;
        case 'left':
            rat.x = (rat.x - 1 + gridWidth) % gridWidth;
            break;
        case 'right':
            rat.x = (rat.x + 1) % gridWidth;
            break;
    }
    
    // Check if new position is on snake
    for (let segment of snake) {
        if (segment.x === rat.x && segment.y === rat.y) {
            // Revert to previous position and change direction
            rat.x = prevX;
            rat.y = prevY;
            
            const directions = ['up', 'down', 'left', 'right'];
            rat.direction = directions[Math.floor(Math.random() * directions.length)];
            break;
        }
    }
}

// Main game loop
function gameLoop() {
    if (gamePaused) return;
    
    // Move snake
    moveSnake();
    
    // Move rat
    moveRat();
    
    // Check collisions
    if (checkCollision()) {
        endGame();
        return;
    }
    
    // Check if snake eats rat
    if (snake[0].x === rat.x && snake[0].y === rat.y) {
        // Increase score
        score += 20;
        scoreElement.textContent = score;
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // Don't remove tail to make snake grow
        placeRat();
        
        // Increase speed slightly
        if (gameSpeed > 70) {
            gameSpeed -= 2;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    } else {
        // Remove tail if snake didn't eat
        snake.pop();
    }
    
    // Check if it's time for a challenge
    challengeTimer--;
    if (challengeTimer <= 0) {
        pauseGame();
        showChallenge();
        // Reset timer with a longer interval for next challenge
        challengeTimer = Math.floor(Math.random() * 70) + 50; // 50-120 moves
    }
    
    // Draw everything
    drawGame();
}

// Move snake based on direction
function moveSnake() {
    // If auto-chase is enabled, calculate the best direction to chase the rat
    if (autoChaseMode) {
        const head = snake[0];
        
        // Calculate horizontal and vertical distances to the rat
        let dx = rat.x - head.x;
        let dy = rat.y - head.y;
        
        // Handle wrap-around distances
        if (Math.abs(dx) > gridWidth / 2) {
            dx = dx > 0 ? dx - gridWidth : dx + gridWidth;
        }
        
        if (Math.abs(dy) > gridHeight / 2) {
            dy = dy > 0 ? dy - gridHeight : dy + gridHeight;
        }
        
        // Decide whether to move horizontally or vertically based on distance
        if (Math.abs(dx) > Math.abs(dy)) {
            // Move horizontally
            if (dx > 0) {
                // Move right if not going left
                if (direction !== 'left') nextDirection = 'right';
            } else if (dx < 0) {
                // Move left if not going right
                if (direction !== 'right') nextDirection = 'left';
            }
        } else {
            // Move vertically
            if (dy > 0) {
                // Move down if not going up
                if (direction !== 'up') nextDirection = 'down';
            } else if (dy < 0) {
                // Move up if not going down
                if (direction !== 'down') nextDirection = 'up';
            }
        }
        
        // Avoid self-collision by checking if the next move would hit the snake
        const testHead = { x: head.x, y: head.y };
        switch (nextDirection) {
            case 'up':
                testHead.y = (testHead.y - 1 + gridHeight) % gridHeight;
                break;
            case 'down':
                testHead.y = (testHead.y + 1) % gridHeight;
                break;
            case 'left':
                testHead.x = (testHead.x - 1 + gridWidth) % gridWidth;
                break;
            case 'right':
                testHead.x = (testHead.x + 1) % gridWidth;
                break;
        }
        
        // Check if the next move would hit the snake body
        for (let i = 1; i < snake.length; i++) {
            if (testHead.x === snake[i].x && testHead.y === snake[i].y) {
                // Would hit self, try another direction
                const possibleDirections = ['up', 'down', 'left', 'right'].filter(dir => {
                    if (dir === 'up' && direction === 'down') return false;
                    if (dir === 'down' && direction === 'up') return false;
                    if (dir === 'left' && direction === 'right') return false;
                    if (dir === 'right' && direction === 'left') return false;
                    return true;
                });
                
                // Try each direction until we find a safe one
                let foundSafeDirection = false;
                for (const dir of possibleDirections) {
                    const safeHead = { x: head.x, y: head.y };
                    switch (dir) {
                        case 'up':
                            safeHead.y = (safeHead.y - 1 + gridHeight) % gridHeight;
                            break;
                        case 'down':
                            safeHead.y = (safeHead.y + 1) % gridHeight;
                            break;
                        case 'left':
                            safeHead.x = (safeHead.x - 1 + gridWidth) % gridWidth;
                            break;
                        case 'right':
                            safeHead.x = (safeHead.x + 1) % gridWidth;
                            break;
                    }
                    
                    // Check if this direction is safe
                    let isSafe = true;
                    for (let j = 1; j < snake.length; j++) {
                        if (safeHead.x === snake[j].x && safeHead.y === snake[j].y) {
                            isSafe = false;
                            break;
                        }
                    }
                    
                    if (isSafe) {
                        nextDirection = dir;
                        foundSafeDirection = true;
                        break;
                    }
                }
                
                // If no safe direction, just continue in current direction
                if (!foundSafeDirection) {
                    nextDirection = direction;
                }
                
                break;
            }
        }
    }
    
    // Update direction
    direction = nextDirection;
    
    // Calculate new head position
    const head = { x: snake[0].x, y: snake[0].y };
    
    switch (direction) {
        case 'up':
            head.y = (head.y - 1 + gridHeight) % gridHeight;
            break;
        case 'down':
            head.y = (head.y + 1) % gridHeight;
            break;
        case 'left':
            head.x = (head.x - 1 + gridWidth) % gridWidth;
            break;
        case 'right':
            head.x = (head.x + 1) % gridWidth;
            break;
    }
    
    // Add new head
    snake.unshift(head);
}

// Check for collisions with self
function checkCollision() {
    const head = snake[0];
    
    // Check collision with self (skip head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Draw the game
function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        // Head is a different color
        if (i === 0) {
            ctx.fillStyle = '#4CAF50'; // Green head
        } else {
            // Gradient from green to dark green
            const colorValue = 255 - (i * 5);
            ctx.fillStyle = `rgb(0, ${Math.max(colorValue, 100)}, 0)`;
        }
        
        ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize, gridSize);
        
        // Draw eyes on head
        if (i === 0) {
            ctx.fillStyle = '#FFF';
            
            // Position eyes based on direction
            switch (direction) {
                case 'up':
                    ctx.fillRect(snake[i].x * gridSize + 4, snake[i].y * gridSize + 3, 4, 4);
                    ctx.fillRect(snake[i].x * gridSize + 12, snake[i].y * gridSize + 3, 4, 4);
                    break;
                case 'down':
                    ctx.fillRect(snake[i].x * gridSize + 4, snake[i].y * gridSize + 13, 4, 4);
                    ctx.fillRect(snake[i].x * gridSize + 12, snake[i].y * gridSize + 13, 4, 4);
                    break;
                case 'left':
                    ctx.fillRect(snake[i].x * gridSize + 3, snake[i].y * gridSize + 4, 4, 4);
                    ctx.fillRect(snake[i].x * gridSize + 3, snake[i].y * gridSize + 12, 4, 4);
                    break;
                case 'right':
                    ctx.fillRect(snake[i].x * gridSize + 13, snake[i].y * gridSize + 4, 4, 4);
                    ctx.fillRect(snake[i].x * gridSize + 13, snake[i].y * gridSize + 12, 4, 4);
                    break;
            }
        }
        
        // Draw border around each segment
        ctx.strokeStyle = '#000';
        ctx.strokeRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize, gridSize);
    }
    
    // Draw rat
    ctx.fillStyle = '#FF5722'; // Orange rat
    ctx.fillRect(rat.x * gridSize, rat.y * gridSize, gridSize, gridSize);
    
    // Draw rat features
    ctx.fillStyle = '#000';
    
    // Draw ears, eyes and tail based on direction
    switch (rat.direction) {
        case 'up':
            // Ears
            ctx.fillRect(rat.x * gridSize + 2, rat.y * gridSize + 2, 4, 4);
            ctx.fillRect(rat.x * gridSize + 14, rat.y * gridSize + 2, 4, 4);
            // Eyes
            ctx.fillRect(rat.x * gridSize + 5, rat.y * gridSize + 6, 3, 3);
            ctx.fillRect(rat.x * gridSize + 12, rat.y * gridSize + 6, 3, 3);
            // Tail
            ctx.fillRect(rat.x * gridSize + 10, rat.y * gridSize + 16, 2, 4);
            break;
        case 'down':
            // Ears
            ctx.fillRect(rat.x * gridSize + 2, rat.y * gridSize + 14, 4, 4);
            ctx.fillRect(rat.x * gridSize + 14, rat.y * gridSize + 14, 4, 4);
            // Eyes
            ctx.fillRect(rat.x * gridSize + 5, rat.y * gridSize + 11, 3, 3);
            ctx.fillRect(rat.x * gridSize + 12, rat.y * gridSize + 11, 3, 3);
            // Tail
            ctx.fillRect(rat.x * gridSize + 10, rat.y * gridSize, 2, 4);
            break;
        case 'left':
            // Ears
            ctx.fillRect(rat.x * gridSize + 2, rat.y * gridSize + 2, 4, 4);
            ctx.fillRect(rat.x * gridSize + 2, rat.y * gridSize + 14, 4, 4);
            // Eyes
            ctx.fillRect(rat.x * gridSize + 6, rat.y * gridSize + 5, 3, 3);
            ctx.fillRect(rat.x * gridSize + 6, rat.y * gridSize + 12, 3, 3);
            // Tail
            ctx.fillRect(rat.x * gridSize + 16, rat.y * gridSize + 10, 4, 2);
            break;
        case 'right':
            // Ears
            ctx.fillRect(rat.x * gridSize + 14, rat.y * gridSize + 2, 4, 4);
            ctx.fillRect(rat.x * gridSize + 14, rat.y * gridSize + 14, 4, 4);
            // Eyes
            ctx.fillRect(rat.x * gridSize + 11, rat.y * gridSize + 5, 3, 3);
            ctx.fillRect(rat.x * gridSize + 11, rat.y * gridSize + 12, 3, 3);
            // Tail
            ctx.fillRect(rat.x * gridSize, rat.y * gridSize + 10, 4, 2);
            break;
    }
}

// End the game
function endGame() {
    clearInterval(gameInterval);
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    
    // Show game over screen
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'flex';
}

// Pause the game
function pauseGame() {
    if (!gameRunning) return;
    
    gamePaused = true;
    pauseButton.textContent = 'Resume';
}

// Resume the game
function resumeGame() {
    if (!gameRunning) return;
    
    gamePaused = false;
    pauseButton.textContent = 'Pause';
}

// Use poison to stun the rat
function usePoison() {
    if (poisonCount <= 0 || !gameRunning || gamePaused) return;
    
    poisonCount--;
    poisonElement.textContent = poisonCount;
    
    // Stun the rat (make it stay in place for a while)
    const originalRatSpeed = ratSpeed;
    ratSpeed = 15; // Make rat move very slowly
    
    // Visual effect
    ctx.fillStyle = 'rgba(128, 0, 128, 0.5)'; // Purple poison cloud
    ctx.beginPath();
    ctx.arc(rat.x * gridSize + gridSize/2, rat.y * gridSize + gridSize/2, gridSize * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset rat speed after 5 seconds
    setTimeout(() => {
        ratSpeed = originalRatSpeed;
    }, 5000);
}

// Show coding challenge or AWS quiz
function showChallenge() {
    // Mix Python and AWS questions more evenly
    const questionTypes = ['python-mcq', 'aws-mcq', 'python-error', 'python-concept'];
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    if (questionType === 'python-mcq') {
        // Python multiple choice questions
        const pythonMCQs = [
            {
                question: "What is the output of the following code?\n\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)",
                options: ["[1, 2, 3]", "[1, 2, 3, 4]", "[1, 2, 3, [4]]", "Error"],
                answer: "[1, 2, 3, 4]",
                explanation: "In Python, assignment creates a reference to the same object. When y.append(4) modifies the list, x sees the change because both variables reference the same list."
            },
            {
                question: "Which of the following is NOT a valid way to create an empty dictionary in Python?",
                options: ["dict()", "{}", "dict.new()", "dict([])"],
                answer: "dict.new()",
                explanation: "dict.new() is not a valid Python method. Empty dictionaries can be created using dict(), {}, or dict([])."
            },
            {
                question: "What does the following list comprehension produce?\n\n[x**2 for x in range(5) if x % 2 == 0]",
                options: ["[0, 1, 4, 9, 16]", "[0, 4, 16]", "[0, 2, 4]", "[0, 4]"],
                answer: "[0, 4, 16]",
                explanation: "This list comprehension squares each even number in range(5), which are 0, 2, and 4, resulting in [0, 4, 16]."
            },
            {
                question: "What is the purpose of the __init__ method in Python classes?",
                options: ["To initialize class variables", "To create a new instance", "To initialize instance attributes when an object is created", "To define class methods"],
                answer: "To initialize instance attributes when an object is created",
                explanation: "The __init__ method is called when a new object is created and is used to initialize the object's attributes."
            },
            {
                question: "What is the output of the following code?\n\nprint(list(filter(lambda x: x > 5, [2, 4, 6, 8, 10])))",
                options: ["[6, 8, 10]", "[True, True, True]", "[2, 4]", "[]"],
                answer: "[6, 8, 10]",
                explanation: "The filter function returns elements from the list for which the lambda function returns True, which are the numbers greater than 5."
            },
            {
                question: "Which statement about Python generators is correct?",
                options: ["Generators use the return keyword to yield values", "Generators store all their values in memory", "Generators use the yield keyword to return values one at a time", "Generators cannot be used in for loops"],
                answer: "Generators use the yield keyword to return values one at a time",
                explanation: "Generators use yield to return values one at a time and maintain their state between calls, making them memory-efficient."
            }
        ];
        
        const question = pythonMCQs[Math.floor(Math.random() * pythonMCQs.length)];
        
        let optionsHTML = '';
        for (let i = 0; i < question.options.length; i++) {
            optionsHTML += `<label><input type="radio" name="pythonAnswer" value="${question.options[i]}"> ${question.options[i]}</label><br>`;
        }
        
        challengeQuestion.innerHTML = `
            <p><strong>Python Quiz:</strong></p>
            <pre>${question.question}</pre>
            <form id="pythonQuizForm">
                ${optionsHTML}
            </form>
        `;
        
        // Store correct answer for validation
        challengeQuestion.dataset.answer = question.answer;
        challengeQuestion.dataset.explanation = question.explanation;
        challengeQuestion.dataset.type = 'python-mcq';
    } 
    else if (questionType === 'aws-mcq') {
        // AWS quiz
        const awsQuestions = [
            {
                question: "Which AWS service is used for serverless computing?",
                options: ["EC2", "Lambda", "RDS", "S3"],
                answer: "Lambda",
                explanation: "AWS Lambda is a serverless compute service that runs your code in response to events without requiring you to provision or manage servers."
            },
            {
                question: "Which AWS service is used for object storage?",
                options: ["EBS", "EFS", "S3", "Glacier"],
                answer: "S3",
                explanation: "Amazon S3 (Simple Storage Service) is an object storage service offering industry-leading scalability, data availability, security, and performance."
            },
            {
                question: "Which AWS service provides a virtual network dedicated to your AWS account?",
                options: ["VPC", "Direct Connect", "Transit Gateway", "Global Accelerator"],
                answer: "VPC",
                explanation: "Amazon Virtual Private Cloud (VPC) lets you provision a logically isolated section of the AWS Cloud where you can launch AWS resources in a virtual network."
            },
            {
                question: "Which AWS service is used for NoSQL databases?",
                options: ["RDS", "DynamoDB", "ElastiCache", "Redshift"],
                answer: "DynamoDB",
                explanation: "Amazon DynamoDB is a key-value and document database that delivers single-digit millisecond performance at any scale with built-in security and backup and restore."
            },
            {
                question: "Which AWS service is used for monitoring and observability?",
                options: ["CloudWatch", "CloudTrail", "Config", "Inspector"],
                answer: "CloudWatch",
                explanation: "Amazon CloudWatch is a monitoring and observability service that provides data and actionable insights for AWS, hybrid, and on-premises applications and infrastructure resources."
            },
            {
                question: "Which AWS service is used for container orchestration?",
                options: ["Batch", "Elastic Beanstalk", "ECS", "Lambda"],
                answer: "ECS",
                explanation: "Amazon Elastic Container Service (ECS) is a fully managed container orchestration service that helps you easily deploy, manage, and scale containerized applications."
            }
        ];
        
        const question = awsQuestions[Math.floor(Math.random() * awsQuestions.length)];
        
        let optionsHTML = '';
        for (let option of question.options) {
            optionsHTML += `<label><input type="radio" name="awsAnswer" value="${option}"> ${option}</label><br>`;
        }
        
        challengeQuestion.innerHTML = `
            <p><strong>AWS Quiz:</strong></p>
            <p>${question.question}</p>
            <form id="awsQuizForm">
                ${optionsHTML}
            </form>
        `;
        
        // Store correct answer for validation
        challengeQuestion.dataset.answer = question.answer;
        challengeQuestion.dataset.explanation = question.explanation;
        challengeQuestion.dataset.type = 'aws-mcq';
    }
    else if (questionType === 'python-error') {
        // Python error identification
        const errorQuestions = [
            {
                question: "What's wrong with this Python code?\n\ndef calculate_average(numbers):\n    total = 0\n    for num in numbers\n        total += num\n    return total / len(numbers)",
                options: ["Missing colon after for loop", "Variable 'total' not initialized correctly", "Division by zero error", "Incorrect indentation"],
                answer: "Missing colon after for loop",
                explanation: "The for loop is missing a colon. It should be 'for num in numbers:'"
            },
            {
                question: "Find the error in this code:\n\nmy_dict = {'a': 1, 'b': 2}\nprint(my_dict['c'])",
                options: ["Syntax error in dictionary creation", "KeyError: 'c' is not in the dictionary", "Invalid print statement", "Missing parentheses"],
                answer: "KeyError: 'c' is not in the dictionary",
                explanation: "Trying to access a key that doesn't exist in the dictionary raises a KeyError."
            },
            {
                question: "What's wrong with this code?\n\nmy_list = [1, 2, 3]\nmy_list[3] = 4\nprint(my_list)",
                options: ["IndexError: list index out of range", "TypeError: list indices must be integers", "SyntaxError in list assignment", "Nothing, the code is correct"],
                answer: "IndexError: list index out of range",
                explanation: "The list has indices 0, 1, and 2. Trying to access index 3 is out of range."
            },
            {
                question: "Find the error in this code:\n\ndef recursive_function(n):\n    print(n)\n    recursive_function(n-1)",
                options: ["SyntaxError in function definition", "No base case for recursion", "Invalid parameter name", "Incorrect indentation"],
                answer: "No base case for recursion",
                explanation: "The recursive function has no base case to stop the recursion, which will lead to a stack overflow."
            },
            {
                question: "What's wrong with this code?\n\nx = 10\nif x > 5\n    print('x is greater than 5')",
                options: ["Missing colon after if condition", "Invalid comparison operator", "Incorrect indentation", "Variable x is not defined"],
                answer: "Missing colon after if condition",
                explanation: "The if statement is missing a colon. It should be 'if x > 5:'"
            }
        ];
        
        const question = errorQuestions[Math.floor(Math.random() * errorQuestions.length)];
        
        let optionsHTML = '';
        for (let option of question.options) {
            optionsHTML += `<label><input type="radio" name="errorAnswer" value="${option}"> ${option}</label><br>`;
        }
        
        challengeQuestion.innerHTML = `
            <p><strong>Python Error Challenge:</strong></p>
            <pre>${question.question}</pre>
            <p>What's the error in this code?</p>
            <form id="errorQuizForm">
                ${optionsHTML}
            </form>
        `;
        
        // Store correct answer for validation
        challengeQuestion.dataset.answer = question.answer;
        challengeQuestion.dataset.explanation = question.explanation;
        challengeQuestion.dataset.type = 'python-error';
    }
    else if (questionType === 'python-concept') {
        // Python concepts
        const conceptQuestions = [
            {
                question: "What is the difference between a list and a tuple in Python?",
                options: [
                    "Lists are ordered and tuples are unordered", 
                    "Lists are mutable and tuples are immutable", 
                    "Lists can contain mixed types and tuples cannot", 
                    "Lists are faster than tuples for all operations"
                ],
                answer: "Lists are mutable and tuples are immutable",
                explanation: "The main difference is that lists are mutable (can be changed after creation) while tuples are immutable (cannot be modified after creation)."
            },
            {
                question: "What does the 'self' parameter in Python class methods represent?",
                options: [
                    "It refers to the class itself", 
                    "It refers to the instance of the class", 
                    "It's a reserved keyword that must be included", 
                    "It refers to the parent class in inheritance"
                ],
                answer: "It refers to the instance of the class",
                explanation: "In Python class methods, 'self' refers to the instance of the class and is used to access instance variables and methods."
            },
            {
                question: "What is a Python decorator?",
                options: [
                    "A design pattern for creating classes", 
                    "A function that takes another function and extends its behavior", 
                    "A way to add comments to functions", 
                    "A method for improving code performance"
                ],
                answer: "A function that takes another function and extends its behavior",
                explanation: "A decorator is a function that takes another function as input and extends or modifies its behavior without explicitly modifying the function itself."
            },
            {
                question: "What is the purpose of the __str__ method in Python?",
                options: [
                    "To convert an object to a string", 
                    "To define string variables in a class", 
                    "To concatenate strings", 
                    "To check if an object is a string"
                ],
                answer: "To convert an object to a string",
                explanation: "The __str__ method is used to define the string representation of an object and is called when str() is used on the object or when it's printed."
            },
            {
                question: "What is the purpose of the 'with' statement in Python?",
                options: [
                    "To handle exceptions", 
                    "To create loops with conditions", 
                    "To ensure proper acquisition and release of resources", 
                    "To define conditional blocks of code"
                ],
                answer: "To ensure proper acquisition and release of resources",
                explanation: "The 'with' statement is used for resource management, ensuring that resources are properly acquired and released, even if exceptions occur."
            }
        ];
        
        const question = conceptQuestions[Math.floor(Math.random() * conceptQuestions.length)];
        
        let optionsHTML = '';
        for (let option of question.options) {
            optionsHTML += `<label><input type="radio" name="conceptAnswer" value="${option}"> ${option}</label><br>`;
        }
        
        challengeQuestion.innerHTML = `
            <p><strong>Python Concept:</strong></p>
            <p>${question.question}</p>
            <form id="conceptQuizForm">
                ${optionsHTML}
            </form>
        `;
        
        // Store correct answer for validation
        challengeQuestion.dataset.answer = question.answer;
        challengeQuestion.dataset.explanation = question.explanation;
        challengeQuestion.dataset.type = 'python-concept';
    }
    
    // Show the challenge modal
    challengeModal.style.display = 'block';
}

// Validate challenge answer
function validateAnswer() {
    const type = challengeQuestion.dataset.type;
    const correctAnswer = challengeQuestion.dataset.answer;
    const explanation = challengeQuestion.dataset.explanation || '';
    let isCorrect = false;
    let selectedOption = null;
    
    // Check answer based on question type
    switch(type) {
        case 'python-mcq':
            selectedOption = document.querySelector('input[name="pythonAnswer"]:checked');
            if (selectedOption && selectedOption.value === correctAnswer) {
                isCorrect = true;
            }
            break;
        case 'aws-mcq':
            selectedOption = document.querySelector('input[name="awsAnswer"]:checked');
            if (selectedOption && selectedOption.value === correctAnswer) {
                isCorrect = true;
            }
            break;
        case 'python-error':
            selectedOption = document.querySelector('input[name="errorAnswer"]:checked');
            if (selectedOption && selectedOption.value === correctAnswer) {
                isCorrect = true;
            }
            break;
        case 'python-concept':
            selectedOption = document.querySelector('input[name="conceptAnswer"]:checked');
            if (selectedOption && selectedOption.value === correctAnswer) {
                isCorrect = true;
            }
            break;
    }
    
    if (isCorrect) {
        // Determine reward based on question type
        if (type.startsWith('python')) {
            // Python questions give points and make snake longer
            score += 100;
            scoreElement.textContent = score;
            
            // Update high score
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // Make snake longer
            for (let i = 0; i < 5; i++) {
                const tail = snake[snake.length - 1];
                snake.push({ x: tail.x, y: tail.y });
            }
            
            alert(`Correct! +100 points and snake is now longer!\n\nExplanation: ${explanation}`);
        } else {
            // AWS questions give poison
            poisonCount++;
            poisonElement.textContent = poisonCount;
            
            alert(`Correct! You earned 1 poison!\n\nExplanation: ${explanation}`);
        }
    } else {
        alert(`Incorrect answer. The correct answer was: ${correctAnswer}\n\nExplanation: ${explanation}`);
    }
    
    // Hide the challenge modal and resume game
    challengeModal.style.display = 'none';
    resumeGame();
}

// Skip challenge
function skipChallenge() {
    // Penalty for skipping
    score = Math.max(0, score - 50);
    scoreElement.textContent = score;
    
    // Hide the challenge modal and resume game
    challengeModal.style.display = 'none';
    resumeGame();
}

// Event listeners
document.addEventListener('keydown', (e) => {
    // Prevent default action for arrow keys to avoid page scrolling
    if ([37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
    }
    
    // Change direction
    switch (e.keyCode) {
        case 38: // Up arrow
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 40: // Down arrow
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 37: // Left arrow
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 39: // Right arrow
            if (direction !== 'left') nextDirection = 'right';
            break;
        case 80: // P key for poison
            usePoison();
            break;
        case 32: // Space bar to pause/resume
            if (gamePaused) {
                resumeGame();
            } else {
                pauseGame();
            }
            break;
    }
});

startButton.addEventListener('click', () => {
    if (!gameRunning) {
        initGame();
    } else {
        resumeGame();
    }
});

pauseButton.addEventListener('click', () => {
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});

restartButton.addEventListener('click', initGame);

usePoisonButton.addEventListener('click', usePoison);

submitAnswerButton.addEventListener('click', validateAnswer);

skipChallengeButton.addEventListener('click', skipChallenge);

toggleChaseModeButton.addEventListener('click', () => {
    autoChaseMode = !autoChaseMode;
    toggleChaseModeButton.textContent = autoChaseMode ? 'Disable Auto-Chase' : 'Enable Auto-Chase';
});

// Initialize high score display
highScoreElement.textContent = highScore;

// Show start screen
drawGame();
