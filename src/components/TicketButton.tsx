'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  Transaction, 
  TransactionButton, 
  TransactionStatus, 
  TransactionStatusLabel, 
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import { type Address, type Hex, parseEther } from 'viem';
import { useAccount, useConnect, useDisconnect } from 'wagmi'; 
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TicketButtonProps {
  fid: number;
  livesToMint: number;
  ethPrice: string;
  onSuccess: () => void;
}

export default function TicketButton({ fid, livesToMint, ethPrice, onSuccess }: TicketButtonProps) {
  const { address, isConnected, status } = useAccount(); 
  const { connect, connectors } = useConnect(); 
  const { disconnect } = useDisconnect();
  
  const DEV_WALLET = process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS as Address;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const calls = useMemo(() => {
    if (!DEV_WALLET) return [];
    return [
      {
        to: DEV_WALLET,
        value: parseEther(ethPrice), 
        data: '0x' as Hex, 
      },
    ];
  }, [DEV_WALLET, ethPrice]);

  type OnchainSuccessResponse = {
    transactionReceipts?: Array<{ transactionHash?: string }>;
    transactionHash?: string;
    [key: string]: unknown;
  };

  const handleSuccess = async (response: OnchainSuccessResponse) => {
    console.log('Transaction successful:', response);
    const txHash = response?.transactionReceipts?.[0]?.transactionHash || 
                   response?.transactionHash || 'pending';

    const userRef = doc(db, 'users', fid.toString());
    const purchaseRef = doc(db, 'purchases', `${fid}_${Date.now()}`);

    try {
      // 1. Record the Purchase
      await setDoc(purchaseRef, {
        fid,
        lives: livesToMint,
        price: ethPrice,
        txHash,
        timestamp: serverTimestamp(),
      });

      // 2. Increment Lives in User Profile
      await setDoc(userRef, {
        lives: increment(livesToMint),
        lastPurchase: serverTimestamp()
      }, { merge: true });

      onSuccess();
    } catch (error) {
      console.error('Error crediting lives:', error);
    }
  };

  const handleError = (err: unknown) => {
    console.error("Transaction Error:", err);
  };

  const handleConnect = () => {
    const coinbase = connectors.find(c => c.id === 'coinbaseWalletSDK');
    const injected = connectors.find(c => c.id === 'injected');
    if (coinbase) connect({ connector: coinbase });
    else if (injected) connect({ connector: injected });
    else if (connectors.length > 0) connect({ connector: connectors[0] });
  };

  if (!isClient) return <div className="h-12 w-full bg-transparent"></div>;

  if (status === 'reconnecting' || status === 'connecting') {
    return (
      <div className="w-full text-center py-2 animate-pulse text-neon-green font-bold text-sm">
        Syncing...
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <button
        onClick={handleConnect}
        className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
      >
        Connect Wallet to Buy
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <Transaction
        chainId={8453} 
        calls={calls} 
        onError={handleError}
        onStatus={(status) => console.log('Tx Status:', status)}
        onSuccess={handleSuccess}
      >
        <TransactionButton 
          className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all disabled:opacity-50"
          text={`BUY ${livesToMint} LIVES (${ethPrice} ETH)`} 
        />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>
      
      <button onClick={() => disconnect()} className="text-[10px] text-gray-500 hover:text-red-400">
        Reset Connection
      </button>
    </div>
  );
}