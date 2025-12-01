// 'use client';

// import { useMemo, useState, useEffect } from 'react';
// import { 
//   Transaction, 
//   TransactionButton, 
//   TransactionStatus, 
//   TransactionStatusLabel, 
//   TransactionStatusAction,
// } from '@coinbase/onchainkit/transaction';
// import { type Address, type Hex, parseEther } from 'viem';
// import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import { getCurrentWeekID } from '@/lib/utils';

// interface TicketButtonProps {
//   fid: number;
//   onTicketPurchased: () => void;
// }

// export default function TicketButton({ fid, onTicketPurchased }: TicketButtonProps) {
//   const DEV_WALLET = process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS as Address;
//   const [isClient, setIsClient] = useState(false);

//   // Prevent hydration errors by ensuring we only render on client
//   useEffect(() => {
//     const timer = setTimeout(() => setIsClient(true), 0);
//     return () => clearTimeout(timer);
//   }, []);

//   // Memoize calls to prevent button flickering
//   const calls = useMemo(() => {
//     if (!DEV_WALLET) return [];
//     return [
//       {
//         to: DEV_WALLET,
//         value: parseEther('0.00001'), 
//         data: '0x' as Hex, 
//       },
//     ];
//   }, [DEV_WALLET]);

//   type OnchainSuccessResponse = {
//     transactionReceipts?: Array<{ transactionHash?: string }>;
//     transactionHash?: string;
//     [key: string]: unknown;
//   };

//   const handleSuccess = async (response: OnchainSuccessResponse) => {
//     console.log('Transaction successful:', response);
    
//     const txHash = response?.transactionReceipts?.[0]?.transactionHash || 
//                    response?.transactionHash || 
//                    'pending';

//     const weekID = getCurrentWeekID();
//     const ticketDocID = `${fid}_${weekID}`;

//     try {
//       await setDoc(doc(db, 'tickets', ticketDocID), {
//         fid: fid,
//         week: weekID,
//         paid: true,
//         txHash: txHash,
//         timestamp: serverTimestamp(),
//       });
//       onTicketPurchased();
//     } catch (error) {
//       console.error('Error writing ticket to DB:', error);
//     }
//   };

//   const handleError = (err: unknown) => {
//     console.error("Transaction Error:", err);
//   };

//   // 0. Loading State
//   if (!isClient) return <div className="h-12 w-full bg-transparent"></div>;

//   // 1. Direct Transaction Button (No "Connect Wallet" step)
//   // OnchainKit will handle the connection prompt if needed when clicked.
//   return (
//     <div className="w-full max-w-xs mx-auto my-4">
//       <Transaction
//         chainId={8453} 
//         calls={calls} 
//         onError={handleError}
//         onStatus={(status) => console.log('Tx Status:', status)}
//         onSuccess={handleSuccess}
//       >
//         <TransactionButton 
//           className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//           text="MINT TICKET (0.00001 ETH)" 
//         />
//         <TransactionStatus>
//           <TransactionStatusLabel />
//           <TransactionStatusAction />
//         </TransactionStatus>
//       </Transaction>
      
//       <p className="text-xs text-gray-500 text-center mt-2">
//         Valid for Week: {getCurrentWeekID()}
//       </p>
//     </div>
//   );
// }

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
import { useAccount, useConnect } from 'wagmi'; // Added useConnect
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';

interface TicketButtonProps {
  fid: number;
  onTicketPurchased: () => void;
}

export default function TicketButton({ fid, onTicketPurchased }: TicketButtonProps) {
  const { isConnected } = useAccount(); 
  const { connect, connectors } = useConnect();
  
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
                   response?.transactionHash || 'pending';
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

  // Logic to force connection if disconnected
  const handleManualConnect = () => {
    // Prioritize Coinbase (Farcaster Native) or Injected
    const coinbase = connectors.find(c => c.id === 'coinbaseWalletSDK');
    const injected = connectors.find(c => c.id === 'injected');
    
    if (coinbase) connect({ connector: coinbase });
    else if (injected) connect({ connector: injected });
    else if (connectors.length > 0) connect({ connector: connectors[0] });
  };

  if (!isClient) return <div className="h-12 w-full bg-transparent"></div>;

  // --- 1. DISCONNECTED STATE: Show "Fake" Mint Button ---
  // This button looks exactly like the real one but triggers a connection first.
  // It bypasses the OnchainKit "Health Check" that is freezing your UI.
  if (!isConnected) {
    return (
      <div className="w-full max-w-xs mx-auto my-4">
        <button
          onClick={handleManualConnect}
          className="w-full bg-rush-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)] transition-all animate-pulse"
        >
          MINT TICKET (0.00001 ETH)
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Valid for Week: {getCurrentWeekID()}
        </p>
      </div>
    );
  }

  // --- 2. CONNECTED STATE: Show Real Transaction Button ---
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