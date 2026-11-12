import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePreferences } from './PreferencesContext';

interface VoiceContextType {
  isSpeaking: boolean;
  isListening: boolean;
  isSpeechSupported: boolean;
  isRecognitionSupported: boolean;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  startListening: (onResult: (transcript: string) => void) => void;
  stopListening: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = usePreferences();
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9); // Slightly slower for clear elderly comprehension
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState<boolean>(false);

  useEffect(() => {
    setIsSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    setIsRecognitionSupported(
      typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text: string) => {
    if (!isSpeechSupported) return;
    stopSpeaking();

    // Clean markdown/bullet points for smooth spoken speech
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\[Source:.*?\]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick best matching voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    const voice = voices.find(v => v.lang === langCode || v.lang.startsWith(language));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = langCode;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  let recognitionInstance: any = null;

  const startListening = (onResult: (transcript: string) => void) => {
    if (!isRecognitionSupported) {
      console.warn('Speech recognition is not supported in this browser environment.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionInstance = new SpeechRecognition();

    const langCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    recognitionInstance.lang = langCode;
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;

    recognitionInstance.onstart = () => setIsListening(true);
    recognitionInstance.onend = () => setIsListening(false);
    recognitionInstance.onerror = () => setIsListening(false);

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onResult(transcript);
      }
    };

    recognitionInstance.start();
  };

  const stopListening = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
    }
  };

  return (
    <VoiceContext.Provider
      value={{
        isSpeaking,
        isListening,
        isSpeechSupported,
        isRecognitionSupported,
        speechRate,
        setSpeechRate,
        speak,
        stopSpeaking,
        startListening,
        stopListening
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within VoiceProvider');
  return context;
};
