// 'use client';

// import { useEffect, useRef, useState, useCallback } from 'react';
// import { PALETTE } from '@/styles/palette';
// import { type Direction, type GamePhase, type Point, type Obstacle } from '@/store/gameStore';
// import DirectionButtons from './DirectionButtons';

// interface GameCanvasProps {
//   phase: GamePhase;
//   onGameOver: (score: number) => void;
//   onPhaseTransition: () => void;
//   isPaused: boolean;
// }

// const GRID_SIZE = 20; 
// const CANVAS_WIDTH = 360; 
// const CANVAS_HEIGHT = 360; 
// const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }]; 

// export default function GameCanvas({ phase, onGameOver, onPhaseTransition, isPaused }: GameCanvasProps) {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
  
//   // Game State Refs
//   const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
//   const foodRef = useRef<Point>({ x: 15, y: 15 });
//   const directionRef = useRef<Direction>('RIGHT');
//   const nextDirectionRef = useRef<Direction>('RIGHT');
//   const scoreRef = useRef(0);
//   const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  
//   // New Mechanics
//   const obstaclesRef = useRef<Obstacle[]>([]);
//   const speedRef = useRef(250); // Start at 250ms (Moderately Slow)

//   const [score, setScore] = useState(0);

//   // --- HELPERS ---
//   const getRandomPoint = (): Point => ({
//       x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
//       y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
//   });

//   const generateObstacles = (count: number) => {
//       const newObs: Obstacle[] = [];
//       for(let i=0; i<count; i++) newObs.push(getRandomPoint());
//       obstaclesRef.current = newObs;
//   };

//   const draw = (ctx: CanvasRenderingContext2D) => {
//     // 1. Background
//     ctx.fillStyle = PALETTE.darkArcadeBlack;
//     ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

//     // 2. Grid
//     ctx.strokeStyle = '#1E1E24';
//     ctx.lineWidth = 1;
//     for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
//       ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
//     }
//     for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
//       ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
//     }

//     // 3. Food
//     ctx.fillStyle = PALETTE.dangerRed;
//     const food = foodRef.current;
//     ctx.shadowBlur = 10; ctx.shadowColor = PALETTE.dangerRed;
//     ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
//     ctx.shadowBlur = 0;

//     // 4. Obstacles (Hard Mode)
//     ctx.fillStyle = '#666'; 
//     obstaclesRef.current.forEach(obs => {
//         ctx.fillRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
//     });

//     // 5. Snake
//     const snake = snakeRef.current;
//     snake.forEach((segment, index) => {
//       ctx.fillStyle = index === 0 ? PALETTE.neonSnekGreen : PALETTE.rushPurple;
//       if (index === 0) {
//         ctx.shadowBlur = 15; ctx.shadowColor = PALETTE.neonSnekGreen;
//       } else {
//         ctx.shadowBlur = 0;
//       }
//       ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
//     });
//   };

//   const update = () => {
//     if (isPaused) return;

//     const snake = [...snakeRef.current];
//     const head = { ...snake[0] };
//     const dir = nextDirectionRef.current;
//     directionRef.current = dir; 

//     switch (dir) {
//       case 'UP': head.y -= 1; break;
//       case 'DOWN': head.y += 1; break;
//       case 'LEFT': head.x -= 1; break;
//       case 'RIGHT': head.x += 1; break;
//     }

//     // Wrap Around (Always Active)
//     const maxGridX = CANVAS_WIDTH / GRID_SIZE;
//     const maxGridY = CANVAS_HEIGHT / GRID_SIZE;
//     if (head.x < 0) head.x = maxGridX - 1;
//     if (head.x >= maxGridX) head.x = 0;
//     if (head.y < 0) head.y = maxGridY - 1;
//     if (head.y >= maxGridY) head.y = 0;

//     // Self Collision
//     for (let i = 1; i < snake.length; i++) {
//       if (head.x === snake[i].x && head.y === snake[i].y) {
//           gameOver(); return;
//       }
//     }

//     // Obstacle Collision (Hard Mode)
//     if (phase === 'HARD') {
//         for (const obs of obstaclesRef.current) {
//             if (head.x === obs.x && head.y === obs.y) {
//                 gameOver(); return;
//             }
//         }
//     }

//     snake.unshift(head); 

//     const food = foodRef.current;
//     if (head.x === food.x && head.y === food.y) {
//       const newScore = scoreRef.current + 10;
//       scoreRef.current = newScore;
//       setScore(newScore);
//       foodRef.current = getRandomPoint();

//       // --- SPEED LOGIC: Increase 15% every 50 points ---
//       if (newScore > 0 && newScore % 50 === 0) {
//           speedRef.current = Math.max(50, Math.floor(speedRef.current * 0.85));
//           restartLoop(); 
//       }

//       // Hard Mode Check
//       if (newScore === 200 && phase === 'NORMAL') {
//           onPhaseTransition();
//       }

//     } else {
//       snake.pop(); 
//     }

//     snakeRef.current = snake;
//   };

//   const gameOver = () => {
//     if (gameLoopRef.current) clearInterval(gameLoopRef.current);
//     onGameOver(scoreRef.current);
//   };

//   const restartLoop = () => {
//       if (gameLoopRef.current) clearInterval(gameLoopRef.current);
//       gameLoopRef.current = setInterval(() => {
//           update();
//           const canvas = canvasRef.current;
//           if (canvas) {
//               const ctx = canvas.getContext('2d');
//               if (ctx) draw(ctx);
//           }
//       }, speedRef.current);
//   };

//   // --- CONTROLS: SWIPE & KEYBOARD ---

//   const handleDirection = useCallback((newDir: Direction) => {
//     const currentDir = directionRef.current;
//     // Prevent 180 turns
//     if (newDir === 'UP' && currentDir === 'DOWN') return;
//     if (newDir === 'DOWN' && currentDir === 'UP') return;
//     if (newDir === 'LEFT' && currentDir === 'RIGHT') return;
//     if (newDir === 'RIGHT' && currentDir === 'LEFT') return;
//     nextDirectionRef.current = newDir;
//   }, []);

//   // Touch/Swipe Logic
//   const touchStartRef = useRef<{x: number, y: number} | null>(null);
//   const onTouchStart = (e: React.TouchEvent) => {
//     touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
//   };
//   const onTouchMove = (e: React.TouchEvent) => {
//     if (!touchStartRef.current) return;
//     const xDiff = touchStartRef.current.x - e.touches[0].clientX;
//     const yDiff = touchStartRef.current.y - e.touches[0].clientY;
//     if (Math.abs(xDiff) > Math.abs(yDiff)) {
//       if (Math.abs(xDiff) > 10) {
//         handleDirection(xDiff > 0 ? 'LEFT' : 'RIGHT');
//         touchStartRef.current = null; 
//       }
//     } else {
//       if (Math.abs(yDiff) > 10) {
//         handleDirection(yDiff > 0 ? 'UP' : 'DOWN');
//         touchStartRef.current = null;
//       }
//     }
//   };

//   // Keyboard Logic
//   useEffect(() => {
//     const handleKey = (e: KeyboardEvent) => {
//       switch(e.key) {
//         case 'ArrowUp': handleDirection('UP'); break;
//         case 'ArrowDown': handleDirection('DOWN'); break;
//         case 'ArrowLeft': handleDirection('LEFT'); break;
//         case 'ArrowRight': handleDirection('RIGHT'); break;
//       }
//     };
//     window.addEventListener('keydown', handleKey);
//     return () => window.removeEventListener('keydown', handleKey);
//   }, [handleDirection]);

//   // --- LIFECYCLE ---
  
//   useEffect(() => {
//       if (phase === 'HARD' && obstaclesRef.current.length === 0) {
//           generateObstacles(5); 
//       }
//   }, [phase]);

//   useEffect(() => {
//       if (isPaused) {
//           if (gameLoopRef.current) clearInterval(gameLoopRef.current);
//       } else {
//           restartLoop();
//       }
//   }, [isPaused]);

//   useEffect(() => {
//     speedRef.current = 250; // Reset Speed
//     restartLoop();
//     return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
//   }, []);

//   return (
//     <div className="flex flex-col items-center">
//       {/* HUD (Score / Phase) */}
//       <div className="flex justify-between w-full max-w-[360px] mb-4 font-mono text-xl font-bold">
//         <div className="text-neon-green">SCORE: {score}</div>
//         <div className={phase === 'HARD' ? 'text-danger-red animate-pulse' : 'text-gray-400'}>
//             {phase}
//         </div>
//       </div>

//       {/* CANVAS */}
//       <div className={`relative border-4 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] 
//           ${phase === 'HARD' ? 'border-danger-red' : 'border-console-grey'}`}>
//         <canvas
//           ref={canvasRef}
//           width={CANVAS_WIDTH}
//           height={CANVAS_HEIGHT}
//           className="bg-arcade-black block cursor-pointer touch-none"
//           onTouchStart={onTouchStart}
//           onTouchMove={onTouchMove}
//         />
//       </div>

//       {/* CONTROLS */}
//       <DirectionButtons 
//         onDirectionChange={handleDirection} 
//         onEndGame={() => gameOver()} 
//       />
      
//       <p className="mt-4 text-xs text-gray-500">Use D-Pad, Swipe, or Arrows</p>
//     </div>
//   );
// }


/// 2222
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PALETTE } from '@/styles/palette';
import { type Direction, type GamePhase, type Point, type Obstacle } from '@/store/gameStore';
import DirectionButtons from './DirectionButtons';
import { Volume2, VolumeX } from 'lucide-react';

interface GameCanvasProps {
  phase: GamePhase;
  onGameOver: (score: number) => void;
  onPhaseTransition: () => void;
  isPaused: boolean;
}

const GRID_SIZE = 20;
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 360;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];

export default function GameCanvas({ phase, onGameOver, onPhaseTransition, isPaused }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- 1. Define Refs First (to avoid ordering issues) ---
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
  const foodRef = useRef<Point>({ x: 15, y: 15 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const scoreRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const hasEatenFirstFood = useRef(false);
  const speedRef = useRef(300); // Start at 300ms
  const waitingForFirstMoveRef = useRef(false);
  
  // This ref holds the latest update function so restartLoop can call it
  const updateRef = useRef<() => void>(() => {}); 

  // --- Audio Refs & State ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [score, setScore] = useState(0);

  // --- 2. Draw Function ---
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Background
    ctx.fillStyle = PALETTE.darkArcadeBlack;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Initial green tint
    if (!hasEatenFirstFood.current && scoreRef.current === 0) {
      ctx.fillStyle = 'rgba(0, 255, 100, 0.07)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Grid
    ctx.strokeStyle = '#1E1E24';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }

    // Food
    ctx.fillStyle = PALETTE.dangerRed;
    const food = foodRef.current;
    ctx.shadowBlur = 10;
    ctx.shadowColor = PALETTE.dangerRed;
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    ctx.shadowBlur = 0;

    // Obstacles
    ctx.fillStyle = '#666';
    obstaclesRef.current.forEach(obs => {
      ctx.fillRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });

    // Snake
    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? PALETTE.neonSnekGreen : PALETTE.rushPurple;
      if (index === 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = PALETTE.neonSnekGreen;
      }
      ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
      ctx.shadowBlur = 0;
    });
  }, []);

  // --- 3. Restart Loop Function ---
  // Defined BEFORE 'update' so 'update' can call it.
  const restartLoop = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    if (isPaused || waitingForFirstMoveRef.current) return;

    gameLoopRef.current = setInterval(() => {
      // Calls the latest version of update via ref
      updateRef.current(); 
      
      // Draw frame
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
      }
    }, speedRef.current);
  }, [isPaused, draw]);

  // --- 4. Update Logic ---
  const update = useCallback(() => {
    if (isPaused || waitingForFirstMoveRef.current) return;

    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    const dir = nextDirectionRef.current;
    directionRef.current = dir;

    // Move
    switch (dir) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Wrap around
    const maxX = CANVAS_WIDTH / GRID_SIZE;
    const maxY = CANVAS_HEIGHT / GRID_SIZE;
    if (head.x < 0) head.x = maxX - 1;
    if (head.x >= maxX) head.x = 0;
    if (head.y < 0) head.y = maxY - 1;
    if (head.y >= maxY) head.y = 0;

    // Collisions
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        onGameOver(scoreRef.current);
        return;
      }
    }
    if (phase === 'HARD') {
      for (const obs of obstaclesRef.current) {
        if (head.x === obs.x && head.y === obs.y) {
          onGameOver(scoreRef.current);
          return;
        }
      }
    }

    snake.unshift(head);

    // Food logic
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      const newScore = scoreRef.current + 10;
      scoreRef.current = newScore;
      setScore(newScore);

      if (!hasEatenFirstFood.current) hasEatenFirstFood.current = true;

      // Place new food
      foodRef.current = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
      };

      // --- Speed Logic ---
      let shouldRestart = false;

      if (newScore > 0 && newScore % 50 === 0) {
        if (newScore < 200) {
            // Normal Mode: 15% Faster
            speedRef.current = Math.max(50, Math.floor(speedRef.current * 0.85));
            shouldRestart = true;
        } 
        else if (newScore === 200) {
            // Hard Mode Entry: 10% Slower (Pause imminent)
            speedRef.current = Math.floor(speedRef.current * 1.10);
        } 
        else if (newScore > 200) {
            // Hard Mode Progression: 10% Faster
            speedRef.current = Math.max(50, Math.floor(speedRef.current * 0.90));
            shouldRestart = true;
        }
      }

      // Hard Mode Transition Trigger
      if (newScore === 200 && phase === 'NORMAL') {
        onPhaseTransition();
        waitingForFirstMoveRef.current = true;
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        return; 
      }

      if (shouldRestart) {
        restartLoop();
      }

    } else {
      snake.pop();
    }

    snakeRef.current = snake;
  }, [isPaused, phase, onGameOver, onPhaseTransition, restartLoop]);

  // --- 5. Sync Update Ref ---
  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  // --- 6. Direction Control ---
  const handleDirection = useCallback((newDir: Direction) => {
    const currentDir = directionRef.current;

    if (
      (newDir === 'UP' && currentDir === 'DOWN') ||
      (newDir === 'DOWN' && currentDir === 'UP') ||
      (newDir === 'LEFT' && currentDir === 'RIGHT') ||
      (newDir === 'RIGHT' && currentDir === 'LEFT')
    ) return;

    nextDirectionRef.current = newDir;

    // Hard Mode Resume Logic
    if (waitingForFirstMoveRef.current) {
      waitingForFirstMoveRef.current = false;
      restartLoop();
    }
  }, [restartLoop]);

  // --- 7. Inputs (Touch/Key) ---
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    // Disable swipe start for Hard Mode
    if (waitingForFirstMoveRef.current) return;

    const dx = touchStartRef.current.x - e.touches[0].clientX;
    const dy = touchStartRef.current.y - e.touches[0].clientY;
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        handleDirection(dx > 0 ? 'LEFT' : 'RIGHT');
      } else {
        handleDirection(dy > 0 ? 'UP' : 'DOWN');
      }
      touchStartRef.current = null;
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') handleDirection('UP');
      if (e.key === 'ArrowDown') handleDirection('DOWN');
      if (e.key === 'ArrowLeft') handleDirection('LEFT');
      if (e.key === 'ArrowRight') handleDirection('RIGHT');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDirection]);

  // --- 8. Audio Logic (NEW) ---
  useEffect(() => {
    // Select random soundtrack 1-5
    const randomIndex = Math.floor(Math.random() * 5) + 1;
    const audio = new Audio(`/sounds/bg-${randomIndex}.mp3`);
    audio.loop = true;
    audio.volume = 0.3; // Default volume 30%
    audioRef.current = audio;

    // Try to play automatically
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Audio play failed (waiting for interaction):", error);
      });
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Handle Mute/Unmute
  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
      }
    }
  }, [isMuted]);

  // Pause audio when game is paused or waiting
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPaused || waitingForFirstMoveRef.current) {
      audioRef.current.pause();
    } else {
      if (!isMuted) {
        audioRef.current.play().catch(e => console.log("Resume audio error:", e));
      }
    }
  }, [isPaused, isMuted, score]); // Re-check on score change (resuming)

  // --- 9. Initialization & Lifecycle ---
  useEffect(() => {
    if (phase === 'HARD' && obstaclesRef.current.length === 0) {
      const obs: Obstacle[] = [];
      for (let i = 0; i < 5; i++) {
        obs.push({
          x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
          y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
        });
      }
      obstaclesRef.current = obs;
    }
  }, [phase]);

  useEffect(() => {
    if (isPaused) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    } else {
      restartLoop();
    }
  }, [isPaused, restartLoop]);

  useEffect(() => {
    speedRef.current = 300;
    hasEatenFirstFood.current = false;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
    }

    restartLoop();

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []); // Run once on mount

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[360px] mb-4 font-mono text-xl font-bold">
        <div className="text-neon-green">SCORE: {score}</div>
        <div className={phase === 'HARD' ? 'text-danger-red animate-pulse' : 'text-gray-400'}>
          {phase}
        </div>
      </div>

      <div className={`relative border-4 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]
        ${phase === 'HARD' ? 'border-danger-red' : 'border-console-grey'}`}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-arcade-black block cursor-pointer touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        />
        
        {/* Sound Toggle Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-sm z-10"
          aria-label={isMuted ? "Unmute sound" : "Mute sound"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <DirectionButtons onDirectionChange={handleDirection} onEndGame={() => onGameOver(scoreRef.current)} />
      <p className="mt-4 text-xs text-gray-500">Use D-Pad, Swipe, or Arrows</p>
    </div>
  );
}