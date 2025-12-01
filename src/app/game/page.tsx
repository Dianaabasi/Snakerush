'use client';

import { useState, useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore'; // Using runTransaction for safety
import { db } from '@/lib/firebase';
import { GamePhase } from '@/store/gameStore';
import GameCanvas from '@/components/GameCanvas';
import GameOverModal from '@/components/GameOverModal';
import { getCurrentWeekID } from '@/lib/utils';
import { Heart } from 'lucide-react';

type FrameContext = Awaited<typeof sdk.context>;

// Config: Value added to pool per game ($0.50 value * 50% = $0.25)
const POOL_CONTRIBUTION = 0.25;

export default function GamePage() {
  const [context, setContext] = useState<FrameContext>();
  const [gameState, setGameState] = useState<'LOADING' | 'PLAYING' | 'PAUSED' | 'OVER'>('LOADING');
  const [finalScore, setFinalScore] = useState(0);
  const [lives, setLives] = useState<number | null>(null);
  
  const [gameResetKey, setGameResetKey] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('NORMAL'); // Track phase for popups

  // Claiming
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Load User & Start Game Logic
  useEffect(() => {
    const init = async () => {
      const ctx = await sdk.context;
      setContext(ctx);
      sdk.actions.ready();

      if (ctx?.user?.fid) {
        await startGameTransaction(ctx.user.fid);
      }
    };
    init();
  }, []);

  // --- CORE LOGIC: START GAME TRANSACTION ---
  // Deduct 1 life, Add to Pool
  const startGameTransaction = async (fid: number) => {
    const weekID = getCurrentWeekID();
    const userRef = doc(db, 'users', fid.toString());
    const campaignRef = doc(db, 'campaigns', weekID);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User not found";
        
        const currentLives = userDoc.data().lives || 0;
        if (currentLives < 1) throw "Not enough lives";

        // Deduct Life
        transaction.update(userRef, { lives: currentLives - 1 });
        
        // Add to Pool (Initialize if doesn't exist)
        transaction.set(campaignRef, { 
          poolTotal: increment(POOL_CONTRIBUTION) 
        }, { merge: true });

        setLives(currentLives - 1); // Update local state
      });

      // Success! Start the game
      setGameState('PLAYING');
      
    } catch (e) {
      console.error("Game Start Error:", e);
      alert("Could not start game: " + e);
      window.location.href = "/"; // Go back home if failed
    }
  };

  // --- HANDLERS ---

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('OVER');
  };

  // Called by Canvas when score hits 200
  const handlePhaseTransition = () => {
    setGameState('PAUSED'); // Shows the "Hard Mode" modal
  };

  const resumeGame = () => {
    setGamePhase('HARD'); // Tell canvas to switch modes
    setGameState('PLAYING'); // Resume loop
  };

  const handleClaim = async () => {
    if (!context?.user?.fid) return;
    setIsClaiming(true);
    
    // ... (Same Claim Logic as before, just kept concise here)
    const fidString = context.user.fid.toString();
    const dateKey = new Date().toISOString().split('T')[0];
    const userRef = doc(db, 'users', fidString);
    const dailyScoreRef = doc(db, 'users', fidString, 'dailyScores', dateKey);

    try {
        // Run transaction to verify high score
        await runTransaction(db, async (t) => {
            const dailyDoc = await t.get(dailyScoreRef);
            const currentBest = dailyDoc.exists() ? dailyDoc.data().bestScore : 0;

            if (finalScore > currentBest) {
                const delta = finalScore - currentBest;
                t.set(dailyScoreRef, {
                    fid: context.user.fid,
                    date: dateKey,
                    bestScore: finalScore,
                    timestamp: serverTimestamp()
                }, { merge: true });

                t.set(userRef, {
                    weeklyScore: increment(delta),
                    lastPlayedAt: serverTimestamp()
                }, { merge: true });
            }
        });
        setClaimStatus('SUCCESS');
    } catch (error) {
        console.error("Claim Error", error);
        setClaimStatus('ERROR');
    } finally {
        setIsClaiming(false);
    }
  };

  // --- RENDER ---

  if (gameState === 'LOADING') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-neon-green animate-pulse">
            <div className="text-2xl font-bold">STARTING GAME...</div>
            <p className="text-xs text-gray-500">Spending 1 Life...</p>
        </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center">
        
        {/* TOP HUD */}
        <div className="absolute top-2 right-4 z-10 flex items-center gap-1 text-red-500 font-black bg-black/50 px-3 py-1 rounded-full">
            <Heart size={16} fill="currentColor" />
            <span>{lives}</span>
        </div>

        {/* CANVAS ENGINE */}
        <GameCanvas 
            key={gameResetKey} 
            phase={gamePhase} // Pass phase down
            onGameOver={handleGameOver}
            onPhaseTransition={handlePhaseTransition} // Callback for 200pts
            isPaused={gameState === 'PAUSED'} // Stop loop if paused
        />

        {/* END GAME BUTTON (Manual Quit) */}
        {gameState === 'PLAYING' && (
            <button 
                onClick={() => handleGameOver(finalScore)} // Pass current score? Need to get from canvas ref ideally, but for now simple quit
                className="mt-6 border-2 border-red-900/50 text-red-900 dark:text-red-500 px-6 py-2 rounded-full font-bold text-xs hover:bg-red-900/20"
            >
                END GAME
            </button>
        )}

        {/* TRANSITION MODAL */}
        {gameState === 'PAUSED' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-50">
                <div className="text-center p-6 bg-[#1E1E24] border-2 border-danger-red rounded-2xl w-64">
                    <h2 className="text-2xl font-black text-danger-red mb-2">WARNING</h2>
                    <p className="text-white text-sm mb-6">You have entered <br/> HARD MODE</p>
                    <button 
                        onClick={resumeGame}
                        className="w-full bg-danger-red text-white py-3 rounded-xl font-bold animate-pulse"
                    >
                        CONTINUE
                    </button>
                </div>
            </div>
        )}

        {/* GAME OVER MODAL */}
        {gameState === 'OVER' && (
            <GameOverModal
                score={finalScore}
                isClaiming={isClaiming}
                onClaim={handleClaim}
                onReplay={() => window.location.reload()} // Replay requires reload to pay life again
                claimStatus={claimStatus}
            />
        )}
    </div>
  );
}