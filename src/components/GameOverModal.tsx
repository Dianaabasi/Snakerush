'use client';

import { Trophy, RefreshCcw, House } from 'lucide-react';
import Link from 'next/link';

interface GameOverModalProps {
  score: number;
  isClaiming: boolean;
  onClaim: () => void;
  onReplay: () => void;
  claimStatus: 'IDLE' | 'SUCCESS' | 'ERROR';
}

export default function GameOverModal({ 
  score, 
  isClaiming, 
  onClaim, 
  onReplay,
  claimStatus
}: GameOverModalProps) {
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-console-grey border-2 border-rush-purple p-8 rounded-2xl w-full max-w-sm text-center shadow-[0_0_50px_rgba(138,43,226,0.4)]">
        
        <h2 className="text-3xl font-black text-danger-red mb-2 tracking-widest">
          GAME OVER
        </h2>
        
        <div className="my-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider font-bold">Final Score</p>
          <p className="text-6xl font-black text-gray-900 dark:text-white drop-shadow-md">
            {score}
          </p>
        </div>

        <div className="space-y-3">
          {/* CLAIM BUTTON */}
          {claimStatus === 'SUCCESS' ? (
            <div className="p-3 bg-green-900/50 border border-neon-green text-neon-green rounded-xl font-bold mb-4">
              ✅ Score Saved!
            </div>
          ) : (
            <button
              onClick={onClaim}
              disabled={isClaiming || score === 0}
              className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all
                ${isClaiming || score === 0 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-neon-green text-black hover:scale-105 shadow-[0_0_15px_rgba(57,255,20,0.5)]'
                }`}
            >
              <Trophy size={20} />
              {isClaiming ? 'SAVING...' : 'CLAIM POINTS'}
            </button>
          )}

          {/* REPLAY BUTTON */}
          <button
            onClick={() => {
              if (claimStatus === 'IDLE' && score > 0) {
                onClaim();
              }
              onReplay();
            }}
            className="w-full py-3 bg-transparent border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} />
            PLAY AGAIN
          </button>

          {/* HOME BUTTON */}
          <Link 
            href="/"
            onClick={() => {
              if (claimStatus === 'IDLE' && score > 0) {
                onClaim();
              }
            }}
            className="w-full py-3 bg-transparent border-2 border-gray-700 text-gray-400 font-bold rounded-xl hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <House size={18} />
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}