import { User, Trophy, Medal } from 'lucide-react';

export interface LeaderboardEntry {
  fid: number;
  username: string;
  pfpUrl: string;
  score: number;
  rank: number;
  earnings?: number; // Add earnings field
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserFid?: number;
}

export default function LeaderboardTable({ entries, currentUserFid }: LeaderboardTableProps) {
  
  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Trophy size={20} className="text-[#FFD700]" />; 
      case 2: return <Medal size={20} className="text-[#C0C0C0]" />;  
      case 3: return <Medal size={20} className="text-[#CD7F32]" />;  
      default: return <span className="font-mono text-gray-500">#{rank}</span>;
    }
  };

  return (
    <div className="w-full max-w-sm bg-console-grey rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/20">
        <span className="text-xs font-bold text-gray-500 uppercase w-8 text-center">#</span>
        <span className="text-xs font-bold text-gray-500 uppercase flex-1 px-2">Player</span>
        <span className="text-xs font-bold text-gray-500 uppercase w-12 text-right">Score</span>
        <span className="text-xs font-bold text-gray-500 uppercase w-16 text-right">Earn</span>
      </div>

      <div className="divide-y divide-gray-800">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No scores yet this week. Be the first!
          </div>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.fid}
              className={`flex items-center justify-between p-3 hover:bg-white/5 transition-colors
                ${entry.fid === currentUserFid ? 'bg-rush-purple/20 border-l-4 border-rush-purple' : ''}
              `}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>

              <div className="flex-1 flex items-center gap-2 px-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  {entry.pfpUrl ? (
                    <img src={entry.pfpUrl} alt={entry.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User size={12}/></div>
                  )}
                </div>
                <span className={`text-sm font-bold truncate ${entry.fid === currentUserFid ? 'text-neon-green' : 'text-white'}`}>
                  {entry.username || `FID: ${entry.fid}`}
                </span>
              </div>

              <div className="w-12 text-right font-mono font-bold text-white text-sm">
                {entry.score}
              </div>

              <div className="w-16 text-right font-mono font-bold text-neon-green text-xs">
                {entry.earnings ? `$${entry.earnings.toFixed(2)}` : '-'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}