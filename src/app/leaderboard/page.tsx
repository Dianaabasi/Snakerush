'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';
import sdk from '@farcaster/frame-sdk';
import LeaderboardTable, { type LeaderboardEntry } from '@/components/LeaderboardTable';
import Link from 'next/link';
import Image from 'next/image'; 
import Navbar from '@/components/Navbar';

type FrameContext = Awaited<typeof sdk.context>;

// FIXED POOL
const FIXED_POOL_SRP = 50000;

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<FrameContext>();
  // const [rewardPool, setRewardPool] = useState(0); 

  useEffect(() => {
    const loadData = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx); 
        sdk.actions.ready();

        const weekID = getCurrentWeekID();
        // Removed dynamic pool fetching, using FIXED_POOL_SRP

        const usersRef = collection(db, 'users');
        
        // Fetch all active users for the current week
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
              rank: 0, 
              earnings: undefined
            });
          }
        });

        // Client-side Sort
        allEntries.sort((a, b) => b.score - a.score);

        // 1. Determine Top 100
        const top100 = allEntries.slice(0, 100);
        
        // 2. Calculate Total Score of Top 100
        const totalTop100Score = top100.reduce((acc, curr) => acc + curr.score, 0);

        // 3. Assign Ranks and Calculate Points Share
        const rankedEntries = top100.map((entry, index) => {
          const rank = index + 1;
          
          let estimatedSRP = 0;
          if (totalTop100Score > 0) {
            estimatedSRP = (entry.score / totalTop100Score) * FIXED_POOL_SRP;
          }

          return { 
            ...entry, 
            rank, 
            earnings: estimatedSRP > 0 ? estimatedSRP : undefined 
          };
        });

        setEntries(rankedEntries);
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
            🏆 POOL: 50,000 SRP
        </div>
      </div>

      {loading ? (
        <div className="min-h-[30vh] flex items-center text-green-700 dark:text-neon-green animate-pulse font-bold">
          LOADING SCORES...
        </div>
      ) : (
        <div className="w-full max-w-sm">
            <LeaderboardTable entries={entries} currentUserFid={context?.user?.fid} />
            <p className="text-xs text-gray-500 mt-4">Only Top 100 players share the prize pool.</p>
        </div>
      )}

      <Navbar pfpUrl={context?.user?.pfpUrl} />

    </div>
  );
}