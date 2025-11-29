'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';
import { User, Ticket, Calendar, House, Trophy } from 'lucide-react';
import StreakGrid, { type DayStat } from '@/components/StreakGrid';
import Link from 'next/link';

// Helper type
type FrameContext = Awaited<typeof sdk.context>;

// --- DATE HELPER ---
const getWeekDates = () => {
  const current = new Date();
  const week: { date: string, dayName: string, isToday: boolean }[] = [];
  
  const day = current.getDay(); 
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
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
  
  const [weekStats, setWeekStats] = useState<DayStat[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [todayScore, setTodayScore] = useState(0);
  const [hasTicket, setHasTicket] = useState(false);

  useEffect(() => {
    const load = async () => {
      const ctx = await sdk.context;
      setContext(ctx);
      sdk.actions.ready();
    };
    if (sdk) load();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!context?.user?.fid) return;

      const fid = context.user.fid;
      const fidString = fid.toString(); // FIX: Ensure string ID
      const weekDates = getWeekDates();
      const currentWeekID = getCurrentWeekID();
      const todayStr = new Date().toISOString().split('T')[0];

      try {
        // A. Check Ticket Status
        const ticketDocID = `${fidString}_${currentWeekID}`;
        console.log(`👤 Checking Profile Ticket: ${ticketDocID}`);
        
        const ticketSnap = await getDoc(doc(db, 'tickets', ticketDocID));
        if (ticketSnap.exists() && ticketSnap.data().paid) {
          setHasTicket(true);
        } else {
          setHasTicket(false);
        }

        // B. Fetch Daily Scores
        const scoresRef = collection(db, 'users', fidString, 'dailyScores');
        const scoresSnap = await getDocs(scoresRef);
        
        const scoreMap = new Map<string, number>();
        scoresSnap.forEach(doc => {
          scoreMap.set(doc.id, doc.data().bestScore);
        });

        // C. Build Stats
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
      <div className="min-h-[50vh] flex items-center justify-center text-green-700 dark:text-neon-green animate-pulse font-bold">
        LOADING PROFILE...
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center pb-24">
      
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
        {/* FIX: Dark text in light mode */}
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          {context?.user?.displayName || "Player"}
        </h1>
      </div>

      {/* TICKET STATUS BADGE */}
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-8 border
        ${hasTicket 
          ? 'bg-green-100 dark:bg-green-900/30 border-green-600 dark:border-neon-green text-green-800 dark:text-neon-green' 
          : 'bg-red-100 dark:bg-red-900/30 border-red-600 dark:border-danger-red text-red-800 dark:text-danger-red'}
      `}>
        <Ticket size={16} />
        {hasTicket ? 'WEEKLY PASS ACTIVE' : 'NO ACTIVE PASS'}
      </div>

      {/* MAIN STATS ROW */}
      {/* FIX: Forced dark background cards for readability of neon numbers */}
      <div className="flex w-full gap-4 mb-6">
        <div className="flex-1 bg-[#1E1E24] p-4 rounded-xl border border-gray-800 flex flex-col items-center shadow-md">
          <span className="text-gray-400 text-[10px] uppercase font-bold">Total Weekly</span>
          <span className="text-3xl font-black text-rush-purple">{totalScore}</span>
        </div>
        <div className="flex-1 bg-[#1E1E24] p-4 rounded-xl border border-gray-800 flex flex-col items-center shadow-md">
          <span className="text-gray-400 text-[10px] uppercase font-bold">Today`s Best</span>
          <span className="text-3xl font-black text-neon-green">{todayScore}</span>
        </div>
      </div>

      {/* STREAK GRID COMPONENT */}
      <div className="w-full">
         <StreakGrid days={weekStats} />
      </div>

      {/* HISTORY / DETAILS LIST */}
      <div className="w-full mt-6">
        {/* FIX: Header Color */}
        <h3 className="text-left text-gray-900 dark:text-white font-bold mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-rush-purple"/> 
          Daily Breakdown
        </h3>
        
        <div className="space-y-2">
          {weekStats.map((day) => (
            <div 
              key={day.date} 
              // FIX: Forced dark background for list items so neon text pops
              className={`flex justify-between items-center p-3 rounded-lg border border-gray-800 
                ${day.played ? 'bg-[#1E1E24]' : 'bg-gray-100 dark:bg-gray-900 opacity-60'}`}
            >
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">{day.date}</span>
                <span className={`text-sm font-bold ${day.played ? 'text-white' : 'text-gray-500'}`}>
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
      <Link href="/" className="mt-8 text-gray-500 hover:text-green-700 dark:hover:text-white transition-colors text-sm">
        ← Back to Home
      </Link>

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
            <div className="w-6 h-6 rounded-full overflow-hidden border border-green-700 dark:border-neon-green flex items-center justify-center bg-gray-100 dark:bg-gray-800 shadow-[0_0_8px_rgba(57,255,20,0.5)]">
               {context?.user?.pfpUrl ? (
                 <img src={context.user.pfpUrl} alt="Me" className="w-full h-full object-cover" />
               ) : (
                 <User size={16} className="text-gray-500 dark:text-gray-400" />
               )}
            </div>
            <span className="text-[10px] font-bold text-green-700 dark:text-neon-green">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}