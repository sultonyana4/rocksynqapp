import React, { useState } from 'react';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';

interface WalletConnectorProps {
  onMintSuccess: () => void;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ onMintSuccess }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask is not installed!');
      alert('Please install MetaMask to use this feature.');
      return;
    }

    try {
      const walletClient = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum)
      });

      const [address] = await walletClient.requestAddresses();
      setAccount(address);
      console.log('Wallet connected:', address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleMint = async () => {
    setIsMinting(true);
    console.log('Minting your pet rock...');
    // Simulate a delay for the minting process
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Mint successful!');
    setIsMinting(false);
    onMintSuccess();
  };

  return (
    <>
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="text-center">
          <p className="mb-4">
            {`Connected: ${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
          </p>
          <button
            onClick={handleMint}
            disabled={isMinting}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
          >
            {isMinting ? 'Minting...' : 'Mint Your Pet Rock'}
          </button>
        </div>
      )}
    </>
  );
};

export default WalletConnector;
