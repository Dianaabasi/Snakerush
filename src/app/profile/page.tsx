'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';
import { User, Ticket, Calendar } from 'lucide-react';
import StreakGrid, { type DayStat } from '@/components/StreakGrid';
import Link from 'next/link';

// Helper type
type FrameContext = Awaited<typeof sdk.context>;

// --- DATE HELPER: Get Current Week's Dates (Mon -> Sun) ---
const getWeekDates = () => {
  const current = new Date();
  const week: { date: string, dayName: string, isToday: boolean }[] = [];
  
  // Adjust to get Monday of the current week
  // Day 0 is Sunday, 1 is Monday. 
  const day = current.getDay(); 
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(current.setDate(diff));

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    
    const dateStr = nextDay.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    week.push({
      date: dateStr,
      dayName: dayNames[i],
      isToday: dateStr === todayStr
    });
  }
  return week;
};

export default function ProfilePage() {
  const [context, setContext] = useState<FrameContext>();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [weekStats, setWeekStats] = useState<DayStat[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [todayScore, setTodayScore] = useState(0);
  const [hasTicket, setHasTicket] = useState(false);

  // 1. Initialize SDK
  useEffect(() => {
    const load = async () => {
      setContext(await sdk.context);
      sdk.actions.ready();
    };
    if (sdk) load();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!context?.user?.fid) return;

      const fid = context.user.fid;
      const weekDates = getWeekDates();
      const currentWeekID = getCurrentWeekID();
      const todayStr = new Date().toISOString().split('T')[0];

      try {
        // A. Check Ticket Status
        const ticketSnap = await getDoc(doc(db, 'tickets', `${fid}_${currentWeekID}`));
        setHasTicket(ticketSnap.exists() && ticketSnap.data().paid);

        // B. Fetch Daily Scores
        // Fetch the subcollection 'dailyScores' for this user
        const scoresRef = collection(db, 'users', fid.toString(), 'dailyScores');
        // Optimization: In a real app with years of data, you'd add a 'where' clause for date range.
        // For MVP, fetching all (small dataset) is fine, or simple filtering.
        const scoresSnap = await getDocs(scoresRef);
        
        const scoreMap = new Map<string, number>();
        scoresSnap.forEach(doc => {
          scoreMap.set(doc.id, doc.data().bestScore);
        });

        // C. Build the Stats Array
        let sum = 0;
        let today = 0;

        const stats: DayStat[] = weekDates.map(d => {
          const score = scoreMap.get(d.date) || 0;
          sum += score;
          if (d.date === todayStr) today = score;

          return {
            dayName: d.dayName,
            date: d.date,
            score: score,
            played: score > 0,
            isToday: d.isToday
          };
        });

        setWeekStats(stats);
        setTotalScore(sum);
        setTodayScore(today);

      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [context]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-neon-green animate-pulse font-bold">
        LOADING PROFILE...
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center pb-10">
      
      {/* HEADER: User Info */}
      <div className="flex flex-col items-center mt-6 mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-rush-purple overflow-hidden shadow-[0_0_20px_#8A2BE2] mb-3">
          {context?.user?.pfpUrl ? (
            <img src={context.user.pfpUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <User size={32} />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black text-white">
          {context?.user?.displayName || "Player"}
        </h1>
        <p className="text-gray-500 text-xs font-mono">FID: {context?.user?.fid}</p>
      </div>

      {/* TICKET STATUS BADGE */}
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-8 border
        ${hasTicket 
          ? 'bg-green-900/30 border-neon-green text-neon-green' 
          : 'bg-red-900/30 border-danger-red text-danger-red'}
      `}>
        <Ticket size={16} />
        {hasTicket ? 'WEEKLY PASS ACTIVE' : 'NO ACTIVE PASS'}
      </div>

      {/* MAIN STATS ROW */}
      <div className="flex w-full gap-4 mb-6">
        <div className="flex-1 bg-console-grey p-4 rounded-xl border border-gray-800 flex flex-col items-center">
          <span className="text-gray-400 text-[10px] uppercase font-bold">Total Weekly</span>
          <span className="text-3xl font-black text-rush-purple">{totalScore}</span>
        </div>
        <div className="flex-1 bg-console-grey p-4 rounded-xl border border-gray-800 flex flex-col items-center">
          <span className="text-gray-400 text-[10px] uppercase font-bold">Today`s Best</span>
          <span className="text-3xl font-black text-neon-green">{todayScore}</span>
        </div>
      </div>

      {/* STREAK GRID COMPONENT */}
      <StreakGrid days={weekStats} />

      {/* HISTORY / DETAILS LIST */}
      <div className="w-full">
        <h3 className="text-left text-white font-bold mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-rush-purple"/> 
          Daily Breakdown
        </h3>
        <div className="space-y-2">
          {weekStats.map((day) => (
            <div 
              key={day.date} 
              className={`flex justify-between items-center p-3 rounded-lg border border-gray-800/50 
                ${day.played ? 'bg-gray-900' : 'bg-transparent opacity-50'}`}
            >
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">{day.date}</span>
                <span className={`text-sm font-bold ${day.played ? 'text-white' : 'text-gray-600'}`}>
                  {day.played ? 'Played' : 'Missed'}
                </span>
              </div>
              <div className="text-xl font-mono text-neon-green">
                {day.played ? day.score : 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BACK HOME */}
      <Link href="/" className="mt-8 text-gray-500 hover:text-white transition-colors text-sm">
        ← Back to Home
      </Link>
    </div>
  );
}