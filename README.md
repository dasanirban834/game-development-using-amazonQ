# Smart Snake Game

A modern, interactive snake game with educational challenges focused on Python programming and AWS knowledge. This project combines classic gameplay with learning opportunities in a visually appealing interface.

![Smart Snake Game](https://via.placeholder.com/800x400?text=Smart+Snake+Game)

## Features

- **Interactive Snake Game**: Classic snake gameplay with modern graphics and animations
- **Auto-Chase Mode**: Snake can automatically chase the rat or be manually controlled
- **Educational Challenges**: Answer Python and AWS questions to earn rewards
- **Reward System**:
  - Python questions: Earn 100 points and make your snake longer
  - AWS questions: Earn poison to slow down the rat
- **Special Abilities**: Use poison to slow down the rat temporarily
- **Responsive Design**: Works on various screen sizes
- **High Score Tracking**: Local storage saves your best performance

## Game Mechanics

- Snake automatically chases the rat (can be toggled off)
- Use arrow keys to manually control the snake
- Catch the moving rat to grow and earn 20 points
- Answer Python and AWS questions correctly to earn special rewards
- Use poison (press 'P' or click the button) to slow down the rat

## Educational Content

The game includes various types of educational challenges:

1. **Python Multiple Choice Questions**: Test your Python knowledge
2. **AWS Multiple Choice Questions**: Learn about AWS services
3. **Python Error Identification**: Find and fix errors in Python code
4. **Python Concept Questions**: Understand core Python concepts

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript
- **Canvas API**: For game rendering
- **Docker**: For containerization and easy deployment
- **Nginx**: As the web server

## Project Structure

```
game-development-using-amazonQ/
├── snake-game.html     # Main HTML file
├── style.css           # CSS styling
├── script.js           # Game logic and educational content
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose setup
└── README.md           # Project documentation
```

## How to Run

### Using Docker (Recommended)

1. Make sure you have Docker and Docker Compose installed
2. Clone this repository
3. Navigate to the project directory
4. Run the following command:

```bash
docker-compose up -d
```

5. Open your browser and go to `http://localhost`

### Without Docker

1. Clone this repository
2. Navigate to the project directory
3. Open `snake-game.html` in your web browser

## Development

The game is built with vanilla JavaScript using the Canvas API for rendering. The main components are:

- **Game Loop**: Handles movement, collision detection, and rendering
- **Snake AI**: Implements pathfinding for auto-chase mode
- **Challenge System**: Manages educational questions and rewards
- **Responsive Design**: Adapts to different screen sizes

## Future Enhancements

- Add more educational content and question types
- Implement difficulty levels
- Add multiplayer functionality
- Create a leaderboard system
- Add sound effects and background music

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Font: "Press Start 2P" from Google Fonts
- Inspired by classic snake games with an educational twist
