import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./Result.css";

export default function Result() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const winner = searchParams.get('winner');
  const result = searchParams.get('result');

  const handlePlayAgain = () => {
    // Generate a new game ID for a fresh game
    const newGameId = Math.random().toString(36).substr(2, 9);
    navigate(`/game/${newGameId}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getResultDisplay = () => {
    if (winner) {
      return {
        emoji: winner === 'X' ? '❌' : '⭕',
        title: `Player ${winner} Wins!`,
        subtitle: '🎉 Congratulations! 🎉',
        celebration: true
      };
    } else if (result === 'draw') {
      return {
        emoji: '🤝',
        title: "It's a Draw!",
        subtitle: '🎯 Great game! Try again!',
        celebration: false
      };
    } else {
      return {
        emoji: '🎮',
        title: 'Game Complete!',
        subtitle: '✨ Thanks for playing! ✨',
        celebration: false
      };
    }
  };

  const resultDisplay = getResultDisplay();

  return (
    <div className="container">
      <div className="main-card">
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
        
        <div className="result-content">
          <div className={`result-emoji ${resultDisplay.celebration ? 'celebrate' : ''}`}>
            {resultDisplay.emoji}
          </div>
          
          <h1 className="result-title">{resultDisplay.title}</h1>
          <p className="result-subtitle">{resultDisplay.subtitle}</p>
          
          <div className="button-container">
            <button 
              onClick={handlePlayAgain}
              className="result-button play-again"
            >
              🔄 Play Again
            </button>
            <button 
              onClick={handleGoHome}
              className="result-button go-home"
            >
              🏠 Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
