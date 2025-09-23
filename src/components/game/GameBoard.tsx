import React from 'react';
import { GameCard } from './GameCard';

interface Card {
  id: string;
  content: string;
  type: 'verse' | 'reference';
  pairId: string;
  flipped: boolean;
  matched: boolean;
}

interface GameBoardProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  disabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  cards, 
  onCardClick, 
  disabled, 
  difficulty 
}) => {
  const getGridLayout = () => {
    switch (difficulty) {
      case 'easy':
        return 'grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-md sm:max-w-2xl';
      case 'medium':
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 max-w-lg sm:max-w-3xl';
      case 'hard':
        return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 sm:gap-2 max-w-xl sm:max-w-4xl';
      default:
        return 'grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-md sm:max-w-2xl';
    }
  };

  return (
    <div className="flex justify-center w-full px-2 sm:px-4">
      <div className={`
        grid ${getGridLayout()}
        w-full mx-auto
        transition-all duration-300 ease-in-out
      `}>
        {cards.map((card) => (
          <GameCard
            key={card.id}
            card={card}
            onClick={onCardClick}
            disabled={disabled}
            level={difficulty}
          />
        ))}
      </div>
    </div>
  );
};
