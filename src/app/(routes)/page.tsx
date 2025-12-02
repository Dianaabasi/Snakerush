'use client';

import { useEffect, useState, useCallback } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image'; 
import TicketButton from '@/components/TicketButton';
import { House, Trophy, User, Heart, X, ShoppingCart } from 'lucide-react'; 
import ThemeToggle from '@/components/ThemeToggle'; 

type FrameContext = Awaited<typeof sdk.context>;

// CONFIG: Price per 2 lives (1 ticket)
const UNIT_PRICE_ETH = 0.00001; 

export default function HomePage() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  
  const [lives, setLives] = useState(0);
  const [rewardPool, setRewardPool] = useState(0);
  
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  // FIX: selectedPackage is an index, so 0 is a valid number. We must check against null explicitly.
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  useEffect(() => {
    let unsubscribeUser: () => void;
    let unsubscribePool: () => void;

    const setupListeners = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        sdk.actions.ready();
        setIsSDKLoaded(true);

        if (ctx?.user?.fid) {
          unsubscribeUser = onSnapshot(doc(db, 'users', ctx.user.fid.toString()), (doc) => {
            setLives(doc.exists() ? (doc.data().lives || 0) : 0);
          });

          const weekID = getCurrentWeekID();
          unsubscribePool = onSnapshot(doc(db, 'campaigns', weekID), (doc) => {
            setRewardPool(doc.exists() ? (doc.data().poolTotal || 0) : 0);
          });
        }
      } catch (err) {
        console.error("SDK Init Error:", err);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribePool) unsubscribePool();
    };
  }, []);

  const packages = [
    { tickets: 1, lives: 2, price: UNIT_PRICE_ETH * 1 },
    { tickets: 2, lives: 4, price: UNIT_PRICE_ETH * 2 },
    { tickets: 3, lives: 6, price: UNIT_PRICE_ETH * 3 },
    { tickets: 4, lives: 8, price: UNIT_PRICE_ETH * 4 },
    { tickets: 5, lives: 10, price: UNIT_PRICE_ETH * 5 },
  ];

  // Helper to check if package is valid based on current lives
  // Rule: A user's total available lives cannot pass 10
  const canBuyPackage = (packageLives: number) => {
    return (lives + packageLives) <= 10;
  };

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
        
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-6 py-2 rounded-full font-black text-sm shadow-[0_0_15px_rgba(255,215,0,0.5)] flex items-center gap-2 mb-2">
          <Trophy size={16} />
          <span>POOL: ${rewardPool.toFixed(2)}</span>
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
          <li>🏆 Rank up <strong>Top 5 Weekly</strong></li>
          <li>💰 <strong>Earn</strong> % of the Reward Pool</li>
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
            // Disable only if they have absolutely no room for even the smallest package (2 lives)
            disabled={lives > 8}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2
              ${lives > 8 
                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                : 'bg-rush-purple hover:bg-purple-600 text-white shadow-lg'}`}
          >
            <ShoppingCart size={16} />
            {lives > 8 ? 'MAX LIVES' : 'BUY LIVES'}
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
              <p className="text-xs text-gray-400 mb-6">1 Ticket = 2 Lives ($1 value)</p>

              {/* FIX: Check explicitly for null, because index 0 (first package) is falsy in JS */}
              {selectedPackage === null ? (
                <div className="space-y-3">
                  {packages.map((pkg, idx) => {
                    const isBuyable = canBuyPackage(pkg.lives);
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
                          <span className="text-white text-lg font-black">{pkg.lives} Lives</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="bg-gray-900 px-3 py-1 rounded-lg text-neon-green font-mono mb-1">
                             {pkg.price.toFixed(5)}
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
                    <p className="text-3xl font-black text-white">{packages[selectedPackage].lives} Lives</p>
                    <p className="text-neon-green font-mono">{packages[selectedPackage].price.toFixed(5)} ETH</p>
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

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-console-grey/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-4 z-40 transition-colors">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <Link href="/" className="flex flex-col items-center gap-1 min-w-[60px]">
            <House size={24} className="text-green-700 dark:text-neon-green drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
            <span className="text-[10px] font-bold text-green-700 dark:text-neon-green">Home</span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-1 min-w-[60px] group">
            <Trophy size={24} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Rank</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 min-w-[60px] group">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-400 dark:border-gray-500 group-hover:border-gray-900 dark:group-hover:border-white transition-colors flex items-center justify-center bg-gray-100 dark:bg-gray-800">
               {context?.user?.pfpUrl ? (
                 <img src={context.user.pfpUrl} alt="Me" className="w-full h-full object-cover" />
               ) : (
                 <User size={16} className="text-gray-500 dark:text-gray-400" />
               )}
            </div>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}