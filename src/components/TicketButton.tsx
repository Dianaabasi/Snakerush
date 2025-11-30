'use client';

import { useMemo } from 'react';
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
  const { address, isConnected } = useAccount(); 
  const { connect, connectors } = useConnect(); 
  const DEV_WALLET = process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS as Address;

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

  const handleConnect = () => {
    // 1. Try to find the "Injected" connector (Farcaster Wallet)
    const injectedConnector = connectors.find((c) => c.id === 'injected');
    
    // 2. If found, connect. If not, fallback to the first available (Coinbase)
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  // --- STATE 1: WALLET NOT CONNECTED ---
  if (!isConnected || !address) {
    return (
      <div className="w-full max-w-xs mx-auto my-4">
        {/* We use a standard button here to trigger the Wagmi connection logic 
            instead of the OnchainKit UI which forces the external popup. */}
        <button
          onClick={handleConnect}
          className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // --- STATE 2: CONNECTED (SHOW MINT BUTTON) ---
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