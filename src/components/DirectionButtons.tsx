import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { type Direction } from '@/store/gameStore';

interface DirectionButtonsProps {
  onDirectionChange: (dir: Direction) => void;
}

export default function DirectionButtons({ onDirectionChange }: DirectionButtonsProps) {
  const btnClass = "p-4 bg-console-grey rounded-xl border border-gray-700 active:bg-neon-green active:text-black transition-colors shadow-lg touch-manipulation";

  return (
    <div className="flex gap-4 justify-center mt-6 w-full max-w-sm">
      <button 
        className={btnClass} 
        onPointerDown={(e) => { e.preventDefault(); onDirectionChange('LEFT'); }}
        aria-label="Left"
      >
        <ArrowLeft size={32} />
      </button>

      {/* Stack Up/Down in the middle for a D-pad feel, or keep horizontal as requested. 
          The user asked for horizontal arrangement. */}
      <button 
        className={btnClass} 
        onPointerDown={(e) => { e.preventDefault(); onDirectionChange('UP'); }}
        aria-label="Up"
      >
        <ArrowUp size={32} />
      </button>

      <button 
        className={btnClass} 
        onPointerDown={(e) => { e.preventDefault(); onDirectionChange('DOWN'); }}
        aria-label="Down"
      >
        <ArrowDown size={32} />
      </button>

      <button 
        className={btnClass} 
        onPointerDown={(e) => { e.preventDefault(); onDirectionChange('RIGHT'); }}
        aria-label="Right"
      >
        <ArrowRight size={32} />
      </button>
    </div>
  );
}