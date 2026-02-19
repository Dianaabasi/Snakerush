'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { House, Trophy, Palette, ArrowLeftRight, User } from 'lucide-react';

interface NavbarProps {
  pfpUrl?: string;
}

export default function Navbar({ pfpUrl }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  // Helper to get consistent styles
  const getIconClass = (path: string) => 
    isActive(path) 
      ? "text-green-700 dark:text-neon-green drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" 
      : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors";

  const getTextClass = (path: string) => 
    isActive(path) 
      ? "text-green-700 dark:text-neon-green font-bold" 
      : "text-gray-400 font-bold group-hover:text-gray-900 dark:group-hover:text-white transition-colors";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-console-grey/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-4 z-50 transition-colors">
      <div className="max-w-md mx-auto flex justify-around items-center">
        
        {/* HOME */}
        <Link href="/" className="flex flex-col items-center gap-1 min-w-[50px] group">
          <House size={24} className={getIconClass('/')} />
          <span className={`text-[10px] ${getTextClass('/')}`}>Home</span>
        </Link>

        {/* RANK */}
        <Link href="/leaderboard" className="flex flex-col items-center gap-1 min-w-[50px] group">
          <Trophy size={24} className={getIconClass('/leaderboard')} />
          <span className={`text-[10px] ${getTextClass('/leaderboard')}`}>Rank</span>
        </Link>

        {/* MINT (New) */}
        <Link href="/mint" className="flex flex-col items-center gap-1 min-w-[50px] group">
          <Palette size={24} className={getIconClass('/mint')} />
          <span className={`text-[10px] ${getTextClass('/mint')}`}>Mint</span>
        </Link>

        {/* SWAP (New) */}
        <Link href="/swap" className="flex flex-col items-center gap-1 min-w-[50px] group">
          <ArrowLeftRight size={24} className={getIconClass('/swap')} />
          <span className={`text-[10px] ${getTextClass('/swap')}`}>Swap</span>
        </Link>

        {/* PROFILE */}
        <Link href="/profile" className="flex flex-col items-center gap-1 min-w-[50px] group">
          <div className={`w-6 h-6 rounded-full overflow-hidden border flex items-center justify-center bg-gray-100 dark:bg-gray-800 transition-colors
            ${isActive('/profile') 
              ? 'border-green-700 dark:border-neon-green shadow-[0_0_8px_rgba(57,255,20,0.5)]' 
              : 'border-gray-400 dark:border-gray-500 group-hover:border-gray-900 dark:group-hover:border-white'}`}
          >
             {pfpUrl ? (
               <Image src={pfpUrl} alt="Me" width={24} height={24} className="w-full h-full object-cover" />
             ) : (
               <User size={16} className="text-gray-500 dark:text-gray-400" />
             )}
          </div>
          <span className={`text-[10px] ${getTextClass('/profile')}`}>Profile</span>
        </Link>

      </div>
    </nav>
  );
}