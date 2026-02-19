'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import Navbar from '@/components/Navbar';
import ThemeToggle from '@/components/ThemeToggle';
import { ArrowLeftRight, Coins } from 'lucide-react';

export default function SwapPage() {
  const [context, setContext] = useState<Awaited<typeof sdk.context>>();

  useEffect(() => {
    const load = async () => {
      const ctx = await sdk.context;
      setContext(ctx);
      sdk.actions.ready();
    };
    load();
  }, []);

  return (
    <div className="w-full flex flex-col items-center min-h-[80vh] text-center pb-24 relative">
       <div className="absolute top-0 right-0 z-20"><ThemeToggle /></div>
       
       <div className="flex flex-col items-center justify-center flex-grow gap-6 mt-20">
          <div className="relative">
             <div className="absolute inset-0 bg-neon-green blur-2xl opacity-30 animate-pulse"></div>
             <ArrowLeftRight size={80} className="text-white relative z-10" />
          </div>
          
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            TOKEN SWAP
          </h1>
          
          <div className="bg-[#1E1E24] border border-gray-800 p-6 rounded-xl max-w-xs shadow-xl">
             <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                <Coins size={20} className="animate-spin-slow" />
                <span className="font-bold">COMING SOON</span>
             </div>
             <p className="text-gray-400 text-sm">
               The official SnakeRush trading terminal. 
               Trade tokens and swap your earnings directly within the frame.
             </p>
          </div>
       </div>

       <Navbar pfpUrl={context?.user?.pfpUrl} />
    </div>
  );
}