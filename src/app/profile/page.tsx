// 'use client';

// import { useEffect, useState } from 'react';
// import sdk from '@farcaster/frame-sdk';
// import { doc, collection, getDocs, onSnapshot } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import { User, Heart, Calendar, House, Trophy } from 'lucide-react';
// import StreakGrid, { type DayStat } from '@/components/StreakGrid';
// import Link from 'next/link';
// import Image from 'next/image';
// import { getWeekDates } from '@/lib/utils'; // Use shared helper

// type FrameContext = Awaited<typeof sdk.context>;

// export default function ProfilePage() {
//   const [context, setContext] = useState<FrameContext>();
//   const [loading, setLoading] = useState(true);
//   const [weekStats, setWeekStats] = useState<DayStat[]>([]);
//   const [totalScore, setTotalScore] = useState(0);
//   const [todayScore, setTodayScore] = useState(0);
//   const [lives, setLives] = useState(0);

//   useEffect(() => {
//     const load = async () => {
//       const ctx = await sdk.context;
//       setContext(ctx);
//       sdk.actions.ready();
//     };
//     if (sdk) load();
//   }, []);

//   useEffect(() => {
//     let unsubscribeUser: () => void;

//     const fetchData = async () => {
//       if (!context?.user?.fid) return;

//       const fid = context.user.fid;
//       const fidString = fid.toString();
      
//       // Use shared util to ensure dates match GamePage logic
//       const weekDateStrings = getWeekDates();
//       const todayStr = new Date().toISOString().split('T')[0];
//       const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; 

//       try {
//         const userRef = doc(db, 'users', fidString);
//         const scoresRef = collection(db, 'users', fidString, 'dailyScores');
//         const scoresSnap = await getDocs(scoresRef);
        
//         const scoreMap = new Map<string, number>();
//         scoresSnap.forEach(doc => {
//           scoreMap.set(doc.id, doc.data().bestScore);
//         });

//         unsubscribeUser = onSnapshot(userRef, (docSnap) => {
//             if (docSnap.exists()) {
//                 setLives(docSnap.data().lives || 0);
//             } else {
//                 setLives(0);
//             }
//         });

//         let sum = 0;
//         const stats: DayStat[] = weekDateStrings.map((dateStr, index) => {
//           const score = scoreMap.get(dateStr) || 0;
//           sum += score;
//           return {
//             dayName: dayNames[index],
//             date: dateStr,
//             score: score,
//             played: score > 0,
//             isToday: dateStr === todayStr
//           };
//         });

//         const currentTodayScore = scoreMap.get(todayStr) || 0;

//         setWeekStats(stats);
//         setTotalScore(sum);
//         setTodayScore(currentTodayScore);

//       } catch (err) {
//         console.error("Error loading profile:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();

//     return () => {
//         if (unsubscribeUser) unsubscribeUser();
//     };
//   }, [context]);

//   const getStatusText = (dateStr: string, score: number) => {
//     const today = new Date().toISOString().split('T')[0];
//     if (dateStr > today) return 'Upcoming';
//     if (score > 0) return 'Played';
//     if (dateStr < today) return 'Missed';
//     return 'Today'; 
//   };

//   if (loading) {
//     return (
//       <div className="min-h-[50vh] flex items-center justify-center text-green-700 dark:text-neon-green animate-pulse font-bold">
//         LOADING PROFILE...
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-sm flex flex-col items-center pb-24">
      
//       <div className="flex flex-col items-center mt-6 mb-8">
//         <div className="w-20 h-20 rounded-full border-4 border-rush-purple overflow-hidden shadow-[0_0_20px_#8A2BE2] mb-3 relative">
//           {context?.user?.pfpUrl ? (
//             <Image src={context.user.pfpUrl} alt="Profile" fill className="object-cover" />
//           ) : (
//             <div className="w-full h-full bg-gray-800 flex items-center justify-center">
//               <User size={32} />
//             </div>
//           )}
//         </div>
//         <h1 className="text-2xl font-black text-gray-900 dark:text-white">
//           {context?.user?.displayName || "Player"}
//         </h1>
//       </div>

//       <div className={`
//         flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold mb-8 border transition-all
//         ${lives > 0 
//           ? 'bg-green-100 dark:bg-green-900/30 border-green-600 dark:border-neon-green text-green-800 dark:text-neon-green shadow-lg' 
//           : 'bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400'}
//       `}>
//         <Heart size={16} fill={lives > 0 ? "currentColor" : "none"} />
//         {lives > 0 ? `${lives} LIVES AVAILABLE` : 'NO LIVES REMAINING'}
//       </div>

//       <div className="flex w-full gap-4 mb-6">
//         <div className="flex-1 bg-[#1E1E24] p-4 rounded-xl border border-gray-800 flex flex-col items-center shadow-md">
//           <span className="text-gray-400 text-[10px] uppercase font-bold">Total Weekly</span>
//           <span className="text-3xl font-black text-rush-purple">{totalScore}</span>
//         </div>
//         <div className="flex-1 bg-[#1E1E24] p-4 rounded-xl border border-gray-800 flex flex-col items-center shadow-md">
//           <span className="text-gray-400 text-[10px] uppercase font-bold">Today`s Best</span>
//           <span className="text-3xl font-black text-neon-green">{todayScore}</span>
//         </div>
//       </div>

//       <div className="w-full">
//          <StreakGrid days={weekStats} />
//       </div>

//       <div className="w-full mt-6">
//         <h3 className="text-left text-gray-900 dark:text-white font-bold mb-3 flex items-center gap-2">
//           <Calendar size={16} className="text-rush-purple"/> 
//           Daily Breakdown
//         </h3>
        
//         <div className="space-y-2">
//           {weekStats.map((day) => {
//             const status = getStatusText(day.date, day.score);
//             const isMissed = status === 'Missed';
//             const isUpcoming = status === 'Upcoming';

//             return (
//               <div 
//                 key={day.date} 
//                 className={`flex justify-between items-center p-3 rounded-lg border border-gray-800 
//                   ${day.played ? 'bg-[#1E1E24]' : 'bg-gray-100 dark:bg-gray-900 opacity-60'}
//                   ${isUpcoming ? 'opacity-30' : ''}
//                 `}
//               >
//                 <div className="flex flex-col">
//                   <span className="text-xs text-gray-500">{day.date}</span>
//                   <span className={`text-sm font-bold 
//                     ${day.played ? 'text-white' : ''}
//                     ${isMissed ? 'text-red-500' : ''}
//                     ${isUpcoming ? 'text-gray-500' : ''}
//                   `}>
//                     {status}
//                   </span>
//                 </div>
//                 <div className="text-xl font-mono text-neon-green">
//                   {day.played ? day.score : '-'}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       <Link href="/" className="mt-8 text-gray-500 hover:text-green-700 dark:hover:text-white transition-colors text-sm">
//         ← Back to Home
//       </Link>

//       <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-console-grey/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-4 z-50 transition-colors">
//         <div className="max-w-md mx-auto flex justify-around items-center">
//           <Link href="/" className="flex flex-col items-center gap-1 min-w-[60px] group">
//             <House size={24} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
//             <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Home</span>
//           </Link>
//           <Link href="/leaderboard" className="flex flex-col items-center gap-1 min-w-[60px] group">
//             <Trophy size={24} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
//             <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Rank</span>
//           </Link>
//           <Link href="/profile" className="flex flex-col items-center gap-1 min-w-[60px] group">
//             <div className="w-6 h-6 rounded-full overflow-hidden border border-green-700 dark:border-neon-green flex items-center justify-center bg-gray-100 dark:bg-gray-800 shadow-[0_0_8px_rgba(57,255,20,0.5)]">
//                {context?.user?.pfpUrl ? (
//                  <Image src={context.user.pfpUrl} alt="Me" className="w-full h-full object-cover" />
//                ) : (
//                  <User size={16} className="text-gray-500 dark:text-gray-400" />
//                )}
//             </div>
//             <span className="text-[10px] font-bold text-green-700 dark:text-neon-green">Profile</span>
//           </Link>
//         </div>
//       </nav>
//     </div>
//   );
// }

//Updated with Claim logic for Leaderboard rewards
'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, collection, getDocs, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Heart, Calendar, House, Trophy, DollarSign } from 'lucide-react';
import StreakGrid, { type DayStat } from '@/components/StreakGrid';
import Link from 'next/link';
import Image from 'next/image';
import { getWeekDates, getPreviousWeekID } from '@/lib/utils';

type FrameContext = Awaited<typeof sdk.context>;

// --- DATE HELPER (Sunday Start) ---
const getWeekDatesList = () => {
  const current = new Date();
  const day = current.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = current.getDate() - day; // Adjust to Sunday
  const sunday = new Date(current.setDate(diff));

  const week: { date: string, dayName: string, isToday: boolean }[] = [];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(sunday);
    nextDay.setDate(sunday.getDate() + i);
    const dateStr = nextDay.toISOString().split('T')[0];
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
  const [lives, setLives] = useState(0);
  
  // New State
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const ctx = await sdk.context;
      setContext(ctx);
      sdk.actions.ready();
    };
    if (sdk) load();
  }, []);

  useEffect(() => {
    let unsubscribeUser: () => void;

    const fetchData = async () => {
      if (!context?.user?.fid) return;

      const fid = context.user.fid;
      const fidString = fid.toString();
      const weekDates = getWeekDatesList();
      const todayStr = new Date().toISOString().split('T')[0];

      try {
        const userRef = doc(db, 'users', fidString);
        const scoresRef = collection(db, 'users', fidString, 'dailyScores');
        const scoresSnap = await getDocs(scoresRef);
        
        const scoreMap = new Map<string, number>();
        scoresSnap.forEach(doc => {
          scoreMap.set(doc.id, doc.data().bestScore);
        });

        // Realtime Listener for Lives & Earnings
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setLives(data.lives || 0);
                setTotalEarnings(data.totalEarnings || 0);
            } else {
                setLives(0);
                setTotalEarnings(0);
            }
        });

        let sum = 0;
        const stats: DayStat[] = weekDates.map(d => {
          const score = scoreMap.get(d.date) || 0;
          sum += score;
          return {
            dayName: d.dayName,
            date: d.date,
            score: score,
            played: score > 0,
            isToday: d.isToday
          };
        });

        const currentTodayScore = scoreMap.get(todayStr) || 0;

        setWeekStats(stats);
        setTotalScore(sum);
        setTodayScore(currentTodayScore);

        // --- CHECK CLAIM ELIGIBILITY ---
        const today = new Date();
        const isSunday = today.getDay() === 0;
        
        if (isSunday) {
            // Check if user has already claimed for previous week
            const prevWeekID = getPreviousWeekID();
            const userSnap = await getDoc(userRef);
            const claimedWeeks = userSnap.exists() ? (userSnap.data().claimedWeeks || []) : [];
            
            if (!claimedWeeks.includes(prevWeekID)) {
                // If not claimed, show button (API will verify rank)
                setCanClaim(true);
            }
        }

      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
        if (unsubscribeUser) unsubscribeUser();
    };
  }, [context]);

  const handleClaimReward = async () => {
    if (!context?.user?.fid) return;
    setIsClaiming(true);
    setClaimMessage('Verifying rank...');

    try {
        const response = await fetch('/api/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fid: context.user.fid }),
        });

        const data = await response.json();

        if (response.ok) {
            setClaimMessage(`Success! Sent ${data.amount} USDC.`);
            setCanClaim(false); // Hide button
        } else {
            setClaimMessage(data.error || 'Claim failed.');
        }
    } catch (error) {
        setClaimMessage('Network error. Try again.');
        console.error(error);
    } finally {
        setIsClaiming(false);
    }
  };

  const getStatusText = (dateStr: string, score: number) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr > today) return 'Upcoming';
    if (score > 0) return 'Played';
    if (dateStr < today) return 'Missed';
    return 'Today'; 
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-green-700 dark:text-neon-green animate-pulse font-bold">
        LOADING PROFILE...
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center pb-24">
      
      <div className="flex flex-col items-center mt-6 mb-4">
        <div className="w-20 h-20 rounded-full border-4 border-rush-purple overflow-hidden shadow-[0_0_20px_#8A2BE2] mb-3 relative">
          {context?.user?.pfpUrl ? (
            <Image src={context.user.pfpUrl} alt="Profile" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <User size={32} />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          {context?.user?.displayName || "Player"}
        </h1>
      </div>

      {/* NEW: Total Earnings Badge */}
      <div className="mb-6 flex items-center gap-2 bg-yellow-900/30 border border-yellow-600 px-4 py-2 rounded-xl text-yellow-500 font-bold shadow-lg">
        <DollarSign size={18} />
        <span>Total Earnings: ${totalEarnings.toFixed(2)}</span>
      </div>

      {/* NEW: CLAIM BUTTON (Only visible on Sunday if eligible) */}
      {canClaim && (
        <div className="w-full mb-6 animate-pulse">
            <button 
                onClick={handleClaimReward}
                disabled={isClaiming}
                className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.6)] flex flex-col items-center justify-center"
            >
                <span className="text-lg flex items-center gap-2">
                    <Trophy size={24} /> 
                    {isClaiming ? 'PROCESSING...' : 'CLAIM WEEKLY REWARD'}
                </span>
                <span className="text-xs font-normal opacity-90">Expires in 24 hours</span>
            </button>
            {claimMessage && (
                <p className="text-center mt-2 text-sm font-bold text-yellow-400">{claimMessage}</p>
            )}
        </div>
      )}

      <div className={`
        flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold mb-8 border transition-all
        ${lives > 0 
          ? 'bg-green-100 dark:bg-green-900/30 border-green-600 dark:border-neon-green text-green-800 dark:text-neon-green shadow-lg' 
          : 'bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400'}
      `}>
        <Heart size={16} fill={lives > 0 ? "currentColor" : "none"} />
        {lives > 0 ? `${lives} LIVES AVAILABLE` : 'NO LIVES REMAINING'}
      </div>

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

      <div className="w-full">
         <StreakGrid days={weekStats} />
      </div>

      <div className="w-full mt-6">
        <h3 className="text-left text-gray-900 dark:text-white font-bold mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-rush-purple"/> 
          Daily Breakdown
        </h3>
        
        <div className="space-y-2">
          {weekStats.map((day) => {
            const status = getStatusText(day.date, day.score);
            const isMissed = status === 'Missed';
            const isUpcoming = status === 'Upcoming';

            return (
              <div 
                key={day.date} 
                className={`flex justify-between items-center p-3 rounded-lg border border-gray-800 
                  ${day.played ? 'bg-[#1E1E24]' : 'bg-gray-100 dark:bg-gray-900 opacity-60'}
                  ${isUpcoming ? 'opacity-30' : ''}
                `}
              >
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">{day.date}</span>
                  <span className={`text-sm font-bold 
                    ${day.played ? 'text-white' : ''}
                    ${isMissed ? 'text-red-500' : ''}
                    ${isUpcoming ? 'text-gray-500' : ''}
                  `}>
                    {status}
                  </span>
                </div>
                <div className="text-xl font-mono text-neon-green">
                  {day.played ? day.score : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Link href="/" className="mt-8 text-gray-500 hover:text-green-700 dark:hover:text-white transition-colors text-sm">
        ← Back to Home
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-console-grey/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-4 z-50 transition-colors">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <Link href="/" className="flex flex-col items-center gap-1 min-w-[60px] group">
            <House size={24} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Home</span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-1 min-w-[60px] group">
            <Trophy size={24} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Rank</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 min-w-[60px] group">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-green-700 dark:border-neon-green flex items-center justify-center bg-gray-100 dark:bg-gray-800 shadow-[0_0_8px_rgba(57,255,20,0.5)]">
               {context?.user?.pfpUrl ? (
                 <Image src={context.user.pfpUrl} alt="Me" width={24} height={24} className="w-full h-full object-cover" />
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