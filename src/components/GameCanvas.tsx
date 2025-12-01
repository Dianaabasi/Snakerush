'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PALETTE } from '@/styles/palette';
import { type Direction, type GamePhase, type Point, type Obstacle } from '@/store/gameStore';
import DirectionButtons from './DirectionButtons';

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
  
  // State Refs
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
  const foodRef = useRef<Point>({ x: 15, y: 15 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const scoreRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mechanics Refs
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(250); // Start Slow (250ms)

  const [score, setScore] = useState(0);

  // --- HELPERS ---
  const getRandomPoint = (): Point => ({
      x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
  });

  const generateObstacles = (count: number) => {
      const newObs: Obstacle[] = [];
      for(let i=0; i<count; i++) newObs.push(getRandomPoint());
      obstaclesRef.current = newObs;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // 1. Background (Old Style)
    ctx.fillStyle = PALETTE.darkArcadeBlack;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Grid (Old Style)
    ctx.strokeStyle = '#1E1E24';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }

    // 3. Food
    ctx.fillStyle = PALETTE.dangerRed;
    const food = foodRef.current;
    ctx.shadowBlur = 10; ctx.shadowColor = PALETTE.dangerRed;
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    ctx.shadowBlur = 0;

    // 4. Obstacles (Hard Mode)
    ctx.fillStyle = '#666'; // Visible Grey Blocks
    obstaclesRef.current.forEach(obs => {
        ctx.fillRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });

    // 5. Snake (Old Style)
    const snake = snakeRef.current;
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? PALETTE.neonSnekGreen : PALETTE.rushPurple;
      if (index === 0) {
        ctx.shadowBlur = 15; ctx.shadowColor = PALETTE.neonSnekGreen;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });
  };

  const update = () => {
    if (isPaused) return;

    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    const dir = nextDirectionRef.current;
    directionRef.current = dir; 

    switch (dir) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Wrap Around (Old Style Logic)
    const maxGridX = CANVAS_WIDTH / GRID_SIZE;
    const maxGridY = CANVAS_HEIGHT / GRID_SIZE;
    if (head.x < 0) head.x = maxGridX - 1;
    if (head.x >= maxGridX) head.x = 0;
    if (head.y < 0) head.y = maxGridY - 1;
    if (head.y >= maxGridY) head.y = 0;

    // Self Collision
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
          gameOver(); return;
      }
    }

    // Obstacle Collision (Hard Mode)
    if (phase === 'HARD') {
        for (const obs of obstaclesRef.current) {
            if (head.x === obs.x && head.y === obs.y) {
                gameOver(); return;
            }
        }
    }

    snake.unshift(head); 

    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      const newScore = scoreRef.current + 10;
      scoreRef.current = newScore;
      setScore(newScore);
      foodRef.current = getRandomPoint();

      // --- SPEED LOGIC UPDATE ---
      // Every 40 points, increase speed moderately (reduce delay by 15%)
      // Cap at 60ms so it doesn't become instant.
      if (newScore > 0 && newScore % 40 === 0) {
          speedRef.current = Math.max(60, Math.floor(speedRef.current * 0.85));
          restartLoop(); 
      }

      // Hard Mode Check
      if (newScore === 200 && phase === 'NORMAL') {
          onPhaseTransition();
      }

    } else {
      snake.pop(); 
    }

    snakeRef.current = snake;
  };

  const gameOver = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    onGameOver(scoreRef.current);
  };

  const restartLoop = () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(() => {
          update();
          const canvas = canvasRef.current;
          if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) draw(ctx);
          }
      }, speedRef.current);
  };

  // --- LIFECYCLE ---
  
  useEffect(() => {
      if (phase === 'HARD' && obstaclesRef.current.length === 0) {
          generateObstacles(5); 
      }
  }, [phase]);

  useEffect(() => {
      if (isPaused) {
          if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      } else {
          restartLoop();
      }
  }, [isPaused]);

  useEffect(() => {
    speedRef.current = 250; // Start Slow
    restartLoop();
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, []);

  const handleDirection = useCallback((newDir: Direction) => {
    nextDirectionRef.current = newDir;
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* HUD: Score - Phase (Lives moved to parent Page.tsx) */}
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
        />
      </div>

      {/* NEW CONTROLS with Center Button Logic */}
      <DirectionButtons 
        onDirectionChange={handleDirection} 
        onEndGame={() => gameOver()} 
      />
    </div>
  );
}