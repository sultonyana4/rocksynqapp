import { useState } from 'react';
import WalletConnector from './components/WalletConnector';
import Lobby from './components/Lobby';
import DuelScreen from './components/DuelScreen';

type GameState = 'CONNECT' | 'LOBBY' | 'DUEL';

function App() {
  const [gameState, setGameState] = useState<GameState>('CONNECT');
  const [session, setSession] = useState<any>(null);
  const [isBotMatch, setIsBotMatch] = useState(false);

  const handleMintSuccess = () => {
    setGameState('LOBBY');
  };

  const handleDuelStart = (duelSession: any, isBot: boolean = false) => {
    setSession(duelSession);
    setIsBotMatch(isBot);
    setGameState('DUEL');
  };

  const handleBackToLobby = () => {
    setSession(null);
    setIsBotMatch(false);
    setGameState('LOBBY');
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 min-h-screen flex flex-col items-center justify-center text-white font-game">
      <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-12 shadow-2xl text-center max-w-2xl w-full mx-4 backdrop-blur-sm bg-opacity-95">
        {gameState === 'CONNECT' && (
          <>
            <h1 className="text-6xl font-bold text-purple-400 mb-8 animate-gentle-pulse">
              RockSynq
            </h1>
            <p className="text-gray-300 mb-8 text-lg">
              The foundation is ready.
            </p>
            <WalletConnector onMintSuccess={handleMintSuccess} />
          </>
        )}
        {gameState === 'LOBBY' && <Lobby onDuelStart={handleDuelStart} />}
        {gameState === 'DUEL' && session && (
          <DuelScreen session={session} onBackToLobby={handleBackToLobby} isBotMatch={isBotMatch} />
        )}
      </div>
    </div>
  );
}

export default App;