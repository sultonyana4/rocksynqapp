import React, { useState, useEffect } from 'react';
import TrophyABI from '../abi/Trophy.json';
import { createWalletClient, custom } from 'viem';

// Extend window object for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
// Monad testnet config
const MONAD_RPC = 'https://testnet-rpc.monad.xyz';
const MONAD_CHAIN_ID = 10143;
const MONAD_CHAIN = {
  id: MONAD_CHAIN_ID,
  name: 'Monad Testnet',
  rpcUrls: { default: { http: [MONAD_RPC] } },
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
};

interface DuelScreenProps {
  session: any; // Multisynq session object with real model and view
  onBackToLobby?: () => void; // Optional callback to return to lobby
  isBotMatch?: boolean; // Whether this is a match against a bot
}

const DuelScreen: React.FC<DuelScreenProps> = ({ session, onBackToLobby, isBotMatch = false }) => {
  // Local state to force re-renders when session state changes
  const [, forceUpdate] = useState({});
  
  // State for button animation
  const [isShaking, setIsShaking] = useState(false);

  // Trophy claim status
  const [claimStatus, setClaimStatus] = useState<'idle'|'claiming'|'claimed'|'error'>("idle");
  const [claimError, setClaimError] = useState<string>("");
  
  useEffect(() => {
    console.log("DuelScreen mounted with session:", session);
    
    // Set up the view update callback to trigger React re-renders
    if (session?.view && typeof session.view.setUpdateCallback === 'function') {
      session.view.setUpdateCallback(() => {
        forceUpdate({});
      });
    }

    // If this is a bot match, set up bot automation
    let botInterval: number | null = null;
    
    if (isBotMatch) {
      // Wait for game to start before setting up bot automation
      const setupBotAutomation = () => {
        if (session?.model?.gameStarted && session?.model?.timeLeft > 0) {
          botInterval = setInterval(() => {
            // Only automate if game is still running
            if (session?.model?.timeLeft > 0 && !session?.model?.winner && session?.view) {
              try {
                // Find the bot player (not the current human player)
                const playerIds = Object.keys(session.model.scores || {});
                const humanPlayer = session.identity;
                const botPlayer = playerIds.find(id => id !== humanPlayer);
                
                if (botPlayer) {
                  // Make the bot click by publishing incrementScore for the bot player
                  console.log(`Bot ${botPlayer} is making a move`);
                  session.view.publish("duel", "incrementScore", { playerId: botPlayer });
                }
              } catch (error) {
                console.error('Bot automation error:', error);
              }
            } else {
              // Clear interval if game is over
              if (botInterval) {
                clearInterval(botInterval);
                botInterval = null;
              }
            }
          }, 1000 + Math.random() * 1000); // Random interval between 1-2 seconds
        } else {
          // Check again after a short delay if game hasn't started yet
          setTimeout(setupBotAutomation, 1000);
        }
      };

      // Start bot automation setup
      setupBotAutomation();
    }

    // Cleanup when component unmounts
    return () => {
      if (botInterval) {
        clearInterval(botInterval);
      }
      if (session?.view && typeof session.view.setUpdateCallback === 'function') {
        session.view.setUpdateCallback(undefined);
      }
    };
  }, [session, isBotMatch]);

  const handleStareClick = () => {
    if (session?.view && typeof session.view.handleStareClick === 'function') {
      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      
      session.view.handleStareClick();
    } else {
      console.error('Session view or handleStareClick method not available');
    }
  };

  const handleBackToLobby = () => {
    // Reset the game before going back
    if (session?.view && typeof session.view.resetGame === 'function') {
      session.view.resetGame();
    }
    
    if (onBackToLobby) {
      onBackToLobby();
    }
  };

  // Get game state from Multisynq model
  const model = session?.model;
  const timeLeft = model?.timeLeft || 60;
  const scores = model?.scores || {};
  const winner = model?.winner || null;
  const gameStarted = model?.gameStarted || false;

  // Get player data
  const playerIds = Object.keys(scores);
  const currentPlayer = session?.identity || playerIds[0] || 'player1';
  const trophyAddress = import.meta.env.VITE_TROPHY_CONTRACT_ADDRESS;
  const sessionId = session?.id;
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if game is over
  const isGameOver = winner !== null;

  // Claim Trophy NFT function
  const handleClaimTrophy = async () => {
    setClaimStatus('claiming');
    setClaimError("");
    try {
      // Get wallet client from window.ethereum
      if (!window.ethereum) throw new Error('Wallet not found');
      
      // Request account access first
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet account found');
      }
      const walletAddress = accounts[0];
      
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
        chain: MONAD_CHAIN,
      });
      
      console.log('Claiming trophy with:', {
        trophyAddress,
        winnerAddress: walletAddress,
        sessionId,
        walletAddress
      });
      
      // Call awardTrophy using walletClient.writeContract
      const txHash = await walletClient.writeContract({
        address: trophyAddress,
        abi: TrophyABI,
        functionName: 'awardTrophy',
        args: [walletAddress, sessionId], // Use wallet address instead of winner string
        account: walletAddress,
      });
      
      console.log('Trophy claim transaction:', txHash);
      setClaimStatus('claimed');
    } catch (err: any) {
      console.error('Trophy claim error:', err);
      setClaimStatus('error');
      setClaimError(err?.message || 'Error claiming trophy');
    }
  };

  return (
    <div className="text-center max-w-5xl mx-auto font-game">
      <h1 className="text-7xl font-bold text-red-500 mb-10 tracking-wider animate-gentle-pulse">
        DUEL ARENA
      </h1>
      
      {/* Timer Display */}
      <div className="mb-10 bg-gray-700 rounded-xl p-8 border-2 border-yellow-500">
        <div className="text-9xl font-mono font-bold text-yellow-400 mb-4 tracking-wider animate-float">
          {formatTime(timeLeft)}
        </div>
        <div className="text-xl text-gray-300 font-game">TIME REMAINING</div>
      </div>

      {/* Scores Display */}
      <div className="grid grid-cols-2 gap-10 mb-10">
        {playerIds.map((playerId) => (
          <div 
            key={playerId}
            className={`bg-gray-800 border-4 rounded-xl p-8 shadow-lg transform transition-all duration-300 ${
              playerId === currentPlayer 
                ? 'border-green-400 bg-gray-700 scale-105 shadow-green-400/50' 
                : 'border-gray-600 hover:border-purple-400'
            }`}
          >
            <div className="text-3xl font-bold text-gray-300 mb-4 font-game">
              {playerId === currentPlayer ? '👤 YOU' : '🤖 OPPONENT'}
            </div>
            <div className="text-8xl font-mono font-bold text-white mb-4 animate-gentle-pulse">
              {scores[playerId] || 0}
            </div>
            <div className="text-sm text-gray-400 truncate font-game">
              {playerId.length > 12 ? `${playerId.substring(0, 8)}...` : playerId}
            </div>
          </div>
        ))}
      </div>

      {/* Game Action or Game Over */}
      {!isGameOver ? (
        <div className="mb-10">
          <button
            onClick={handleStareClick}
            disabled={timeLeft <= 0 || !gameStarted}
            className={`text-9xl font-bold py-10 px-20 rounded-3xl border-4 transition-all duration-200 font-game shadow-2xl ${
              timeLeft > 0 && gameStarted
                ? `bg-red-600 hover:bg-red-700 border-red-400 text-white hover:shadow-red-500/50 transform hover:scale-110 active:scale-95 ${isShaking ? 'animate-shake' : ''}`
                : 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
            }`}
          >
            {!gameStarted ? '⏳ WAITING...' : (timeLeft <= 0 ? '⏰ TIME UP!' : '👁️ STARE!')}
          </button>
          <div className="text-xl text-gray-400 mt-6 font-game">
            {gameStarted ? '👆 Click to increase your score!' : '⏳ Waiting for game to start...'}
          </div>
        </div>
      ) : (
        <div className="mb-10 bg-gray-700 rounded-xl p-8 border-2 border-yellow-500">
          <div className="text-7xl font-bold text-yellow-400 mb-6 animate-gentle-pulse font-game">
            🏁 GAME OVER
          </div>
          {winner === 'TIE' ? (
            <div className="text-5xl font-bold text-blue-400 font-game">
              🤝 IT'S A TIE!
            </div>
          ) : (
            <div className="text-5xl font-bold text-green-400 font-game">
              {winner === currentPlayer ? '🏆 YOU WIN!' : '💀 YOU LOSE!'}
            </div>
          )}
          <div className="text-2xl text-gray-400 mt-6 font-game">
            Final Score: {Object.entries(scores).map(([id, score]) => `${id.substring(0, 8)}: ${score}`).join(' | ')}
          </div>
          {/* Trophy Claim Button for Winner */}
          {winner === currentPlayer && winner !== 'TIE' && (
            <div className="mt-8">
              <button
                onClick={handleClaimTrophy}
                disabled={claimStatus === 'claiming' || claimStatus === 'claimed'}
                className={`btn-primary font-game text-2xl ${
                  claimStatus === 'claiming' || claimStatus === 'claimed'
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'btn-yellow animate-glow'
                }`}
              >
                {claimStatus === 'claiming' ? '⏳ Claiming...' : claimStatus === 'claimed' ? '✅ Trophy Claimed!' : '🏆 Claim Your Trophy'}
              </button>
              {claimStatus === 'error' && (
                <div className="text-red-500 mt-4 text-lg max-w-md mx-auto font-game bg-red-900/30 p-4 rounded-lg border border-red-500">
                  <strong>Error:</strong> {claimError}
                </div>
              )}
              {claimStatus === 'claimed' && (
                <div className="text-green-500 mt-4 font-game text-lg animate-gentle-pulse">✨ Check your wallet or view on Monad Explorer!</div>
              )}
              <div className="text-xs text-gray-500 mt-4 font-mono bg-gray-800 p-2 rounded">
                Debug: Winner={winner}, CurrentPlayer={currentPlayer}, TrophyAddr={trophyAddress}, SessionId={sessionId}
              </div>
            </div>
          )}
          {onBackToLobby && (
            <button
              onClick={handleBackToLobby}
              className="mt-8 btn-primary btn-blue text-xl"
            >
              🏠 Back to Lobby
            </button>
          )}
        </div>
      )}

      {/* Game Status */}
      <div className="text-lg text-gray-500 font-game bg-gray-800 p-4 rounded-lg border border-gray-600">
        {isGameOver 
          ? '🎯 Game completed' 
          : gameStarted 
            ? (timeLeft > 0 ? '⚡ Game in progress...' : '⏰ Time\'s up!')
            : '⏳ Waiting for game to start...'
        }
      </div>
    </div>
  );
};

export default DuelScreen;
