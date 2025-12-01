export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// The game now evolves from Normal -> Hard dynamically
export type GamePhase = 'NORMAL' | 'HARD';

// Added PAUSED_TRANSITION for the "Hard Mode Unlocked" popup state
export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED_TRANSITION' | 'GAME_OVER';

export interface Point {
  x: number;
  y: number;
}

// New: Obstacles that appear in Hard Mode
export interface Obstacle {
  x: number;
  y: number;
}