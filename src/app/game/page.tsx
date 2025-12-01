'use client';

import { useState, useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';
import { doc, runTransaction, getDoc, serverTimestamp, increment } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import { GamePhase } from '@/store/gameStore';
import GameCanvas from '@/components/GameCanvas';
import GameOverModal from '@/components/GameOverModal';
import { getCurrentWeekID } from '@/lib/utils';
import Link from 'next/link'; // Added for Back to Home button
import { ShoppingCart } from 'lucide-react'; // Icon for store

type FrameContext = Awaited<typeof sdk.context>;

const POOL_CONTRIBUTION = 0.25;

export default function GamePage() {
  const [context, setContext] = useState<FrameContext>();
  // Added 'NO_LIVES' state
  const [gameState, setGameState] = useState<'LOADING' | 'NO_LIVES' | 'PLAYING' | 'PAUSED' | 'OVER'>('LOADING');
  const [finalScore, setFinalScore] = useState(0);
  const [lives, setLives] = useState<number>(0);
  
  const [gameResetKey, setGameResetKey] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('NORMAL');

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    const init = async () => {
      const ctx = await sdk.context;
      setContext(ctx);
      sdk.actions.ready();

      if (ctx?.user?.fid) {
        await checkLivesAndStart(ctx.user.fid);
      }
    };
    init();
  }, []);

  // --- CORE LOGIC ---
  const checkLivesAndStart = async (fid: number) => {
    const userRef = doc(db, 'users', fid.toString());
    
    try {
        // 1. Check Lives First
        const userSnap = await getDoc(userRef);
        const currentLives = userSnap.exists() ? (userSnap.data().lives || 0) : 0;
        setLives(currentLives);

        if (currentLives <= 0) {
            setGameState('NO_LIVES');
            return;
        }

        // 2. If lives exist, run transaction to deduct 1 and start
        await startGameTransaction(fid);

    } catch (e) {
        console.error("Init Error:", e);
    }
  };

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

        transaction.update(userRef, { lives: currentLives - 1 });
        
        transaction.set(campaignRef, { 
          poolTotal: increment(POOL_CONTRIBUTION) 
        }, { merge: true });

        setLives(currentLives - 1); 
      });

      setGameState('PLAYING');
      
    } catch (e) {
      console.error("Game Start Error:", e);
      setGameState('NO_LIVES'); // Fallback if transaction fails due to lives
    }
  };

  // --- HANDLERS ---

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('OVER');
  };

  const handlePhaseTransition = () => {
    setGameState('PAUSED'); 
  };

  const resumeGame = () => {
    setGamePhase('HARD'); 
    setGameState('PLAYING'); 
  };

  const handleClaim = async () => {
    if (!context?.user?.fid) return;
    setIsClaiming(true);
    
    const fidString = context.user.fid.toString();
    const dateKey = new Date().toISOString().split('T')[0];
    const userRef = doc(db, 'users', fidString);
    const dailyScoreRef = doc(db, 'users', fidString, 'dailyScores', dateKey);

    try {
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
            <div className="text-2xl font-bold">Checking Lives...</div>
        </div>
    );
  }

  // NEW: No Lives View
  if (gameState === 'NO_LIVES') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            <div className="text-6xl">💔</div>
            <h1 className="text-3xl font-black text-danger-red">OUT OF LIVES</h1>
            <p className="text-gray-400 text-sm max-w-xs">
                You need lives to play. Buy a ticket to replenish your energy!
            </p>
            
            <Link href="/" className="w-full max-w-xs">
                <button className="w-full bg-rush-purple hover:bg-purple-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(138,43,226,0.4)]">
                    <ShoppingCart size={20} />
                    GET TICKETS
                </button>
            </Link>
        </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center">
        
        {/* CANVAS ENGINE */}
        <GameCanvas 
            key={gameResetKey} 
            phase={gamePhase} 
            lives={lives} // Pass lives to display in HUD
            onGameOver={handleGameOver}
            onPhaseTransition={handlePhaseTransition} 
            isPaused={gameState === 'PAUSED'} 
        />

        {/* END GAME BUTTON */}
        {gameState === 'PLAYING' && (
            <button 
                onClick={() => handleGameOver(finalScore)}
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
                onReplay={() => window.location.reload()} 
                claimStatus={claimStatus}
            />
        )}
    </div>
  );
}