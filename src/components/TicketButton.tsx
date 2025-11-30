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
import { useAccount, useConnect } from 'wagmi'; 
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';

interface TicketButtonProps {
  fid: number;
  onTicketPurchased: () => void;
}

export default function TicketButton({ fid, onTicketPurchased }: TicketButtonProps) {
  const { address, isConnected, status } = useAccount(); 
  const { connect, connectors } = useConnect(); 
  const DEV_WALLET = process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS as Address;
  const [isClient, setIsClient] = useState(false);

  // FIX 1: Use setTimeout to prevent "Synchronous setState" warning
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // FIX 2: REMOVED the auto-connect useEffect. 
  // It was causing "Aborted" errors by fighting with Wagmi's built-in auto-reconnect.

  const calls = useMemo(() => {
    if (!DEV_WALLET) return [];
    return [
      {
        to: DEV_WALLET,
        value: parseEther('0.00001'), 
        data: '0x' as Hex, 
      },
    ];
  }, [DEV_WALLET]);

  type OnchainSuccessResponse = {
    transactionReceipts?: Array<{ transactionHash?: string }>;
    transactionHash?: string;
    [key: string]: unknown;
  };

  const handleSuccess = async (response: OnchainSuccessResponse) => {
    console.log('Transaction successful:', response);
    
    const txHash = response?.transactionReceipts?.[0]?.transactionHash || 
                   response?.transactionHash || 
                   'pending';

    const weekID = getCurrentWeekID();
    const ticketDocID = `${fid}_${weekID}`;

    try {
      await setDoc(doc(db, 'tickets', ticketDocID), {
        fid: fid,
        week: weekID,
        paid: true,
        txHash: txHash,
        timestamp: serverTimestamp(),
      });
      onTicketPurchased();
    } catch (error) {
      console.error('Error writing ticket to DB:', error);
    }
  };

  const handleError = (err: unknown) => {
    console.error("Transaction Error:", err);
  };

  // Safe connect function that prioritizes Farcaster/Coinbase
  const handleConnect = () => {
    // 1. Try Injected (Farcaster Native)
    const injected = connectors.find(c => c.id === 'injected');
    if (injected) {
      connect({ connector: injected });
      return;
    }

    // 2. Try Coinbase SDK
    const coinbase = connectors.find(c => c.id === 'coinbaseWalletSDK');
    if (coinbase) {
      connect({ connector: coinbase });
      return;
    }

    // 3. Fallback
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  // --- RENDER STATES ---

  // 0. Prevent Server-Side Rendering Mismatch
  if (!isClient) return <div className="h-12 w-full bg-transparent"></div>;

  // 1. Loading/Reconnecting State
  if (status === 'reconnecting' || status === 'connecting') {
    return (
      <div className="w-full max-w-xs mx-auto my-4 text-center">
        <div className="animate-pulse bg-gray-800 text-neon-green py-3 px-6 rounded-lg font-bold text-sm">
          Syncing Wallet...
        </div>
      </div>
    );
  }

  // 2. Not Connected -> Show Manual Connect Button
  if (!isConnected || !address) {
    return (
      <div className="w-full max-w-xs mx-auto my-4">
        <button
          onClick={handleConnect}
          className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all"
        >
          Connect Wallet
        </button>
        {/* Helper text for debugging */}
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          Tap to link your Farcaster wallet
        </p>
      </div>
    );
  }

  // 3. Connected -> Show Mint Ticket Button
  return (
    <div className="w-full max-w-xs mx-auto my-4">
      <Transaction
        chainId={8453} 
        calls={calls} 
        onError={handleError}
        onStatus={(status) => console.log('Tx Status:', status)}
        onSuccess={handleSuccess}
      >
        <TransactionButton 
          className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          text="MINT TICKET (0.00001 ETH)" 
        />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>
      
      <p className="text-xs text-gray-500 text-center mt-2">
        Valid for Week: {getCurrentWeekID()}
      </p>
    </div>
  );
}