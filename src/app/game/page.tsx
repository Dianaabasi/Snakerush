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

  // Claiming States
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Load User Context
  useEffect(() => {
    const loadContext = async () => {
      const ctx = await sdk.context;
      setContext(ctx);
      sdk.actions.ready();
    };
    if (sdk) loadContext();
  }, []);

  // --- ACTIONS ---

  const handleStart = (mode: Difficulty) => {
    setDifficulty(mode);
    setGameState('PLAYING');
    setClaimStatus('IDLE');
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('OVER');
  };

  const handleReplay = () => {
    setGameState('PLAYING');
    setClaimStatus('IDLE');
  };

  const handleClaim = async () => {
    if (!context?.user?.fid) {
      alert("Please play inside Farcaster!");
      return;
    }

    setIsClaiming(true);
    const fid = context.user.fid.toString();
    const dateKey = getTodayKey();
    
    // References
    const userRef = doc(db, 'users', fid);
    const dailyScoreRef = doc(db, 'users', fid, 'dailyScores', dateKey);

    try {
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
          fid: parseInt(fid),
          date: dateKey,
          bestScore: finalScore,
          timestamp: serverTimestamp(),
          lastMode: difficulty
        }, { merge: true });
        
        // 4. Update User Profile & Weekly Total (Crucial for Leaderboard)
        await setDoc(userRef, {
          fid: parseInt(fid),
          username: context.user.username || context.user.displayName || 'Unknown',
          pfpUrl: context.user.pfpUrl || '',
          // Increment the weekly score by the improvement amount
          weeklyScore: increment(scoreDelta),
          lastPlayedAt: serverTimestamp()
        }, { merge: true });

        console.log("New high score and leaderboard updated!");
        setClaimStatus('SUCCESS');
      } else {
        console.log("Score lower than daily best, ignoring.");
        setClaimStatus('SUCCESS'); // Still show success so user knows game is done
      }

    } catch (error) {
      console.error("Error saving score:", error);
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
        <h1 className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm">SELECT MODE</h1>
        
        <button 
          onClick={() => handleStart('EASY')}
          className="w-full bg-neon-green/10 border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black p-6 rounded-2xl transition-all group"
        >
          <div className="text-2xl font-black mb-1">EASY MODE</div>
          <div className="text-sm opacity-80 group-hover:opacity-100 font-medium">
            Pass through walls • Classic Fun
          </div>
        </button>

        <button 
          onClick={() => handleStart('HARD')}
          className="w-full bg-danger-red/10 border-2 border-danger-red text-danger-red hover:bg-danger-red hover:text-white p-6 rounded-2xl transition-all group"
        >
          <div className="text-2xl font-black mb-1">HARD MODE</div>
          <div className="text-sm opacity-80 group-hover:opacity-100 font-medium">
            Walls Kill You • High Stakes
          </div>
        </button>
      </div>
    );
  }

  // 2. GAME & GAME OVER
  return (
    <div className="relative w-full flex flex-col items-center">
      {/* The Game Canvas handles the loop and controls */}
      <GameCanvas 
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