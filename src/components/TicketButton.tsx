'use client';

import { 
  Transaction, 
  TransactionButton, 
  TransactionStatus, 
  TransactionStatusLabel, 
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { type Address, type Hex, parseEther } from 'viem';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';

interface TicketButtonProps {
  fid: number;
  onTicketPurchased: () => void;
}

export default function TicketButton({ fid, onTicketPurchased }: TicketButtonProps) {
  const { address } = useAccount(); // Hook to check if wallet is connected
  const DEV_WALLET = process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS as Address;
  
  // Debug: Ensure wallet address is loaded from Env
  if (!DEV_WALLET) {
    console.error("DEV_WALLET address is missing in Environment Variables");
    return <div className="text-red-500 text-xs text-center font-bold">⚠️ Config Error: No Wallet</div>;
  }

  // Define calls array (Price: 0.00001 ETH)
  const calls = [
    {
      to: DEV_WALLET,
      value: parseEther('0.00001'), 
      data: '0x' as Hex, 
    },
  ];

  type OnchainSuccessResponse = {
    transactionReceipts?: Array<{ transactionHash?: string }>;
    transactionHash?: string;
    [key: string]: unknown;
  };

  const handleSuccess = async (response: OnchainSuccessResponse) => {
    console.log('Transaction successful:', response);
    
    // OnchainKit responses vary by version, checking both common paths safely
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
    console.error("Transaction/Wallet Error:", err);
  };

  // 1. If wallet is NOT connected, show Connect Button
  if (!address) {
    return (
      <div className="w-full max-w-xs mx-auto my-4">
        <Wallet>
          <ConnectWallet 
            className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all"
          >
            <span className="font-bold">Connect Wallet to Play</span>
          </ConnectWallet>
        </Wallet>
        <p className="text-xs text-gray-500 text-center mt-2">
          Connect your wallet to mint a ticket
        </p>
      </div>
    );
  }

  // 2. If connected, show Transaction Button (Handles Chain Switch automatically via chainId)
  return (
    <div className="w-full max-w-xs mx-auto my-4">
      <Transaction
        chainId={8453} // Enforces Base Mainnet. Triggers "Switch Chain" if on wrong network.
        calls={calls} 
        onError={handleError}
        onStatus={(status) => console.log('Tx Status:', status)}
        onSuccess={handleSuccess}
      >
        <TransactionButton 
          className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all"
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