import { Check, X } from 'lucide-react';

export interface DayStat {
  dayName: string; // 'M', 'T', 'W', etc.
  date: string;    // '2025-11-26'
  score: number;
  played: boolean;
  isToday: boolean;
}

interface StreakGridProps {
  days: DayStat[];
}

export default function StreakGrid({ days }: StreakGridProps) {
  return (
    <div className="w-full bg-console-grey p-5 rounded-xl border border-gray-800 shadow-lg mb-6">
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 text-center">
        Weekly Streak
      </h3>
      
      <div className="flex justify-between items-center gap-2">
        {days.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-2">
            
            {/* The Circle Indicator */}
            <div 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                ${day.played 
                  ? 'bg-neon-green border-neon-green text-black shadow-[0_0_10px_#39FF14]' 
                  : 'bg-transparent border-gray-700 text-gray-700'}
                ${day.isToday && !day.played ? 'border-dashed border-white text-white animate-pulse' : ''}
              `}
            >
              {day.played ? (
                <Check size={20} strokeWidth={4} />
              ) : (
                <span className="text-xs font-bold">{day.dayName}</span>
              )}
            </div>

            {/* Score Label (Tiny) */}
            <span className={`text-[10px] font-mono ${day.played ? 'text-neon-green' : 'text-gray-600'}`}>
              {day.played ? day.score : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}