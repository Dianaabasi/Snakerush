// 'use client';

// import { useEffect, useState } from 'react';
// import sdk from '@farcaster/frame-sdk';
// import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
// import { db } from '@/lib/firebase';
// import { getCurrentWeekID } from '@/lib/utils';
// import Link from 'next/link';
// import Image from 'next/image'; 
// import TicketButton from '@/components/TicketButton';
// import { House, Trophy, User, Heart, X, ShoppingCart } from 'lucide-react'; 
// import ThemeToggle from '@/components/ThemeToggle'; 

// type FrameContext = Awaited<typeof sdk.context>;

// const UNIT_PRICE_ETH1 = 0.00035; 
// const UNIT_PRICE_ETH2 = 0.00068; 
// const UNIT_PRICE_ETH3 = 0.0010; 
// const UNIT_PRICE_ETH4 = 0.0013; 
// const UNIT_PRICE_ETH5 = 0.0016; 

// export default function HomePage() {
//   const [isSDKLoaded, setIsSDKLoaded] = useState(false);
//   const [context, setContext] = useState<FrameContext>();
  
//   const [lives, setLives] = useState(0);
//   const [rewardPool, setRewardPool] = useState(0);
  
//   const [isStoreOpen, setIsStoreOpen] = useState(false);
//   const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

//   useEffect(() => {
//     let unsubscribeUser: () => void;
//     let unsubscribePool: () => void;

//     const setupListeners = async () => {
//       try {
//         const ctx = await sdk.context;
//         setContext(ctx);
//         sdk.actions.ready();
//         setIsSDKLoaded(true);

//         if (ctx?.user?.fid) {
//           const userRef = doc(db, 'users', ctx.user.fid.toString());
//           await setDoc(userRef, {
//             fid: ctx.user.fid,
//             username: ctx.user.username || `fid:${ctx.user.fid}`,
//             displayName: ctx.user.displayName || '',
//             pfpUrl: ctx.user.pfpUrl || '',
//           }, { merge: true });

//           unsubscribeUser = onSnapshot(userRef, (doc) => {
//             setLives(doc.exists() ? (doc.data().lives || 0) : 0);
//           });

//           const weekID = getCurrentWeekID();
//           unsubscribePool = onSnapshot(doc(db, 'campaigns', weekID), (doc) => {
//             setRewardPool(doc.exists() ? (doc.data().poolTotal || 0) : 0);
//           });
//         }
//       } catch (err) {
//         console.error("SDK Init Error:", err);
//       }
//     };

//     setupListeners();

//     return () => {
//       if (unsubscribeUser) unsubscribeUser();
//       if (unsubscribePool) unsubscribePool();
//     };
//   }, []);

//   const packages = [
//     { tickets: 1, lives: 1, displayLives: 2, price: UNIT_PRICE_ETH1 },
//     { tickets: 2, lives: 2, displayLives: 4, price: UNIT_PRICE_ETH2 },
//     { tickets: 3, lives: 3, displayLives: 6, price: UNIT_PRICE_ETH3 },
//     { tickets: 4, lives: 4, displayLives: 8, price: UNIT_PRICE_ETH4 },
//     { tickets: 5, lives: 5, displayLives: 10, price: UNIT_PRICE_ETH5 },
//   ];

//   const canBuyPackage = (packageDisplayLives: number) => {
//     return (lives + packageDisplayLives) <= 10;
//   };

//   const isStoreDisabled = lives >= 9;

//   if (!isSDKLoaded) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh] text-green-700 dark:text-neon-green animate-pulse">
//         <div className="text-2xl font-bold">LOADING SNAKERUSH...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full flex flex-col items-center gap-6 text-center pb-24 relative">
//       <div className="absolute top-0 right-0 z-20"><ThemeToggle /></div>

//       <div className="mt-8 mb-2 flex flex-col items-center">
//         <div className="relative w-80 h-32">
//           <Image src="/logo.png" alt="SnakeRush Logo" fill className="object-contain drop-shadow-[0_0_15px_rgba(138,43,226,0.6)]" priority />
//         </div>
        
//         <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-6 py-2 rounded-full font-black text-sm shadow-[0_0_15px_rgba(255,215,0,0.5)] flex items-center gap-2 mb-2">
//           <Trophy size={16} />
//           <span>POOL: ${rewardPool.toFixed(2)}</span>
//         </div>

//         <p className="text-gray-600 dark:text-gray-400 text-xs font-mono font-bold">
//           Weekly Campaign: <span className="ml-1 text-green-800 dark:text-neon-green">{getCurrentWeekID()}</span>
//         </p>
//       </div>

//       <div className="bg-[#1E1E24] p-6 rounded-xl border border-gray-800 w-full max-w-sm shadow-lg text-left">
//         <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">How to Play</h2>
//         <ul className="text-sm text-gray-300 space-y-2 list-none font-medium">
//           <li>🎫 <strong>Buy Tickets</strong> to get Lives</li>
//           <li>🕹️ <strong>Join Game</strong> (Costs 1 Life)</li>
//           <li>📅 Get highest score for the <strong>Day</strong></li>
//           <li>🏆 Rank up <strong>Top 5 Weekly</strong></li>
//           <li>💰 <strong>Earn</strong> % of the Reward Pool</li>
//         </ul>
//       </div>

//       <div className="w-full max-w-sm flex flex-col gap-4">
        
//         <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-800 p-3 rounded-xl border border-gray-300 dark:border-gray-700">
//           <div className="flex items-center gap-2 text-red-600 dark:text-danger-red font-black">
//             <Heart fill="currentColor" />
//             <span className="text-xl">{lives} / 10</span>
//           </div>
          
//           <button 
//             onClick={() => setIsStoreOpen(true)}
//             disabled={isStoreDisabled}
//             className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2
//               ${isStoreDisabled 
//                 ? 'bg-gray-400 cursor-not-allowed opacity-50' 
//                 : 'bg-rush-purple hover:bg-purple-600 text-white shadow-lg'}`}
//           >
//             <ShoppingCart size={16} />
//             {lives >= 10 ? 'MAX LIVES' : 'BUY LIVES'}
//           </button>
//         </div>

//         {lives > 0 ? (
//           <Link href="/game" className="block w-full">
//             <button className="w-full bg-green-700 dark:bg-neon-green hover:bg-green-800 dark:hover:bg-green-400 text-white dark:text-black font-black text-xl py-4 rounded-xl shadow-lg dark:shadow-[0_0_20px_rgba(57,255,20,0.6)] transform hover:scale-105 transition-all">
//               START GAME (-1 LIFE)
//             </button>
//           </Link>
//         ) : (
//           <button onClick={() => setIsStoreOpen(true)} className="w-full bg-gray-500 text-white font-bold py-4 rounded-xl shadow-lg">
//             NO LIVES - BUY NOW
//           </button>
//         )}
//       </div>

//       {isStoreOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
//           <div className="bg-[#1E1E24] border-2 border-rush-purple rounded-2xl w-full max-w-sm overflow-hidden relative">
//             <button 
//               onClick={() => { setIsStoreOpen(false); setSelectedPackage(null); }}
//               className="absolute top-4 right-4 text-gray-400 hover:text-white"
//             >
//               <X size={24} />
//             </button>
            
//             <div className="p-6">
//               <h2 className="text-2xl font-black text-white mb-1">TICKET STORE</h2>
//               <p className="text-xs text-gray-400 mb-6">1 Ticket = 2 Lives</p>

//               {selectedPackage === null ? (
//                 <div className="space-y-3">
//                   {packages.map((pkg, idx) => {
//                     const isBuyable = canBuyPackage(pkg.displayLives);
//                     return (
//                       <button
//                         key={idx}
//                         onClick={() => isBuyable && setSelectedPackage(idx)}
//                         disabled={!isBuyable}
//                         className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all
//                           ${isBuyable 
//                             ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 cursor-pointer' 
//                             : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'}`}
//                       >
//                         <div className="flex flex-col items-start">
//                           <span className="text-rush-purple font-bold">{pkg.tickets} Ticket{pkg.tickets > 1 ? 's' : ''}</span>
//                           <span className="text-white text-lg font-black">{pkg.displayLives} Lives</span>
//                         </div>
//                         <div className="flex flex-col items-end">
//                            <span className="bg-gray-900 px-3 py-1 rounded-lg text-neon-green font-mono mb-1">
//                              {pkg.price.toFixed(5)} ETH
//                            </span>
//                            {!isBuyable && <span className="text-[10px] text-red-500 font-bold">Max Limit</span>}
//                         </div>
//                       </button>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <div className="animate-fade-in">
//                   <div className="text-center mb-4">
//                     <p className="text-gray-400">Buying</p>
//                     <p className="text-3xl font-black text-white">{packages[selectedPackage].displayLives} Lives</p>
//                     <p className="text-neon-green font-mono">{packages[selectedPackage].price.toFixed(5)} ETH</p>
//                   </div>
                  
//                   {context?.user?.fid && (
//                     <TicketButton 
//                       fid={context.user.fid}
//                       livesToMint={packages[selectedPackage].lives}
//                       ethPrice={packages[selectedPackage].price.toString()}
//                       onSuccess={() => {
//                         setIsStoreOpen(false);
//                         setSelectedPackage(null);
//                       }}
//                     />
//                   )}
                  
//                   <button 
//                     onClick={() => setSelectedPackage(null)}
//                     className="w-full mt-4 text-sm text-gray-500 hover:text-white underline"
//                   >
//                     Back to Packages
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* NAVBAR */}
//       <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-console-grey/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-4 z-40 transition-colors">
//         <div className="max-w-md mx-auto flex justify-around items-center">
//           <Link href="/" className="flex flex-col items-center gap-1 min-w-[60px]">
//             <House size={24} className="text-green-700 dark:text-neon-green drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
//             <span className="text-[10px] font-bold text-green-700 dark:text-neon-green">Home</span>
//           </Link>
//           <Link href="/leaderboard" className="flex flex-col items-center gap-1 min-w-[60px] group">
//             <Trophy size={24} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
//             <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Rank</span>
//           </Link>
//           <Link href="/profile" className="flex flex-col items-center gap-1 min-w-[60px] group">
//             <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-400 dark:border-gray-500 group-hover:border-gray-900 dark:group-hover:border-white transition-colors flex items-center justify-center bg-gray-100 dark:bg-gray-800">
//                {context?.user?.pfpUrl ? (
//                  <Image src={context.user.pfpUrl} alt="Me" width={24} height={24} className="w-full h-full object-cover" />
//                ) : (
//                  <User size={16} className="text-gray-500 dark:text-gray-400" />
//                )}
//             </div>
//             <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Profile</span>
//           </Link>
//         </div>
//       </nav>
      
//       <p className="mt-8 mb-20 font-bold text-gray-500 text-sm">Built on base ⬜</p>
//     </div>
//   );
// }

// USDC payment version
'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image'; 
import TicketButton from '@/components/TicketButton';
import { House, Trophy, User, Heart, X, ShoppingCart } from 'lucide-react'; 
import ThemeToggle from '@/components/ThemeToggle'; 
import { useAccount } from 'wagmi'; 
import Navbar from '@/components/Navbar';

type FrameContext = Awaited<typeof sdk.context>;

// CONFIG: Prices in USDC
const UNIT_PRICE_USDC1 = 0.198; 
const UNIT_PRICE_USDC2 = 0.396; 
const UNIT_PRICE_USDC3 = 0.594; 
const UNIT_PRICE_USDC4 = 0.792; 
const UNIT_PRICE_USDC5 = 0.99; 

export default function HomePage() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  const { address } = useAccount(); 
  
  const [lives, setLives] = useState(0);
  // const [rewardPool, setRewardPool] = useState(0); // Removed dynamic pool
  
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  useEffect(() => {
    let unsubscribeUser: () => void;

    const setupListeners = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        sdk.actions.ready();
        setIsSDKLoaded(true);

        if (ctx?.user?.fid) {
          const userRef = doc(db, 'users', ctx.user.fid.toString());
          
          await setDoc(userRef, {
            fid: ctx.user.fid,
            username: ctx.user.username || `fid:${ctx.user.fid}`,
            displayName: ctx.user.displayName || '',
            pfpUrl: ctx.user.pfpUrl || '',
            ...(address && { walletAddress: address }), 
          }, { merge: true });

          unsubscribeUser = onSnapshot(userRef, (doc) => {
            setLives(doc.exists() ? (doc.data().lives || 0) : 0);
          });
        }
      } catch (err) {
        console.error("SDK Init Error:", err);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [address]); 

  const packages = [
    { tickets: 1, lives: 1, displayLives: 2, price: UNIT_PRICE_USDC1 },
    { tickets: 2, lives: 2, displayLives: 4, price: UNIT_PRICE_USDC2 },
    { tickets: 3, lives: 3, displayLives: 6, price: UNIT_PRICE_USDC3 },
    { tickets: 4, lives: 4, displayLives: 8, price: UNIT_PRICE_USDC4 },
    { tickets: 5, lives: 5, displayLives: 10, price: UNIT_PRICE_USDC5 },
  ];

  const canBuyPackage = (packageDisplayLives: number) => {
    return (lives + packageDisplayLives) <= 10;
  };

  const isStoreDisabled = lives >= 9;

  if (!isSDKLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-green-700 dark:text-neon-green animate-pulse">
        <div className="text-2xl font-bold">LOADING SNAKERUSH...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6 text-center pb-24 relative">
      <div className="absolute top-0 right-0 z-20"><ThemeToggle /></div>

      <div className="mt-8 mb-2 flex flex-col items-center">
        <div className="relative w-80 h-32">
          <Image src="/logo.png" alt="SnakeRush Logo" fill className="object-contain drop-shadow-[0_0_15px_rgba(138,43,226,0.6)]" priority />
        </div>
        
        {/* FIXED POOL DISPLAY */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-6 py-2 rounded-full font-black text-sm shadow-[0_0_15px_rgba(255,215,0,0.5)] flex items-center gap-2 mb-2">
          <Trophy size={16} />
          <span>POOL: 50,000 SRP</span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-xs font-mono font-bold">
          Weekly Campaign: <span className="ml-1 text-green-800 dark:text-neon-green">{getCurrentWeekID()}</span>
        </p>
      </div>

      <div className="bg-[#1E1E24] p-6 rounded-xl border border-gray-800 w-full max-w-sm shadow-lg text-left">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">How to Play</h2>
        <ul className="text-sm text-gray-300 space-y-2 list-none font-medium">
          <li>🎫 <strong>Buy Tickets</strong> to get Lives</li>
          <li>🕹️ <strong>Join Game</strong> (Costs 1 Life)</li>
          <li>📅 Get highest score for the <strong>Day</strong></li>
          <li>🏆 Rank up <strong>Top 100 Weekly</strong></li>
          <li>💰 <strong>Earn</strong> Share of SRP Pool</li>
        </ul>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        
        <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-800 p-3 rounded-xl border border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2 text-red-600 dark:text-danger-red font-black">
            <Heart fill="currentColor" />
            <span className="text-xl">{lives} / 10</span>
          </div>
          
          <button 
            onClick={() => setIsStoreOpen(true)}
            disabled={isStoreDisabled}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2
              ${isStoreDisabled 
                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                : 'bg-rush-purple hover:bg-purple-600 text-white shadow-lg'}`}
          >
            <ShoppingCart size={16} />
            {lives >= 10 ? 'MAX LIVES' : 'BUY LIVES'}
          </button>
        </div>

        {lives > 0 ? (
          <Link href="/game" className="block w-full">
            <button className="w-full bg-green-700 dark:bg-neon-green hover:bg-green-800 dark:hover:bg-green-400 text-white dark:text-black font-black text-xl py-4 rounded-xl shadow-lg dark:shadow-[0_0_20px_rgba(57,255,20,0.6)] transform hover:scale-105 transition-all">
              START GAME (-1 LIFE)
            </button>
          </Link>
        ) : (
          <button onClick={() => setIsStoreOpen(true)} className="w-full bg-gray-500 text-white font-bold py-4 rounded-xl shadow-lg">
            NO LIVES - BUY NOW
          </button>
        )}
      </div>

      {isStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1E1E24] border-2 border-rush-purple rounded-2xl w-full max-w-sm overflow-hidden relative">
            <button 
              onClick={() => { setIsStoreOpen(false); setSelectedPackage(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <div className="p-6">
              <h2 className="text-2xl font-black text-white mb-1">TICKET STORE</h2>
              <p className="text-xs text-gray-400 mb-6">1 Ticket = 2 Lives</p>

              {selectedPackage === null ? (
                <div className="space-y-3">
                  {packages.map((pkg, idx) => {
                    const isBuyable = canBuyPackage(pkg.displayLives);
                    return (
                      <button
                        key={idx}
                        onClick={() => isBuyable && setSelectedPackage(idx)}
                        disabled={!isBuyable}
                        className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all
                          ${isBuyable 
                            ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 cursor-pointer' 
                            : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'}`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-rush-purple font-bold">{pkg.tickets} Ticket{pkg.tickets > 1 ? 's' : ''}</span>
                          <span className="text-white text-lg font-black">{pkg.displayLives} Lives</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="bg-gray-900 px-3 py-1 rounded-lg text-neon-green font-mono mb-1">
                             {pkg.price.toFixed(2)} USDC
                           </span>
                           {!isBuyable && <span className="text-[10px] text-red-500 font-bold">Max Limit</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="text-center mb-4">
                    <p className="text-gray-400">Buying</p>
                    <p className="text-3xl font-black text-white">{packages[selectedPackage].displayLives} Lives</p>
                    <p className="text-neon-green font-mono">{packages[selectedPackage].price.toFixed(2)} USDC</p>
                  </div>
                  
                  {context?.user?.fid && (
                    <TicketButton 
                      fid={context.user.fid}
                      livesToMint={packages[selectedPackage].lives}
                      ethPrice={packages[selectedPackage].price.toString()}
                      onSuccess={() => {
                        setIsStoreOpen(false);
                        setSelectedPackage(null);
                      }}
                    />
                  )}
                  
                  <button 
                    onClick={() => setSelectedPackage(null)}
                    className="w-full mt-4 text-sm text-gray-500 hover:text-white underline"
                  >
                    Back to Packages
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Navbar pfpUrl={context?.user?.pfpUrl} />
      
      <p className="mt-8 mb-20 font-bold text-gray-500 text-sm">Built on base ⬜</p>
    </div>
  );
}