'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import Navbar from '@/components/Navbar';
import ThemeToggle from '@/components/ThemeToggle';
import { Palette, Hammer } from 'lucide-react';

export default function MintPage() {
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
             <div className="absolute inset-0 bg-rush-purple blur-2xl opacity-40 animate-pulse"></div>
             <Palette size={80} className="text-white relative z-10" />
          </div>
          
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rush-purple to-pink-500">
            MINT SKINS
          </h1>
          
          <div className="bg-[#1E1E24] border border-gray-800 p-6 rounded-xl max-w-xs shadow-xl">
             <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
                <Hammer size={20} className="animate-bounce" />
                <span className="font-bold">UNDER CONSTRUCTION</span>
             </div>
             <p className="text-gray-400 text-sm">
               Soon you will be able to mint exclusive snake skins as NFTs. 
               These skins will change your in-game snake color!
             </p>
          </div>
       </div>

       <Navbar pfpUrl={context?.user?.pfpUrl} />
    </div>
  );
}