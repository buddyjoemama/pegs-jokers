'use client';

import { useState } from 'react';
import { useGame } from './board/useGame';
import TrackDemo from './board/TrackDemo';

const GameLobby: React.FC = () => {
  const { 
    gameId, 
    isConnected, 
    connectionStatus, 
    createGame, 
    joinGame, 
    leaveGame 
  } = useGame();
  
  const [inputGameId, setInputGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsCreating(true);
    try {
      const newGameId = await createGame();
      if (!newGameId) {
        alert('Failed to create game. Firebase may not be initialized.');
        return;
      }
      console.log(`🎮 Created game: ${newGameId}`);
      // Copy to clipboard automatically
      await navigator.clipboard.writeText(newGameId);
      alert(`Game created! Game ID copied to clipboard: ${newGameId}\n\nShare this ID with friends to let them join!`);
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!inputGameId.trim()) {
      alert('Please enter a Game ID');
      return;
    }
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsJoining(true);
    try {
      await joinGame(inputGameId.trim());
      console.log(`✅ Joined game: ${inputGameId}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      alert('Failed to join game. Check the Game ID and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const copyGameId = async () => {
    if (gameId) {
      try {
        await navigator.clipboard.writeText(gameId);
        alert('Game ID copied to clipboard!');
      } catch (error) {
        // Fallback for browsers that don't support clipboard API
        console.error('Failed to copy to clipboard:', error);
        prompt('Copy this Game ID:', gameId);
      }
    }
  };

  // Show the game if connected
  if (isConnected && gameId) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header with game info */}
        <div className="bg-slate-800 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Pegs & Jokers</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Game ID:</span>
                  <code className="bg-slate-700 px-2 py-1 rounded text-sm font-mono">
                    {gameId}
                  </code>
                  <button
                    onClick={copyGameId}
                    className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                  <span className="text-sm text-slate-300 capitalize">
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={leaveGame}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
            >
              Leave Game
            </button>
          </div>
        </div>

        {/* Game board */}
        <div className="p-4">
          <TrackDemo />
        </div>
      </div>
    );
  }

  // Show lobby if not connected
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          🎮 Pegs & Jokers
        </h1>

        {/* Player name input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={connectionStatus === 'connecting'}
            onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && handleCreateGame()}
          />
        </div>

        {/* Create new game */}
        <div className="mb-6">
          <button
            onClick={handleCreateGame}
            disabled={!playerName.trim() || isCreating || connectionStatus === 'connecting'}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
          >
            {isCreating ? '🎮 Creating...' : '🎮 Create New Game'}
          </button>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Create a game and share the ID with friends
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-600"></div>
          <span className="px-4 text-sm text-slate-400">OR</span>
          <div className="flex-1 border-t border-slate-600"></div>
        </div>

        {/* Join existing game */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Game ID
          </label>
          <input
            type="text"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
            placeholder="Enter Game ID (e.g., -O7XnF8...)"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={connectionStatus === 'connecting'}
            onKeyDown={(e) => e.key === 'Enter' && inputGameId.trim() && playerName.trim() && handleJoinGame()}
          />
          <button
            onClick={handleJoinGame}
            disabled={!inputGameId.trim() || !playerName.trim() || isJoining || connectionStatus === 'connecting'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
          >
            {isJoining ? '🔗 Joining...' : '🔗 Join Game'}
          </button>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Enter the Game ID shared by your friend
          </p>
        </div>

        {/* Connection status */}
        {connectionStatus !== 'disconnected' && (
          <div className="mt-6 p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span className="text-sm capitalize">
                {connectionStatus === 'connecting' ? 'Connecting to Firebase...' : connectionStatus}
              </span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-xs text-slate-400 space-y-1">
          <p><strong>How to play multiplayer:</strong></p>
          <p>1. One player creates a game and shares the Game ID</p>
          <p>2. Other players join using that Game ID</p>
          <p>3. All moves sync in real-time across all players!</p>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;