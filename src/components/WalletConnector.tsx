import React, { useState } from 'react';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import PetRockABI from '../abi/PetRock.json';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Define Monad Testnet chain configuration
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
} as const;

interface WalletConnectorProps {
  onMintSuccess: () => void;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ onMintSuccess }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<string>('');

  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask is not installed!');
      alert('Please install MetaMask to use this feature.');
      return;
    }

    try {
      const walletClient = createWalletClient({
        chain: monadTestnet,
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
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    setMintingStatus('Waiting for confirmation...');

    try {
      // Get contract address from environment variables
      const contractAddress = import.meta.env.VITE_PETROCK_CONTRACT_ADDRESS;
      
      if (!contractAddress) {
        throw new Error('Contract address not found in environment variables');
      }

      // Create wallet client for signing transactions
      const walletClient = createWalletClient({
        chain: monadTestnet,
        transport: custom(window.ethereum),
        account: account as `0x${string}`
      });

      // Create public client for reading from blockchain
      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http()
      });

      console.log('Calling safeMint on contract:', contractAddress);
      console.log('Minting to address:', account);

      // Call the safeMint function on the smart contract
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: PetRockABI,
        functionName: 'safeMint',
      });

      console.log('Transaction submitted with hash:', hash);
      setMintingStatus('Minting in progress...');

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log('Transaction confirmed:', receipt);
      
      if (receipt.status === 'success') {
        console.log('Mint successful!');
        setMintingStatus('');
        setIsMinting(false);
        onMintSuccess();
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('Minting failed:', error);
      setMintingStatus('');
      setIsMinting(false);
      
      // Handle specific error cases
      if (error.message?.includes('User rejected')) {
        alert('Transaction was rejected by user');
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient funds for transaction');
      } else {
        alert(`Minting failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <>
      {!account ? (
        <button
          onClick={connectWallet}
          className="btn-primary btn-blue animate-float"
        >
          🔗 Connect Wallet
        </button>
      ) : (
        <div className="text-center">
          <p className="mb-6 text-xl font-game">
            {`Connected: ${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
          </p>
          {mintingStatus && (
            <p className="mb-6 text-yellow-400 font-game text-lg animate-gentle-pulse">{mintingStatus}</p>
          )}
          <button
            onClick={handleMint}
            disabled={isMinting}
            className={`btn-primary ${isMinting ? 'bg-gray-500 cursor-not-allowed' : 'btn-purple animate-glow'}`}
          >
            {isMinting ? (mintingStatus || 'Minting...') : '🪨 Mint Your Pet Rock'}
          </button>
        </div>
      )}
    </>
  );
};

export default WalletConnector;
