import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { SpeechService } from '../../services/speech';
import { Language } from '../../types';

interface AudioButtonProps {
  text: string;
  language: Language;
  variety?: string;
  audioUrl?: string | null;
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  language,
  variety = 'all',
  audioUrl,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      await SpeechService.speak(text, language, variety, audioUrl);
    } catch (err) {
      console.warn('Speech playback failed', err);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      aria-label={`Pronounce: ${text}`}
      title={`Listen to pronunciation (${language.toUpperCase()})`}
      className={`p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors ${
        isPlaying ? 'text-indigo-400 bg-slate-800 animate-pulse' : ''
      } ${className}`}
    >
      {isPlaying ? <Volume2 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
};
