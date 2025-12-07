'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';
import sdk from '@farcaster/frame-sdk';
import LeaderboardTable, { type LeaderboardEntry } from '@/components/LeaderboardTable';
import Link from 'next/link';
import Image from 'next/image'; 
import { House, Trophy, User } from 'lucide-react'; 

type FrameContext = Awaited<typeof sdk.context>;

// Reward Percentages
const REWARDS = [0.35, 0.25, 0.20, 0.12, 0.08];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<FrameContext>();
  const [rewardPool, setRewardPool] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx); 
        sdk.actions.ready();

        const weekID = getCurrentWeekID();
        const campaignSnap = await getDoc(doc(db, 'campaigns', weekID));
        const pool = campaignSnap.exists() ? (campaignSnap.data().poolTotal || 0) : 0;
        setRewardPool(pool);

        const usersRef = collection(db, 'users');
        
        // FIX: Removed 'orderBy' and 'limit' to avoid Firestore Missing Index error.
        // We fetch all active users for this week and sort client-side.
        const q = query(
            usersRef, 
            where('lastActiveWeek', '==', weekID)
        );
        
        const querySnapshot = await getDocs(q);
        
        const allEntries: LeaderboardEntry[] = [];

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.weeklyScore > 0) {
            allEntries.push({
              fid: userData.fid,
              username: userData.username || 'Unknown',
              pfpUrl: userData.pfpUrl || '',
              score: userData.weeklyScore || 0,
              rank: 0, // Calculated below
              earnings: undefined
            });
          }
        });

        // Client-side Sort
        allEntries.sort((a, b) => b.score - a.score);

        // Take Top 20 and Assign Ranks/Earnings
        const top20 = allEntries.slice(0, 20).map((entry, index) => {
          const rank = index + 1;
          let earnings = 0;
          if (rank <= 5) {
             earnings = pool * REWARDS[rank - 1];
          }
          return { ...entry, rank, earnings: earnings > 0 ? earnings : undefined };
        });

        setEntries(top20);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-6 text-center pb-24 relative">
      <div className="w-full flex justify-start px-4 pt-6">
        <Link href="/"><div className="relative w-38 h-16"><Image src="/logo.png" alt="Logo" fill className="object-contain" priority /></div></Link>
      </div>

      <div className="mt-0">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-orange-500 drop-shadow-[0_2px_4px_rgba(255,215,0,0.3)]">
          WEEKLY RANKINGS
        </h1>
        <div className="bg-gray-900 text-yellow-400 px-4 py-1 rounded-full text-sm font-bold inline-block mt-2 border border-yellow-600">
            🏆 POOL: ${rewardPool.toFixed(2)}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[30vh] flex items-center text-green-700 dark:text-neon-green animate-pulse font-bold">
          LOADING SCORES...
        </div>
      ) : (
        <div className="w-full max-w-sm">
            <LeaderboardTable entries={entries} currentUserFid={context?.user?.fid} />
        </div>
      )}

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-console-grey/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-4 z-50 transition-colors">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <Link href="/" className="flex flex-col items-center gap-1 min-w-[60px] group">
            <House size={24} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Home</span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-1 min-w-[60px]">
            <Trophy size={24} className="text-green-700 dark:text-neon-green drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
            <span className="text-[10px] font-bold text-green-700 dark:text-neon-green">Rank</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 min-w-[60px] group">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-400 dark:border-gray-500 group-hover:border-gray-900 dark:group-hover:border-white transition-colors flex items-center justify-center bg-gray-100 dark:bg-gray-800">
               {context?.user?.pfpUrl ? (
                 <Image src={context.user.pfpUrl} alt="Me" width={24} height={24} className="w-full h-full object-cover" />
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