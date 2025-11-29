'use client';

import { useState, useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Difficulty } from '@/store/gameStore';
import GameCanvas from '@/components/GameCanvas';
import GameOverModal from '@/components/GameOverModal';

// Helper to get today's date string (UTC) for the DB key
const getTodayKey = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns 'YYYY-MM-DD'
};

// Helper type for SDK context
type FrameContext = Awaited<typeof sdk.context>;

export default function GamePage() {
  const [context, setContext] = useState<FrameContext>();
  
  // Game States
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'OVER'>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [finalScore, setFinalScore] = useState(0);

  // REPLAY FIX: This key forces the GameCanvas to re-mount and reset completely
  const [gameResetKey, setGameResetKey] = useState(0);

  // Claiming States
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Load User Context
  useEffect(() => {
    const loadContext = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        sdk.actions.ready();
      } catch (err) {
        console.error("Context load error", err);
      }
    };
    if (sdk) loadContext();
  }, []);

  // --- ACTIONS ---

  const handleStart = (mode: Difficulty) => {
    setDifficulty(mode);
    setGameState('PLAYING');
    setClaimStatus('IDLE');
    setGameResetKey(prev => prev + 1); // Force fresh start
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('OVER');
  };

  const handleReplay = () => {
    setGameState('PLAYING');
    setClaimStatus('IDLE');
    setGameResetKey(prev => prev + 1); // Force fresh start
  };

  const handleClaim = async () => {
    if (!context?.user?.fid) {
      console.error("No FID found, cannot save.");
      return;
    }

    setIsClaiming(true);
    // Ensure FID is string for Firestore path
    const fidString = context.user.fid.toString();
    const dateKey = getTodayKey();
    
    // References
    const userRef = doc(db, 'users', fidString);
    const dailyScoreRef = doc(db, 'users', fidString, 'dailyScores', dateKey);

    try {
      console.log(`Attempting to save score: ${finalScore} for FID: ${fidString}`);

      // 1. Check existing score for today
      const dailySnap = await getDoc(dailyScoreRef);
      let currentDailyHigh = 0;
      if (dailySnap.exists()) {
        currentDailyHigh = dailySnap.data().bestScore || 0;
      }

      // 2. Calculate the difference (Point Delta)
      // If new score is 100 and old was 80, add 20 to the weekly total.
      if (finalScore > currentDailyHigh) {
        const scoreDelta = finalScore - currentDailyHigh;

        // 3. Write Daily Score
        await setDoc(dailyScoreRef, {
          fid: context.user.fid, // Store as number inside doc
          date: dateKey,
          bestScore: finalScore,
          timestamp: serverTimestamp(),
          lastMode: difficulty
        }, { merge: true });
        
        // 4. Update User Profile & Weekly Total (Crucial for Leaderboard)
        await setDoc(userRef, {
          fid: context.user.fid,
          username: context.user.username || context.user.displayName || 'Unknown',
          pfpUrl: context.user.pfpUrl || '',
          // Increment the weekly score by the improvement amount
          weeklyScore: increment(scoreDelta),
          lastPlayedAt: serverTimestamp()
        }, { merge: true });

        console.log("✅ New high score and leaderboard updated!");
        setClaimStatus('SUCCESS');
      } else {
        console.log("⚠️ Score lower than daily best, ignoring.");
        setClaimStatus('SUCCESS'); // Still show success so user knows game is done
      }

    } catch (error) {
      console.error("❌ Error saving score:", error);
      setClaimStatus('ERROR');
    } finally {
      setIsClaiming(false);
    }
  };

  // --- RENDER ---

  // 1. MENU SCREEN
  if (gameState === 'MENU') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 w-full max-w-sm">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm">
          SELECT MODE
        </h1>
        
        {/* EASY MODE BUTTON */}
        <button 
          onClick={() => handleStart('EASY')}
          className="w-full bg-green-100 dark:bg-neon-green/10 border-2 border-green-600 dark:border-neon-green text-green-800 dark:text-neon-green hover:bg-green-200 dark:hover:bg-neon-green dark:hover:text-black p-6 rounded-2xl transition-all group"
        >
          <div className="text-2xl font-black mb-1">EASY MODE</div>
          <div className="text-sm font-bold opacity-80 group-hover:opacity-100">
            Pass through walls • Classic Fun
          </div>
        </button>

        {/* HARD MODE BUTTON */}
        <button 
          onClick={() => handleStart('HARD')}
          className="w-full bg-red-100 dark:bg-danger-red/10 border-2 border-red-600 dark:border-danger-red text-red-800 dark:text-danger-red hover:bg-red-200 dark:hover:bg-danger-red dark:hover:text-white p-6 rounded-2xl transition-all group"
        >
          <div className="text-2xl font-black mb-1">HARD MODE</div>
          <div className="text-sm font-bold opacity-80 group-hover:opacity-100">
            Walls Kill You • High Stakes
          </div>
        </button>
      </div>
    );
  }

  // 2. GAME & GAME OVER
  return (
    <div className="relative w-full flex flex-col items-center">
      {/* FIX: key={gameResetKey} 
         This tells React: "If this number changes, destroy the old game 
         and build a completely new one." This fixes the replay bug.
      */}
      <GameCanvas 
        key={gameResetKey} 
        difficulty={difficulty} 
        onGameOver={handleGameOver}
      />

      {/* Modal Overlay */}
      {gameState === 'OVER' && (
        <GameOverModal
          score={finalScore}
          isClaiming={isClaiming}
          onClaim={handleClaim}
          onReplay={handleReplay}
          claimStatus={claimStatus}
        />
      )}
    </div>
  );
}