'use client';

import { useEffect, useState, useCallback } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentWeekID } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image'; 
import TicketButton from '@/components/TicketButton';
import { House, Trophy, User } from 'lucide-react'; 
import ThemeToggle from '@/components/ThemeToggle'; 

type FrameContext = Awaited<typeof sdk.context>;

export default function HomePage() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  const [hasTicket, setHasTicket] = useState(false);
  
  // FIX: Separate 'checking' state from 'loading app' state
  const [isCheckingTicket, setIsCheckingTicket] = useState(false); 

  // --- TICKET CHECKER ---
  const checkTicketStatus = useCallback(async (fid: number) => {
    setIsCheckingTicket(true);
    const weekID = getCurrentWeekID();
    
    // FIX: Explicit string conversion
    const ticketDocID = `${fid.toString()}_${weekID}`; 

    console.log(`Checking ticket for: ${ticketDocID}`);

    try {
      const ticketSnap = await getDoc(doc(db, 'tickets', ticketDocID));
      if (ticketSnap.exists() && ticketSnap.data().paid) {
        console.log("✅ Ticket found in DB!");
        setHasTicket(true);
      } else {
        console.log("❌ No active ticket found.");
      }
    } catch (error) {
      console.error("Error checking ticket:", error);
    } finally {
      setIsCheckingTicket(false);
    }
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const ctx = await sdk.context;
        if (!isMounted) return;
        
        setContext(ctx);
        sdk.actions.ready();
        setIsSDKLoaded(true);

        if (ctx?.user?.fid) {
          await checkTicketStatus(ctx.user.fid);
        }
      } catch (err) {
        console.error("SDK Init Error:", err);
      }
    };

    init();
    return () => { isMounted = false; };
  }, [checkTicketStatus]);

  // --- HANDLER for successful purchase ---
  const handleTicketPurchased = () => {
    // 1. Optimistically update UI so user doesn't have to refresh
    setHasTicket(true);
    
    // 2. Double check DB in background just in case
    if (context?.user?.fid) {
      checkTicketStatus(context.user.fid);
    }
  };

  // --- RENDER ---
  if (!isSDKLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-green-700 dark:text-neon-green animate-pulse">
        <div className="text-2xl font-bold">LOADING SNAKERUSH...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6 text-center pb-24 relative">
      <div className="absolute top-0 right-0 z-20"><ThemeToggle /></div>

      <div className="mt-8 mb-2 flex flex-col items-center">
        <div className="relative w-64 h-24">
          <Image src="/logo.png" alt="SnakeRush Logo" fill className="object-contain drop-shadow-[0_0_15px_rgba(138,43,226,0.6)]" priority />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-xs font-mono -mt-2 font-bold">
          Weekly Campaign: <span className="ml-2 text-green-800 dark:text-neon-green font-black">{getCurrentWeekID()}</span>
        </p>
      </div>

      {/* Instructions Card: Forced Dark Style for Contrast */}
      <div className="bg-[#1E1E24] p-6 rounded-xl border border-gray-800 w-full max-w-sm shadow-lg text-left">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">How to Play</h2>
        <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside font-medium">
          <li>Get the highest score for the day.</li>
          <li><span className="text-[#39FF14] font-black">Easy Mode:</span> Pass through walls.</li>
          <li><span className="text-[#FF4500] font-black">Hard Mode:</span> Walls kill you.</li>
        </ul>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {hasTicket ? (
          <div className="animate-fade-in">
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-600 dark:border-neon-green text-green-800 dark:text-neon-green p-3 rounded-lg text-sm mb-4 font-bold flex items-center justify-center gap-2">
              ✅ TICKET ACTIVE
            </div>
            <Link href="/game" className="block w-full">
              <button className="w-full bg-green-700 dark:bg-neon-green hover:bg-green-800 dark:hover:bg-green-400 text-white dark:text-black font-black text-xl py-4 rounded-xl shadow-lg dark:shadow-[0_0_20px_rgba(57,255,20,0.6)] transform hover:scale-105 transition-all">
                JOIN GAME
              </button>
            </Link>
          </div>
        ) : (
          <div className="animate-fade-in">
             {isCheckingTicket ? (
                <div className="text-sm text-gray-500 animate-pulse py-4">Verifying Ticket...</div>
             ) : (
               context?.user?.fid && (
                 <TicketButton 
                   fid={context.user.fid} 
                   onTicketPurchased={handleTicketPurchased} 
                 />
               )
             )}
            
            {!hasTicket && !isCheckingTicket && (
               <button className="w-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-400 font-bold py-4 rounded-xl mt-4 cursor-not-allowed opacity-50 border border-gray-300 dark:border-transparent">
                 JOIN GAME (LOCKED)
               </button>
            )}
          </div>
        )}
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

// 'use client';

// import { useEffect, useState } from 'react';
// import sdk from '@farcaster/frame-sdk';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import { getCurrentWeekID } from '@/lib/utils';
// import Link from 'next/link';
// import Image from 'next/image'; 
// import TicketButton from '@/components/TicketButton';
// import { House, Trophy, User } from 'lucide-react'; 
// import ThemeToggle from '@/components/ThemeToggle'; 

// // Helper to handle SDK types safely
// type FrameContext = Awaited<typeof sdk.context>;

// export default function HomePage() {
//   const [isSDKLoaded, setIsSDKLoaded] = useState(false);
//   const [context, setContext] = useState<FrameContext>();
//   const [hasTicket, setHasTicket] = useState(false);
//   const [loadingTicket, setLoadingTicket] = useState(true);

//   // --- 1. Initialize Farcaster SDK (With Dev Bypass) ---
//   useEffect(() => {
//     let isMounted = true;

//     const init = async () => {
//       // PATH A: Development Mode (Localhost) -> Force Mock Data immediately
//       if (process.env.NODE_ENV === 'development') {
//         console.log("🚧 DEV MODE: Skipping Farcaster SDK connection");
        
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         if (isMounted) {
//           setContext({
//             user: {
//               fid: 888888,
//               displayName: "Local Dev",
//               username: "dev_user",
//               pfpUrl: "https://placehold.co/100" 
//             },
//             client: { clientFid: 1, added: true }
//           } as unknown as FrameContext);
          
//           setIsSDKLoaded(true);
//           setHasTicket(true); 
//           setLoadingTicket(false); 
//         }
//         return;
//       }

//       // PATH B: Production Mode
//       try {
//         const context = await sdk.context;
//         if (isMounted) {
//           setContext(context);
//           sdk.actions.ready();
//           setIsSDKLoaded(true);
//         }
//       } catch (error) {
//         console.error("SDK Load Error:", error);
//       }
//     };

//     init();

//     return () => { isMounted = false; };
//   }, []); 

//   // --- 2. Check Firebase for existing ticket ---
//   const checkTicketStatus = async () => {
//     if (process.env.NODE_ENV === 'development') return;
//     if (!context?.user?.fid) return;

//     setLoadingTicket(true);
//     const weekID = getCurrentWeekID();
//     const ticketDocID = `${context.user.fid}_${weekID}`;

//     try {
//       const ticketSnap = await getDoc(doc(db, 'tickets', ticketDocID));
//       if (ticketSnap.exists() && ticketSnap.data().paid) {
//         setHasTicket(true);
//       }
//     } catch (error) {
//       console.error("Error checking ticket:", error);
//     } finally {
//       setLoadingTicket(false);
//     }
//   };

//   useEffect(() => {
//     if (context?.user?.fid) {
//       checkTicketStatus();
//     }
//   }, [context]);

//   // --- RENDER ---
//   if (!isSDKLoaded || loadingTicket) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh] text-green-700 dark:text-neon-green animate-pulse gap-4">
//         <div className="text-2xl font-bold">LOADING SNAKERUSH...</div>
//         {process.env.NODE_ENV === 'development' && (
//            <p className="text-xs text-gray-500">Waiting for Dev Bypass...</p>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="w-full flex flex-col items-center gap-6 text-center pb-24 relative">
      
//       {/* THEME TOGGLE (Top Right) */}
//       <div className="absolute top-0 right-0 z-20">
//         <ThemeToggle />
//       </div>

//       {/* HEADER LOGO */}
//       <div className="mt-8 mb-2 flex flex-col items-center">
//         <div className="relative w-80 h-40">
//           <Image 
//             src="/logo.png" 
//             alt="SnakeRush Logo" 
//             fill
//             className="object-contain drop-shadow-[0_0_15px_rgba(138,43,226,0.6)]"
//             priority
//           />
//         </div>
//         {/* LIGHT MODE: Dark Grey Text | DARK MODE: Light Grey Text */}
//         <p className="text-gray-600 dark:text-gray-400 text-xs font-mono -mt-2 font-bold">
//           Weekly Campaign: 
//           {/* LIGHT MODE: Dark Green Text | DARK MODE: Neon Green Text */}
//           <span className="ml-2 text-green-800 dark:text-neon-green font-black">
//             {getCurrentWeekID()}
//           </span>
//         </p>
//       </div>

//       {/* INSTRUCTIONS CARD - FORCED DARK STYLE */}
//       {/* We use bg-[#1E1E24] explicitly to ignore the light mode variable switch */}
//       <div className="bg-[#1E1E24] p-6 rounded-xl border border-gray-800 w-full max-w-sm shadow-lg text-left">
        
//         <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
//           How to Play
//         </h2>
        
//         <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside font-medium">
//           <li>Get the highest score for the day.</li>
          
//           {/* EASY MODE: Forced Neon Green Hex */}
//           <li>
//             <span className="text-[#39FF14] font-black">Easy Mode:</span> Pass through walls.
//           </li>
          
//           {/* HARD MODE: Forced Danger Red Hex */}
//           <li>
//             <span className="text-[#FF4500] font-black">Hard Mode:</span> Walls kill you.
//           </li>
//         </ul>
//       </div>

//       {/* DEV BANNER */}
//       {process.env.NODE_ENV === 'development' && (
//         <div className="bg-amber-100 dark:bg-yellow-900/30 text-amber-800 dark:text-yellow-500 px-4 py-2 rounded-lg text-xs font-mono border border-amber-300 dark:border-yellow-700 font-bold">
//           🚧 DEV MODE: Ticket Bypassed
//         </div>
//       )}

//       {/* ACTION AREA */}
//       <div className="w-full max-w-sm flex flex-col gap-4">
//         {hasTicket ? (
//           <div className="animate-fade-in">
//             {/* TICKET ACTIVE: Light Green BG/Dark Text (Light) vs Transparent/Neon (Dark) */}
//             <div className="bg-green-100 dark:bg-green-900/20 border border-green-600 dark:border-neon-green text-green-800 dark:text-neon-green p-3 rounded-lg text-sm mb-4 font-bold flex items-center justify-center gap-2">
//               ✅ TICKET ACTIVE
//             </div>
            
//             <Link href="/game" className="block w-full">
//               {/* JOIN BUTTON: Dark Green/White Text (Light) vs Neon Green/Black Text (Dark) */}
//               <button className="w-full bg-green-700 dark:bg-neon-green hover:bg-green-800 dark:hover:bg-green-400 text-white dark:text-black font-black text-xl py-4 rounded-xl shadow-lg dark:shadow-[0_0_20px_rgba(57,255,20,0.6)] transform hover:scale-105 transition-all">
//                 JOIN GAME
//               </button>
//             </Link>
//           </div>
//         ) : (
//           <div className="animate-fade-in">
//              {context?.user?.fid && (
//                <TicketButton 
//                  fid={context.user.fid} 
//                  onTicketPurchased={() => checkTicketStatus()} 
//                />
//              )}
//             {!hasTicket && (
//                <button className="w-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-400 font-bold py-4 rounded-xl mt-4 cursor-not-allowed opacity-50 border border-gray-300 dark:border-transparent">
//                  JOIN GAME (LOCKED)
//                </button>
//             )}
//           </div>
//         )}
//       </div>

//       {/* BOTTOM NAVIGATION BAR */}
//       <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-console-grey/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-4 z-50 transition-colors">
//         <div className="max-w-md mx-auto flex justify-around items-center">
          
//           {/* HOME (Active) */}
//           <Link href="/" className="flex flex-col items-center gap-1 min-w-[60px]">
//             <House size={24} className="text-green-700 dark:text-neon-green drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
//             <span className="text-[10px] font-bold text-green-700 dark:text-neon-green">Home</span>
//           </Link>

//           {/* RANK */}
//           <Link href="/leaderboard" className="flex flex-col items-center gap-1 min-w-[60px] group">
//             <Trophy size={24} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
//             <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Rank</span>
//           </Link>

//           {/* PROFILE */}
//           <Link href="/profile" className="flex flex-col items-center gap-1 min-w-[60px] group">
//             <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-400 dark:border-gray-500 group-hover:border-gray-900 dark:group-hover:border-white transition-colors flex items-center justify-center bg-gray-100 dark:bg-gray-800">
//                {context?.user?.pfpUrl ? (
//                  <img src={context.user.pfpUrl} alt="Me" className="w-full h-full object-cover" />
//                ) : (
//                  <User size={16} className="text-gray-500 dark:text-gray-400" />
//                )}
//             </div>
//             <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Profile</span>
//           </Link>

//         </div>
//       </nav>
//     </div>
//   );
// }