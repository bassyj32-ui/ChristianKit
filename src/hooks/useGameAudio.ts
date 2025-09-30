import { useCallback, useRef } from 'react';

type SoundType = 'cardFlip' | 'match' | 'noMatch' | 'gameComplete' | 'perfectMatch';

export const useGameAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        // Audio not supported
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    try {
      // Resume audio context if suspended (mobile requirement)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sound configurations
      const soundConfig = {
        cardFlip: { freq: 400, duration: 0.1, volume: 0.08 },
        match: { freq: 600, duration: 0.25, volume: 0.12 },
        noMatch: { freq: 200, duration: 0.15, volume: 0.08 },
        gameComplete: { freq: 800, duration: 0.4, volume: 0.15 },
        perfectMatch: { freq: 1000, duration: 0.3, volume: 0.15 }
      };
      
      const config = soundConfig[type];
      oscillator.frequency.setValueAtTime(config.freq, audioContext.currentTime);
      oscillator.type = type === 'noMatch' ? 'sawtooth' : 'sine';
      
      // Smooth volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(config.volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration);
      
      // Add harmonics for special sounds
      if (type === 'perfectMatch' || type === 'gameComplete') {
        const harmonic = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        harmonic.connect(harmonicGain);
        harmonicGain.connect(audioContext.destination);
        
        harmonic.frequency.setValueAtTime(config.freq * 1.5, audioContext.currentTime);
        harmonic.type = 'triangle';
        
        harmonicGain.gain.setValueAtTime(0, audioContext.currentTime);
        harmonicGain.gain.linearRampToValueAtTime(config.volume * 0.4, audioContext.currentTime + 0.05);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);
        
        harmonic.start(audioContext.currentTime + 0.05);
        harmonic.stop(audioContext.currentTime + config.duration);
      }
      
      // Clean up oscillator references
      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Oscillator already disconnected
        }
      }, (config.duration * 1000) + 100);
      
    } catch (error) {
      // Audio playback failed
    }
  }, [getAudioContext]);

  // Initialize audio context on user interaction
  const initializeAudio = useCallback(() => {
    const audioContext = getAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }, [getAudioContext]);

  return {
    playSound,
    initializeAudio
  };
};
