import { useCallback } from 'react';

interface GameSaveData {
  bestScore: number;
  lastPlayed: string;
  gamesPlayed: number;
  totalMatches: number;
  totalTime: number;
}

export const useGameSave = () => {
  const SAVE_KEY = 'bible-memory-game-save';

  const loadGameData = useCallback((): GameSaveData => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading game data:', error);
    }
    
    return {
      bestScore: 0,
      lastPlayed: '',
      gamesPlayed: 0,
      totalMatches: 0,
      totalTime: 0
    };
  }, []);

  const saveGameData = useCallback((data: Partial<GameSaveData>) => {
    try {
      const current = loadGameData();
      const updated = {
        ...current,
        ...data,
        lastPlayed: new Date().toISOString()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error saving game data:', error);
      return loadGameData();
    }
  }, [loadGameData]);

  const updateBestScore = useCallback((newScore: number) => {
    const current = loadGameData();
    if (newScore > current.bestScore) {
      return saveGameData({ bestScore: newScore });
    }
    return current;
  }, [loadGameData, saveGameData]);

  const recordGameComplete = useCallback((score: number, matches: number, timeElapsed: number) => {
    const current = loadGameData();
    const updated = saveGameData({
      bestScore: Math.max(score, current.bestScore),
      gamesPlayed: current.gamesPlayed + 1,
      totalMatches: current.totalMatches + matches,
      totalTime: current.totalTime + timeElapsed
    });
    
    return {
      ...updated,
      isNewBest: score > current.bestScore
    };
  }, [loadGameData, saveGameData]);

  const clearGameData = useCallback(() => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      console.error('Error clearing game data:', error);
    }
  }, []);

  return {
    loadGameData,
    saveGameData,
    updateBestScore,
    recordGameComplete,
    clearGameData
  };
};
