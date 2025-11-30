'use client';

import { useMemo, useEffect } from 'react';
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

  // --- AUTO CONNECT LOGIC ---
  useEffect(() => {
    // If not connected and not currently trying to connect...
    if (!isConnected && status !== 'connecting' && status !== 'reconnecting') {
      
      // 1. Look for the 'injected' connector (Farcaster's internal wallet)
      const injectedConnector = connectors.find((c) => c.id === 'injected');
      
      // 2. If found, force connection immediately
      if (injectedConnector) {
        console.log("🔌 Auto-connecting to Farcaster Wallet...");
        connect({ connector: injectedConnector });
      }
    }
  }, [isConnected, status, connect, connectors]);

  // Memoize calls
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

  // --- RENDER STATES ---

  // 1. Loading/Connecting State
  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <div className="w-full max-w-xs mx-auto my-4 text-center">
        <div className="animate-pulse bg-gray-800 text-neon-green py-3 px-6 rounded-lg font-bold">
          Syncing Wallet...
        </div>
      </div>
    );
  }

  // 2. Still Not Connected (Fallback Manual Button)
  if (!isConnected || !address) {
    return (
      <div className="w-full max-w-xs mx-auto my-4">
        <button
          onClick={() => {
            const injected = connectors.find(c => c.id === 'injected');
            if (injected) connect({ connector: injected });
            else alert("No wallet found. Try opening in Warpcast.");
          }}
          className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all"
        >
          Connect Wallet
        </button>
        {/* Debug info regarding WebSocket error */}
        <p className="text-[10px] text-red-400 mt-2 text-center">
          If this doesn`t click, check Reown Dashboard Settings.
        </p>
      </div>
    );
  }

  // 3. Connected: Show Mint Button
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