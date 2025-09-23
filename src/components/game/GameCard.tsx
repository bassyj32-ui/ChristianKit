import React from 'react';

interface Card {
  id: string;
  content: string;
  type: 'verse' | 'reference';
  pairId: string;
  flipped: boolean;
  matched: boolean;
}

interface GameCardProps {
  card: Card;
  onClick: (card: Card) => void;
  disabled: boolean;
  level: 'easy' | 'medium' | 'hard';
}

export const GameCard: React.FC<GameCardProps> = ({ card, onClick, disabled, level }) => {
  const getLevelTheme = () => {
    switch (level) {
      case 'easy':
        return {
          bg: 'from-emerald-500 to-teal-600',
          border: 'border-emerald-400',
          shadow: 'shadow-emerald-500/25',
          glow: 'shadow-emerald-500/50'
        };
      case 'medium':
        return {
          bg: 'from-amber-500 to-orange-600',
          border: 'border-amber-400',
          shadow: 'shadow-amber-500/25',
          glow: 'shadow-amber-500/50'
        };
      case 'hard':
        return {
          bg: 'from-purple-500 to-indigo-600',
          border: 'border-purple-400',
          shadow: 'shadow-purple-500/25',
          glow: 'shadow-purple-500/50'
        };
      default:
        return {
          bg: 'from-blue-500 to-blue-600',
          border: 'border-blue-400',
          shadow: 'shadow-blue-500/25',
          glow: 'shadow-blue-500/50'
        };
    }
  };

  const theme = getLevelTheme();

  const handleClick = () => {
    if (!disabled && !card.flipped && !card.matched) {
      onClick(card);
    }
  };

  return (
    <div
      className={`
        relative w-full aspect-square cursor-pointer
        transform transition-all duration-300 ease-out
        ${card.flipped || card.matched ? 'scale-105' : 'scale-100 hover:scale-102'}
        ${card.matched ? `shadow-lg ${theme.glow}` : `shadow-md ${theme.shadow}`}
        ${disabled ? 'cursor-not-allowed opacity-75' : 'hover:shadow-lg'}
      `}
      onClick={handleClick}
    >
      <div
        className={`
          w-full h-full rounded-xl border-2 ${theme.border}
          transition-all duration-500 ease-in-out
          ${card.flipped || card.matched ? 'transform-none' : 'transform'}
          perspective-1000
        `}
        style={{
          transformStyle: 'preserve-3d',
          transform: card.flipped || card.matched ? 'rotateY(0deg)' : 'rotateY(180deg)'
        }}
      >
        {/* Card Back */}
        <div
          className={`
            absolute inset-0 w-full h-full rounded-xl
            bg-gradient-to-br ${theme.bg}
            flex items-center justify-center
            backface-hidden
          `}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="text-white text-2xl md:text-3xl font-bold">
            ✝️
          </div>
        </div>

        {/* Card Front */}
        <div
          className={`
            absolute inset-0 w-full h-full rounded-xl
            bg-white border-2 ${theme.border}
            flex flex-col items-center justify-center p-2 md:p-4
            backface-hidden
            ${card.matched ? `bg-gradient-to-br from-white to-${level === 'easy' ? 'emerald' : level === 'medium' ? 'amber' : 'purple'}-50` : ''}
          `}
          style={{
            backfaceVisibility: 'hidden'
          }}
        >
          <div className={`
            text-center text-xs sm:text-sm md:text-base lg:text-lg
            font-medium text-gray-800 leading-tight
            ${card.type === 'verse' ? 'text-gray-700' : 'text-blue-700 font-semibold'}
          `}>
            {card.content}
          </div>
          
          {card.matched && (
            <div className="absolute top-2 right-2">
              <div className="text-green-500 text-lg animate-bounce">
                ✓
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Match Animation */}
      {card.matched && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full rounded-xl animate-pulse bg-green-400/20"></div>
        </div>
      )}
    </div>
  );
};
