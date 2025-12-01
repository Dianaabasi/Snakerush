'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PALETTE } from '@/styles/palette';
import { type Direction, type GamePhase, type Point, type Obstacle } from '@/store/gameStore';
import DirectionButtons from './DirectionButtons';
import { Heart } from 'lucide-react'; // Import Heart

interface GameCanvasProps {
  phase: GamePhase;
  lives: number; // Added lives prop
  onGameOver: (score: number) => void;
  onPhaseTransition: () => void;
  isPaused: boolean;
}

const GRID_SIZE = 20; 
const CANVAS_WIDTH = 360; 
const CANVAS_HEIGHT = 360; 
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }]; 

export default function GameCanvas({ phase, lives, onGameOver, onPhaseTransition, isPaused }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
  const foodRef = useRef<Point>({ x: 15, y: 15 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const scoreRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  
  // FIX: Start really slow (400ms)
  const speedRef = useRef(400);

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
    ctx.fillStyle = PALETTE.darkArcadeBlack;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Food
    ctx.fillStyle = PALETTE.dangerRed;
    const food = foodRef.current;
    ctx.shadowBlur = 10; ctx.shadowColor = PALETTE.dangerRed;
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    ctx.shadowBlur = 0;

    // Obstacles
    ctx.fillStyle = '#555'; 
    obstaclesRef.current.forEach(obs => {
        ctx.fillRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });

    // Snake
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

    // Always Wrap
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

    // Obstacle Collision
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

      // FIX: SPEED SCALING (x2 every 30 points)
      if (newScore > 0 && newScore % 30 === 0) {
          // speed / 2 = double speed. Cap at 30ms to prevent bugs.
          speedRef.current = Math.max(30, speedRef.current / 2); 
          restartLoop(); 
      }

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
    speedRef.current = 400; // Reset to slow speed on mount
    restartLoop();
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, []);

  const handleDirection = useCallback((newDir: Direction) => {
    nextDirectionRef.current = newDir;
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      {/* HUD - Centered Life Bar */}
      <div className="flex justify-between items-center w-full max-w-[360px] mb-4 font-mono text-xl font-bold">
        {/* Left: Score */}
        <div className="text-neon-green w-24">SCORE: {score}</div>
        
        {/* Center: Lives */}
        <div className="flex items-center gap-2 text-danger-red">
            <Heart size={24} fill="currentColor" />
            <span>{lives}</span>
        </div>

        {/* Right: Phase */}
        <div className={`w-24 text-right ${phase === 'HARD' ? 'text-danger-red animate-pulse' : 'text-gray-400'}`}>
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

      <DirectionButtons onDirectionChange={handleDirection} />
      <p className="mt-4 text-xs text-gray-500">Use arrow keys or swipe to control the snake.</p>
    </div>
  );
}