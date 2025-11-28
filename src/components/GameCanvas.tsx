'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PALETTE } from '@/styles/palette';
import { type Direction, type Difficulty, type Point, type GameStatus } from '@/store/gameStore';
import DirectionButtons from './DirectionButtons';

interface GameCanvasProps {
  difficulty: Difficulty;
  onGameOver: (score: number) => void;
}

// Game Constants
const GRID_SIZE = 20; 
const CANVAS_WIDTH = 360; 
const CANVAS_HEIGHT = 360; 
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];  

export default function GameCanvas({ difficulty, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
  const foodRef = useRef<Point>({ x: 15, y: 15 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const scoreRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // UI State
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<GameStatus>('IDLE');

  // --- HELPERS ---

  const getRandomFood = (): Point => {
    return {
      x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
    };
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // 1. Clear Screen
    ctx.fillStyle = PALETTE.darkArcadeBlack;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw Grid
    ctx.strokeStyle = '#1E1E24';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }

    // 3. Draw Food
    ctx.fillStyle = PALETTE.dangerRed;
    const food = foodRef.current;
    ctx.shadowBlur = 10;
    ctx.shadowColor = PALETTE.dangerRed;
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    ctx.shadowBlur = 0;

    // 4. Draw Snake
    const snake = snakeRef.current;
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? PALETTE.neonSnekGreen : PALETTE.rushPurple;
      if (index === 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = PALETTE.neonSnekGreen;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });
  };

  const checkCollision = (head: Point, snake: Point[]) => {
    // Self Collision
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    // Wall Collision (Hard Mode)
    if (difficulty === 'HARD') {
      const maxGridX = CANVAS_WIDTH / GRID_SIZE;
      const maxGridY = CANVAS_HEIGHT / GRID_SIZE;
      if (head.x < 0 || head.x >= maxGridX || head.y < 0 || head.y >= maxGridY) {
        return true;
      }
    }
    return false;
  };

  const gameOver = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    setStatus('GAME_OVER');
    onGameOver(scoreRef.current);
  };

  const update = () => {
    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    const dir = nextDirectionRef.current;
    directionRef.current = dir; 

    // Move Head
    switch (dir) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Easy Mode Wrapping
    if (difficulty === 'EASY') {
      const maxGridX = CANVAS_WIDTH / GRID_SIZE;
      const maxGridY = CANVAS_HEIGHT / GRID_SIZE;
      if (head.x < 0) head.x = maxGridX - 1;
      if (head.x >= maxGridX) head.x = 0;
      if (head.y < 0) head.y = maxGridY - 1;
      if (head.y >= maxGridY) head.y = 0;
    }

    if (checkCollision(head, snake)) {
      gameOver();
      return;
    }

    snake.unshift(head); 

    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      foodRef.current = getRandomFood();
    } else {
      snake.pop(); 
    }

    snakeRef.current = snake;
  };

  // --- CONTROLS ---

  const handleDirection = useCallback((newDir: Direction) => {
    const currentDir = directionRef.current;
    if (newDir === 'UP' && currentDir === 'DOWN') return;
    if (newDir === 'DOWN' && currentDir === 'UP') return;
    if (newDir === 'LEFT' && currentDir === 'RIGHT') return;
    if (newDir === 'RIGHT' && currentDir === 'LEFT') return;
    nextDirectionRef.current = newDir;
  }, []);

  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const xDiff = touchStartRef.current.x - e.touches[0].clientX;
    const yDiff = touchStartRef.current.y - e.touches[0].clientY;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (Math.abs(xDiff) > 10) {
        handleDirection(xDiff > 0 ? 'LEFT' : 'RIGHT');
        touchStartRef.current = null; 
      }
    } else {
      if (Math.abs(yDiff) > 10) {
        handleDirection(yDiff > 0 ? 'UP' : 'DOWN');
        touchStartRef.current = null;
      }
    }
  };

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp': handleDirection('UP'); break;
        case 'ArrowDown': handleDirection('DOWN'); break;
        case 'ArrowLeft': handleDirection('LEFT'); break;
        case 'ArrowRight': handleDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleDirection]);

  // --- LIFECYCLE ---

  const startGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    foodRef.current = getRandomFood();
    scoreRef.current = 0;
    setScore(0);
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    setStatus('PLAYING');

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    const gameSpeedDelay = difficulty === 'HARD' ? 150 : 100;
    
    gameLoopRef.current = setInterval(() => {
      update();
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
      }
    }, gameSpeedDelay);
  };

  // Initial Draw
  useEffect(() => {
    startGame();
    
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <div className="flex flex-col items-center">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-[360px] mb-4 font-mono text-xl font-bold">
        <div className="text-neon-green">SCORE: {score}</div>
        <div className="text-gray-400">{difficulty}</div>
      </div>

      {/* GAME BOARD */}
      <div className="relative border-4 border-console-grey rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-arcade-black block cursor-pointer touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        />
        
        {status === 'GAME_OVER' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-danger-red text-3xl font-black tracking-widest animate-pulse">
              GAME OVER
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <DirectionButtons onDirectionChange={handleDirection} />

      <p className="mt-4 text-xs text-gray-500">Use arrow keys or swipe to control the snake.</p>
    </div>
  );
}