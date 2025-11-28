export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Difficulty = 'EASY' | 'HARD';
export type GameStatus = 'IDLE' | 'PLAYING' | 'GAME_OVER';

export interface Point {
  x: number;
  y: number;
}