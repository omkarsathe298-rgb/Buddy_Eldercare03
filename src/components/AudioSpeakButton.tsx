import React from 'react';
import { Volume2, Square } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import { usePreferences } from '../context/PreferencesContext';

interface AudioSpeakButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioSpeakButton: React.FC<AudioSpeakButtonProps> = ({
  text,
  className = '',
  size = 'md'
}) => {
  const { speak, stopSpeaking, isSpeaking, isSpeechSupported } = useVoice();
  const { t } = usePreferences();

  if (!isSpeechSupported) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-sm gap-1.5',
    md: 'px-3.5 py-1.5 text-base gap-2',
    lg: 'px-4 py-2 text-lg gap-2.5'
  }[size];

  return (
    <button
      onClick={handleClick}
      aria-label={isSpeaking ? t('stopSpeaking') : t('speakAloud')}
      className={`inline-flex items-center font-medium rounded-lg border transition-colors cursor-pointer select-none ${
        isSpeaking
          ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
      } ${sizeClasses} ${className}`}
    >
      {isSpeaking ? (
        <>
          <Square className="w-4 h-4 fill-current text-rose-600 animate-pulse" />
          <span>{t('stopSpeaking')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-emerald-700" />
          <span>{t('speakAloud')}</span>
        </>
      )}
    </button>
  );
};
