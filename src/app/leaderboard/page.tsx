'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import sdk from '@farcaster/frame-sdk';
import LeaderboardTable, { type LeaderboardEntry } from '@/components/LeaderboardTable';
import Link from 'next/link';
import Image from 'next/image';
import { House, Trophy, User } from 'lucide-react';

// Helper Type
type FrameContext = Awaited<typeof sdk.context>;

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
//   const [currentFid, setCurrentFid] = useState<number>();
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const loadData = async () => {
      // 1. Get Current User
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        sdk.actions.ready();
      } catch (err) {
        console.error("SDK Context Error:", err);
      }

      try {
        // 2. Query Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('weeklyScore', 'desc'), limit(20));
        
        const querySnapshot = await getDocs(q);
        const data: LeaderboardEntry[] = [];
        let rank = 1;

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Only list users with a score > 0
          if (userData.weeklyScore > 0) {
            data.push({
              fid: userData.fid,
              username: userData.username || 'Unknown',
              pfpUrl: userData.pfpUrl || '',
              score: userData.weeklyScore || 0,
              rank: rank++
            });
          }
        });

        setEntries(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-6 text-center pb-10">
      
      {/* HEADER: Logo Top Left */}
      <div className="w-full h-23 flex justify-start px-4 pt-6">
        <Link href="/">
          <div className="relative hover:scale-105 transition-transform cursor-pointer">
            <Image 
              src="/logo.png" 
              alt="SnakeRush Logo" 
              width={200}
              height={80}
              className="object-contain drop-shadow-[0_0_5px_rgba(138,43,226,0.6)]"
              priority 
            />
          </div>
        </Link>
      </div>

      <div className="mt-0">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-orange-500 drop-shadow-[0_2px_4px_rgba(255,215,0,0.3)]">
          WEEKLY RANKINGS
        </h1>
        <p className="text-gray-400 text-xs mt-1">Top players this week reset Sunday</p>
      </div>

      {loading ? (
        <div className="min-h-[30vh] flex items-center text-neon-green animate-pulse font-bold">
          LOADING SCORES...
        </div>
      ) : (
        <LeaderboardTable entries={entries} currentUserFid={context?.user?.fid} />
      )}

      <div className="flex gap-4 text-sm font-medium text-rush-purple">
        <Link href="/" className="hover:text-white transition-colors">
          ← Back to Home
        </Link>
        <Link href="/game" className="hover:text-white transition-colors">
          Play Now
        </Link>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-console-grey/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-4 z-50 transition-colors">
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