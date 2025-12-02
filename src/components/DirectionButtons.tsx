import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { type Direction } from '@/store/gameStore';

interface DirectionButtonsProps {
  onDirectionChange: (dir: Direction) => void;
  onEndGame: () => void;
}

export default function DirectionButtons({ onDirectionChange, onEndGame }: DirectionButtonsProps) {
  // Arrow Button Style
  const btnClass = "w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center active:bg-gray-700 active:scale-95 transition-all shadow-lg border border-gray-700 touch-manipulation";
  
  // End Game Button Style
  const endBtnClass = "mt-6 px-6 py-2 bg-red-900/30 border border-red-800 rounded-full flex items-center justify-center gap-2 text-red-500 font-bold active:scale-95 transition-all";

  return (
    <div className="flex flex-col items-center mt-6 w-full max-w-xs">
      
      {/* CONTROL PAD (CROSS LAYOUT) */}
      <div className="flex flex-col items-center gap-2">
        {/* UP */}
        <button 
          className={btnClass}
          onPointerDown={(e) => { e.preventDefault(); onDirectionChange('UP'); }}
        >
          <ChevronUp size={32} className="text-white" />
        </button>

        {/* LEFT / RIGHT */}
        <div className="flex gap-14"> {/* Gap creates the cross shape */}
          <button 
            className={btnClass}
            onPointerDown={(e) => { e.preventDefault(); onDirectionChange('LEFT'); }}
          >
            <ChevronLeft size={32} className="text-white" />
          </button>

          <button 
            className={btnClass}
            onPointerDown={(e) => { e.preventDefault(); onDirectionChange('RIGHT'); }}
          >
            <ChevronRight size={32} className="text-white" />
          </button>
        </div>

        {/* DOWN */}
        <button 
          className={btnClass}
          onPointerDown={(e) => { e.preventDefault(); onDirectionChange('DOWN'); }}
        >
          <ChevronDown size={32} className="text-white" />
        </button>
      </div>

      {/* END GAME BUTTON (Below Controls) */}
      <button 
        className={endBtnClass}
        onClick={onEndGame}
      >
        <X size={18} />
        END GAME
      </button>
      
    </div>
  );
}