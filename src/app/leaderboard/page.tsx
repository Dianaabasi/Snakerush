'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, limit, doc, getDoc } from 'firebase/firestore';
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

        // 1. Get Reward Pool
        const weekID = getCurrentWeekID();
        const campaignSnap = await getDoc(doc(db, 'campaigns', weekID));
        if (campaignSnap.exists()) {
            setRewardPool(campaignSnap.data().poolTotal || 0);
        }

        // 2. Query Firestore for Leaderboard
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('weeklyScore', 'desc'), limit(20));
        
        const querySnapshot = await getDocs(q);
        const data: LeaderboardEntry[] = [];
        let rank = 1;

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
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
    <div className="w-full flex flex-col items-center gap-6 text-center pb-24 relative">
      
      {/* HEADER */}
      <div className="w-full flex justify-start px-4 pt-6">
        <Link href="/"><div className="relative w-32 h-10"><Image src="/logo.png" alt="Logo" fill className="object-contain" priority /></div></Link>
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
            {/* INJECT EARNINGS INTO TABLE DISPLAY if you modify table, or just show list here */}
            {/* For now, reusing existing table but users can infer earnings */}
            <LeaderboardTable entries={entries} currentUserFid={context?.user?.fid} />
            
            {/* EARNINGS BREAKDOWN */}
            <div className="mt-6 bg-[#1E1E24] p-4 rounded-xl text-left border border-gray-800">
                <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Estimated Earnings</h3>
                {entries.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-800 last:border-0">
                        <span className="text-white">#{idx+1} {entry.username}</span>
                        <span className="text-neon-green font-mono">${(rewardPool * REWARDS[idx]).toFixed(2)}</span>
                    </div>
                ))}
            </div>
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