import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { type Direction } from '@/store/gameStore';

interface DirectionButtonsProps {
  onDirectionChange: (dir: Direction) => void;
  onEndGame: () => void;
}

export default function DirectionButtons({ onDirectionChange, onEndGame }: DirectionButtonsProps) {
  // Common style for the directional keys
  const arrowBtnClass = "w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center active:bg-gray-700 active:scale-95 transition-all shadow-lg border border-gray-700";
  
  // Style for the center End Game button
  const centerBtnClass = "w-14 h-14 bg-red-900/50 rounded-full flex items-center justify-center active:bg-red-800 active:scale-95 transition-all border border-red-800";

  return (
    <div className="flex flex-col items-center gap-2 mt-6">
      {/* ROW 1: UP */}
      <div>
        <button 
          className={arrowBtnClass}
          onPointerDown={(e) => { e.preventDefault(); onDirectionChange('UP'); }}
        >
          <ChevronUp size={32} className="text-white" />
        </button>
      </div>

      {/* ROW 2: LEFT, CENTER, RIGHT */}
      <div className="flex gap-2">
        <button 
          className={arrowBtnClass}
          onPointerDown={(e) => { e.preventDefault(); onDirectionChange('LEFT'); }}
        >
          <ChevronLeft size={32} className="text-white" />
        </button>

        {/* CENTER BUTTON: END GAME */}
        <button 
          className={centerBtnClass}
          onClick={onEndGame}
          aria-label="End Game"
        >
          <X size={24} className="text-red-500" />
        </button>

        <button 
          className={arrowBtnClass}
          onPointerDown={(e) => { e.preventDefault(); onDirectionChange('RIGHT'); }}
        >
          <ChevronRight size={32} className="text-white" />
        </button>
      </div>

      {/* ROW 3: DOWN */}
      <div>
        <button 
          className={arrowBtnClass}
          onPointerDown={(e) => { e.preventDefault(); onDirectionChange('DOWN'); }}
        >
          <ChevronDown size={32} className="text-white" />
        </button>
      </div>
      
      <p className="text-[10px] text-gray-500 mt-2">Center button ends game</p>
    </div>
  );
}