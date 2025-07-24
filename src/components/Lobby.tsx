import React, { useState, useEffect } from 'react';
import { DuelModel } from '../models/DuelModel';
import { DuelView } from '../views/DuelView';

declare var Multisynq: any;

interface LobbyProps {
  onDuelStart: (session: any, isBot?: boolean) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onDuelStart }) => {
  const [status, setStatus] = useState('idle');
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if Multisynq SDK is loaded
    const checkMultisynq = () => {
      if (typeof window !== 'undefined' && window.Multisynq) {
        console.log('Multisynq SDK is loaded and ready');
      } else {
        console.log('Multisynq not yet loaded, waiting...');
        setTimeout(checkMultisynq, 1000);
      }
    };

    checkMultisynq();
  }, []);

  const findDuel = async () => {
    setStatus('creating');
    setError('');

    try {
      // Check if Multisynq SDK is available
      if (typeof window === 'undefined' || !window.Multisynq) {
        throw new Error('Multisynq SDK not loaded. Please check your internet connection.');
      }

      console.log('Creating Multisynq session...');
      
      // Show QR code widget for easy sharing
      window.Multisynq.App.makeWidgetDock();
      
      // Get API credentials from environment
      const apiKey = import.meta.env.VITE_MULTISYNQ_API_KEY;
      const appId = import.meta.env.VITE_MULTISYNQ_APP_ID;
      
      if (!apiKey || !appId) {
        throw new Error('Multisynq API key or App ID not configured');
      }

      // Create a unique session name for matchmaking
      const sessionName = `duel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Join Multisynq session with real Model and View
      const session = await window.Multisynq.Session.join({
        apiKey: apiKey,
        appId: appId,
        model: DuelModel,
        view: DuelView,
        name: sessionName,
        password: 'rocksynq2025', // You can make this dynamic
        autostart: false // Don't start game immediately
      });

      setSessionId(session.id);
      setStatus('waiting');

      console.log('Session created:', session.id);
      console.log('Waiting for players to join...');

      // Wait for at least 2 players before starting
      const checkForPlayers = () => {
        const playerCount = Object.keys(session.model.players || {}).length;
        console.log(`Current player count: ${playerCount}`);
        
        if (playerCount >= 2) {
          console.log('Starting game with 2 players!');
          // Start the game
          session.view.publish("duel", "startGame");
          onDuelStart(session, false); // false = not a bot match
        } else {
          // Check again in 2 seconds
          setTimeout(checkForPlayers, 2000);
        }
      };

      // Start checking for players after a short delay
      setTimeout(checkForPlayers, 1000);

    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(`Failed to create session: ${err.message}`);
      setStatus('idle');
    }
  };

  const playWithBot = async () => {
    setStatus('creating');
    setError('');

    try {
      // Check if Multisynq SDK is available
      if (typeof window === 'undefined' || !window.Multisynq) {
        throw new Error('Multisynq SDK not loaded. Please check your internet connection.');
      }

      console.log('Creating bot match session...');
      
      // Get API credentials from environment
      const apiKey = import.meta.env.VITE_MULTISYNQ_API_KEY;
      const appId = import.meta.env.VITE_MULTISYNQ_APP_ID;
      
      if (!apiKey || !appId) {
        throw new Error('Multisynq API key or App ID not configured');
      }

      // Create a unique session name for bot match
      const sessionName = `bot-duel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create session for human player
      const humanSession = await window.Multisynq.Session.join({
        apiKey: apiKey,
        appId: appId,
        model: DuelModel,
        view: DuelView,
        name: sessionName,
        password: 'rocksynq2025',
        autostart: false
      });

      console.log('Human session created:', humanSession.id);

      // Manually add a bot player to the model
      if (humanSession.model) {
        const botId = `bot-${Date.now()}`;
        humanSession.model.players[botId] = {
          score: 0,
          name: 'AI Bot'
        };
        humanSession.model.scores[botId] = 0;
        console.log('Bot player added:', botId);
      }

      // Start the bot match immediately
      setTimeout(() => {
        console.log('Starting bot match!');
        humanSession.view.publish("duel", "startGame");
        onDuelStart(humanSession, true); // true = bot match
      }, 1000);

    } catch (err: any) {
      console.error('Failed to create bot match:', err);
      setError(`Failed to create bot match: ${err.message}`);
      setStatus('idle');
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-5xl font-bold text-green-400 mb-8 animate-gentle-pulse font-game">Lobby</h1>
      
      {status === 'idle' && (
        <div>
          <div className="space-y-6 mb-8">
            <button
              onClick={findDuel}
              className="w-full btn-primary btn-green text-xl"
            >
              🤝 Play with a Friend
            </button>
            <button
              onClick={playWithBot}
              className="w-full btn-primary btn-blue text-xl"
            >
              🤖 Play with Bot
            </button>
          </div>
          <div className="text-sm text-gray-400 font-game bg-gray-700 p-6 rounded-lg border border-gray-600">
            <p className="mb-3">• <strong className="text-green-400">Play with a Friend:</strong> Share the session ID or QR code</p>
            <p>• <strong className="text-blue-400">Play with Bot:</strong> Instant single-player match</p>
          </div>
          {error && (
            <p className="text-red-500 mt-6 font-game">{error}</p>
          )}
        </div>
      )}

      {status === 'creating' && (
        <p className="text-yellow-400 font-game text-xl animate-gentle-pulse">Creating session...</p>
      )}

      {status === 'waiting' && (
        <div className="bg-gray-700 p-8 rounded-lg border border-blue-500">
          <p className="mb-6 text-blue-400 font-game text-xl animate-gentle-pulse">Waiting for an opponent...</p>
          <p className="text-sm text-gray-400 mb-3 font-game">Session ID:</p>
          <input
            type="text"
            readOnly
            value={sessionId}
            className="bg-gray-600 text-white text-center p-4 rounded-lg w-full cursor-pointer font-mono text-lg border-2 border-gray-500 hover:border-blue-400 transition-colors"
            onClick={(e) => e.currentTarget.select()}
          />
          <p className="text-xs text-gray-500 mt-4 font-game">
            Share this URL or scan the QR code to invite another player!
          </p>
          <p className="text-xs text-yellow-400 mt-2 font-game animate-gentle-pulse">
            Game will start automatically when 2 players join.
          </p>
        </div>
      )}
    </div>
  );
};

export default Lobby;