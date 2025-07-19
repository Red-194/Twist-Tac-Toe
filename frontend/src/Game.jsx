import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./Game.css";

export default function Game() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'classic';
  
  // Game selection state - mode comes from URL, only need opponent selection
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [currentDifficulty, setCurrentDifficulty] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState('local'); // 'local' or 'api'
  
  // Game state
  const [board, setBoard] = useState(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [playerSymbol, setPlayerSymbol] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'draw'
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [isAiTurn, setIsAiTurn] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [isProcessingMove, setIsProcessingMove] = useState(false);

  const getDepthFromDifficulty = (difficulty) => {
  const depthMapping = [0, 1, 3, 5, 7, 9]; // index 0 unused, positions 1-5 map to depths
  return depthMapping[difficulty];
  };

  const difficultyNames = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert'];
  const difficultyColors = ['', 'blue', 'green', 'orange', 'red', 'purple'];

  // Local game logic for friend play (using same logic as backend util.py)
  const checkLocalWinner = (board) => {
    const winConditions = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],  // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8],  // columns
      [0, 4, 8], [2, 4, 6]              // diagonals
    ];
    
    for (let condition of winConditions) {
      const [a, b, c] = condition;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    
    if (!board.includes('')) {
      return 'draw';
    }
    
    return null;
  };

  const makeLocalMove = (index) => {
    const newBoard = [...board];
    const newMoveHistory = [...moveHistory];
    
    // Make the move
    newBoard[index] = currentPlayer;
    newMoveHistory.push(index);
    
    // Handle decay mode
    if (mode === 'decay' && newMoveHistory.length > 6) {
      const oldMove = newMoveHistory.shift();
      newBoard[oldMove] = '';
    }
    
    setBoard(newBoard);
    setMoveHistory(newMoveHistory);
    
    // Check for winner
    const result = checkLocalWinner(newBoard);
    if (result) {
      setTimeout(() => {
        if (result === 'draw') {
          setGameStatus('draw');
          setWinner('draw');
        } else {
          setGameStatus('won');
          setWinner(result);
        }
        setWinningCells([]);
      }, 500); // 1 second delay to see the final move
    } 
      // Switch player
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);

    setIsProcessingMove(true);
    setTimeout(()=>{
      setIsProcessingMove(false);
    }, 500);
  };

  const selectOpponent = (opponent) => {
    setSelectedOpponent(opponent);
  };

  const updateDifficulty = (value) => {
    setCurrentDifficulty(parseInt(value));
  };

  const startGame = () => {
    if (!selectedOpponent) return;
    setGameStarted(true);
    
    if (selectedOpponent === 'friends') {
      setGameMode('local');
      setPlayerSymbol('X');
      resetGameState();
    } else if (selectedOpponent === 'ai') {
      tryStartApiGame();
    }
  };

  const tryStartApiGame = async () => {
    try {
      setGameMode('api');
      await startNewGame();
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setGameMode('local');
        setPlayerSymbol('X');
        resetGameState();
      } else {
        throw error;
      }
    }
  };

  const resetGameState = () => {
    setBoard(Array(9).fill(''));
    setCurrentPlayer('X');
    setGameStatus('playing');
    setWinner(null);
    setWinningCells([]);
    setIsAiTurn(false);
    setMoveHistory([]);
    setIsProcessingMove(false);
  };

  // Handle cell click in game
  const handleCellClick = (index) => {
    if (board[index] !== '' || gameStatus !== 'playing' || isAiTurn || isProcessingMove) return;

    if(selectedOpponent === 'ai' && gameMode === 'api'){
      setIsProcessingMove(true)
      setTimeout(()=>{
        makeMove(index);
        setIsProcessingMove(false);
      }, 800);
    }
    else if (gameMode==='local'){
      makeLocalMove(index);
      setIsProcessingMove(true);
      setTimeout(()=>{
        setIsProcessingMove(false);
      }, 500);
    }
  };

  // Reset game
  const resetGame = () => {
    if (gameMode === 'api' && selectedOpponent === 'ai') {
      startNewGame();
    } else {
      resetGameState();
    }
  };

  // Go back to opponent selection
  const goBackToSelection = () => {
    setGameStarted(false);
    setBoard(Array(9).fill(''));
    setCurrentPlayer('X');
    setPlayerSymbol('');
    setGameStatus('playing');
    setWinner(null);
    setWinningCells([]);
    setIsAiTurn(false);
    setMoveHistory([]);
    setIsProcessingMove(false);
  };

  const goBack = () => {
    navigate('/');
  };

  // Navigate to results
  const goToResults = () => {
    const result = winner === 'draw' ? 'draw' : winner;
    navigate(`/result/${gameId}?winner=${result}&result=${gameStatus}`);
  };

  // API calls to FastAPI backend
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  const startNewGame = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/new_game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: mode,
        ai_mode: selectedOpponent === 'ai',
        depth: getDepthFromDifficulty(currentDifficulty)  // 1-9 depending on slider
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to start new game`);
    }

    const gameData = await response.json();
    setBoard(gameData.board);
    setCurrentPlayer(gameData.player_symbol);
    setPlayerSymbol(gameData.player_symbol);
    setMoveHistory(gameData.move_history || []);

    if (gameData.result === 'in progress' || gameData.result === 'in_progress') {
      setGameStatus('playing');
    } else {
      // Add delay before showing result modal for API games
      setTimeout(() => {
        if (gameData.result === 'draw') {
          setGameStatus('draw');
          setWinner('draw');
        } else {
          setGameStatus('won');
          setWinner(gameData.result);
        }
      }, 1000); // 1 second delay to see the final move
    }

    if (!gameData.your_turn && selectedOpponent === 'ai') {
      setIsAiTurn(true);
    } else {
      setIsAiTurn(false);
    }

  } catch (error) {
    console.error('Error starting new game:', error);
    throw error; // Re-throw the error so tryStartApiGame can handle fallback
  }
};

  const makeMove = async (index) => {
  try {
    setIsAiTurn(true);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_BASE_URL}/make_move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        board: board,
        player_move: index,
        player_symbol: currentPlayer,
        ai_enabled: selectedOpponent === 'ai',
        depth: getDepthFromDifficulty(currentDifficulty),
        mode: mode,
        move_history: moveHistory
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to make move`);
    }

    const gameData = await response.json();
    setBoard(gameData.board);
    setMoveHistory(gameData.move_history || []);

    if (gameData.result === 'in progress' || gameData.result === 'in_progress') {
      setGameStatus('playing');
      setIsAiTurn(!gameData.your_turn);
    } else {
      // Add delay before showing result modal for API moves
      setTimeout(() => {
        if (gameData.result === 'draw') {
          setGameStatus('draw');
          setWinner('draw');
        } else {
          setGameStatus('won');
          setWinner(gameData.result);
        }
        setIsAiTurn(false);
      }, 1000); // 1 second delay to see the final move
    }

  } catch (error) {
    console.error('Error making move:', error);
    setIsAiTurn(false);
  }
};

  const getStatusMessage = () => {
    if (gameStatus === 'won') {
      if (selectedOpponent === 'ai') {
        
        return winner === playerSymbol ? '🎉 You Won!' : '🤖 Get good :P';
      } else {
        // Local multiplayer
        return `🎉 Player ${winner} Won!`;
      }
    }
    if (gameStatus === 'draw') {
      return "🤝 It's a Draw!";
    }
    if (isAiTurn) {
      return '🤔 AI is thinking...';
    }
    if (selectedOpponent === 'ai') {
      return isAiTurn ? '🤖 AI Turn' : '👤 Your Turn';
    }
    return `👤 Player ${currentPlayer}'s Turn`;
  };

  const getGlowClass = () => {
    if (gameStatus === 'won') {
      if (winner === 'X') return 'glow-blue';
      if (winner === 'O') return 'glow-red';
    }
    if (gameStatus === 'draw') return 'glow-green';
    return '';
  };

  // Show game board if game has started
  if (gameStarted) {
    return (
      <div className="container">
        <div className="main-card">
          {/* Title */}
          <div className="title-container">
            <h1 className="main-title">Tic Tac Toe</h1>
          </div>        {/* Decorative Elements */}
        <div className="decorative-x decorative-x-1">X</div>
        <div className="decorative-o decorative-o-1">O</div>
        <div className="decorative-x decorative-x-2">X</div>
        <div className="decorative-o decorative-o-2">O</div>
        <div className="decorative-x decorative-x-3">X</div>
        <div className="decorative-o decorative-o-3">O</div>
        <div className="decorative-x decorative-x-4">X</div>
        <div className="decorative-o decorative-o-4">O</div>
        <div className="decorative-x decorative-x-5">X</div>
        <div className="decorative-o decorative-o-5">O</div>
        <div className="decorative-x decorative-x-6">X</div>
        <div className="decorative-o decorative-o-6">O</div>
        <div className="decorative-x decorative-x-7">X</div>
        <div className="decorative-o decorative-o-7">O</div>
        <div className="decorative-x decorative-x-8">X</div>
        <div className="decorative-o decorative-o-8">O</div>
        <div className="decorative-x decorative-x-9">X</div>
        <div className="decorative-o decorative-o-9">O</div>
        <div className="decorative-x decorative-x-10">X</div>
        <div className="decorative-o decorative-o-10">O</div>

          {/* Game Board Container with Integrated Info */}
          <div className={`game-board-container ${getGlowClass()}`}>
            {/* Game Info - Integrated above board */}
            <div className="game-info-integrated">
              <div className="status-message">{getStatusMessage()}</div>
              {selectedOpponent === 'ai' && (
                <div className="ai-difficulty">
                  {gameMode === 'api' ? `Online AI - Difficulty: ${difficultyNames[currentDifficulty]}` : 'Local AI (Connection Failed)'}
                </div>
              )}
              {selectedOpponent === 'friends' && (
                <div className="ai-difficulty">
                  Local Multiplayer
                </div>
              )}
            </div>

            {/* Game Board */}
            <div className="game-board">
              {board.map((cell, index) => (
                <button
                  key={index}
                  className={`cell ${
                    winningCells.includes(index) ? 'winning' : ''
                  } ${
                    selectedOpponent === 'ai' && (isAiTurn || isProcessingMove)
                      ? 'ai-thinking'
                      : ''
                  }`}
                  onClick={() => handleCellClick(index)}
                  disabled={
                    cell !== '' ||
                    gameStatus !== 'playing' ||
                    isAiTurn ||
                    isProcessingMove
                  }
                >
                  {cell && <span className={cell.toLowerCase()}>{cell}</span>}

                  {selectedOpponent === 'ai' &&
                    (isAiTurn || isProcessingMove) &&
                    cell === '' && (
                      <div className="thinking-indicator">⏳</div>
                    )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn btn-back" onClick={goBackToSelection}>
              ← Back
            </button>
            <button className="btn btn-reset" onClick={resetGame}>
              🔄 Reset
            </button>
            {gameStatus !== 'playing' && (
              <button className="btn btn-new" onClick={goToResults}>
                📊 Results
              </button>
            )}
          </div>

        {/* Game Over Overlay - Inside main-card for proper positioning */}
        {gameStatus !== 'playing' && (
          <div className="game-over-overlay">
            <div className="game-over-content">
              <div className="game-over-message">
                {getStatusMessage()}
              </div>
              <div className="game-over-buttons">
                <button className="btn btn-play-again" onClick={resetGame}>
                  🔄 Play Again
                </button>
                <button className="btn btn-results" onClick={goToResults}>
                  📊 View Results
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

// Replace this section at the end of your Game component's return statement:

  // Show game setup
  return (
    <div className="container">
      {/* Main Card Container */}
      <div className="main-card">
        {/* Title */}
        <div className="title-container">
          <h1 className="main-title">Choose Your Opponent</h1>
          <p className="game-mode-display">
            Playing: <span className="selected-mode">{mode === 'classic' ? 'Tic Tac Toe' : mode === 'decay' ? 'Decay Tac Toe' : 'Tic Tac Toe'}</span>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="decorative-x decorative-x-1">X</div>
        <div className="decorative-o decorative-o-1">O</div>
        <div className="decorative-x decorative-x-2">X</div>
        <div className="decorative-o decorative-o-2">O</div>
        <div className="decorative-x decorative-x-3">X</div>
        <div className="decorative-o decorative-o-3">O</div>
        <div className="decorative-x decorative-x-4">X</div>
        <div className="decorative-o decorative-o-4">O</div>
        <div className="decorative-x decorative-x-5">X</div>
        <div className="decorative-o decorative-o-5">O</div>
        <div className="decorative-x decorative-x-6">X</div>
        <div className="decorative-o decorative-o-6">O</div>
        <div className="decorative-x decorative-x-7">X</div>
        <div className="decorative-o decorative-o-7">O</div>
        <div className="decorative-x decorative-x-8">X</div>
        <div className="decorative-o decorative-o-8">O</div>
        <div className="decorative-x decorative-x-9">X</div>
        <div className="decorative-o decorative-o-9">O</div>
        <div className="decorative-x decorative-x-10">X</div>
        <div className="decorative-o decorative-o-10">O</div>

        {/* Opponent Selection */}
        <div className="selection-section">
          <div className="option-cards-container">
            <div className="option-card">
              <button 
                className={`option-button ${selectedOpponent === 'friends' ? 'selected' : ''}`}
                onClick={() => selectOpponent('friends')}
              >
                <div className="option-content">
                  <div className="option-icon">👥</div>
                  <div className="option-text">
                    <h3 className="option-title">Play with Friend</h3>
                    <p className="option-description">Local multiplayer</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="option-card">
              <button 
                className={`option-button ${selectedOpponent === 'ai' ? 'selected' : ''}`}
                onClick={() => selectOpponent('ai')}
              >
                <div className="option-content">
                  <div className="option-icon">🤖</div>
                  <div className="option-text">
                    <h3 className="option-title">Play with AI</h3>
                    <p className="option-description">Challenge the computer</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* AI Difficulty Slider */}
        {selectedOpponent === 'ai' && (
          <div className="difficulty-slider">
            <div className="difficulty-display">
              <span className="difficulty-label">Difficulty:</span>
              <span className={`difficulty-name ${difficultyColors[currentDifficulty].toLowerCase()}`}>
                {difficultyNames[currentDifficulty]}
              </span>
            </div>
            
            <div className="slider-container">
              <div className="slider-track">
                <div 
                  className={`slider-progress ${difficultyColors[currentDifficulty].toLowerCase()}`}
                  style={{
                    width: `${((currentDifficulty - 1) / 4) * 100}%`
                  }}
                />
              </div>
              <input 
                type="range" 
                min="1"
                max="5"
                value={currentDifficulty}
                onChange={(e) => {
                  const sliderValue = Number(e.target.value);
                  setCurrentDifficulty(sliderValue);
                }}
                className="slider-input"
              />
            </div>
            
            <div className="difficulty-labels">
              {difficultyNames.slice(1).map((name, index) => (
                <span 
                  key={index + 1}
                  className={`label ${currentDifficulty === index + 1 ? 'active' : ''}`}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - Moved inside main-card */}
        <div className="setup-buttons">
          <button className="back-button" onClick={goBack}>
            ← BACK
          </button>
          <button 
            className={`start-button ${!selectedOpponent ? 'disabled' : ''}`}
            onClick={startGame}
            disabled={!selectedOpponent}
          >
            START GAME →
          </button>
        </div>
      </div>
    </div>
  );
}
