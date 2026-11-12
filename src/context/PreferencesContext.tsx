import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppLanguage, FontSize } from '../types';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    appName: 'Buddy Elder AI',
    tagline: 'Your Patient Digital Friend & Guide',
    emergencyHelpline: 'Emergency (Police/Ambulance): 112 | Cyber Fraud: 1930',
    navHome: 'Home',
    navChat: 'Talk with Buddy',
    navLessons: 'Digital Learning',
    navSafety: 'Scam & Fraud Defense',
    navWellness: 'Daily Wellness',
    navCaregiver: 'Family & Caregiver',
    navAdmin: 'Admin & System',
    fontSize: 'Font Size',
    language: 'Language',
    login: 'Log In',
    register: 'Sign Up',
    logout: 'Log Out',
    welcomeBack: 'Namaste',
    askBuddyPlaceholder: 'Ask Buddy anything about WhatsApp, payments, or your phone...',
    micTip: 'Tap to speak',
    listening: 'Listening... please speak now',
    speakAloud: 'Read aloud',
    stopSpeaking: 'Stop voice',
    call1930: 'Dial 1930 Cyber Fraud Helpline',
    call112: 'Dial 112 Emergency',
    verifiedSources: 'Verified Official Guidance',
    newChat: 'New Conversation',
    send: 'Send',
    clearChat: 'Clear Messages',
    scamScannerTitle: 'Scam & Fake Message Scanner',
    scamScannerDesc: 'Paste any suspicious SMS, WhatsApp message, or email to verify if it is a fraud.',
    scanButton: 'Analyze Message with Buddy',
    todayWellness: 'Today\'s Wellness Check-In',
    waterCounter: 'Glasses of Water',
    stepsWalked: 'Steps Walked Today',
    feelingGood: 'Feeling Great',
    feelingCalm: 'Calm & Relaxed',
    feelingTired: 'Tired / Need Rest',
    switchRole: 'Quick Switch Demo Role'
  },
  hi: {
    appName: 'बडी एल्डर एआई',
    tagline: 'आपका धैर्यवान डिजिटल मित्र और मार्गदर्शक',
    emergencyHelpline: 'आपातकालीन (पुलिस/एम्बुलेंस): 112 | साइबर धोखाधड़ी: 1930',
    navHome: 'मुख्य पृष्ठ',
    navChat: 'बडी से बात करें',
    navLessons: 'डिजिटल सीख',
    navSafety: 'धोखाधड़ी से सुरक्षा',
    navWellness: 'दैनिक स्वास्थ्य',
    navCaregiver: 'परिवार और देखभाल',
    navAdmin: 'प्रशासन प्रणाली',
    fontSize: 'अक्षरों का आकार',
    language: 'भाषा',
    login: 'लॉग इन करें',
    register: 'साइन अप करें',
    logout: 'लॉग आउट',
    welcomeBack: 'नमस्ते',
    askBuddyPlaceholder: 'व्हाट्सएप, ऑनलाइन पेमेंट या फोन के बारे में कुछ भी पूछें...',
    micTip: 'बोलने के लिए दबाएं',
    listening: 'सुन रहा हूँ... कृपया बोलिए',
    speakAloud: 'सुनें (आवाज)',
    stopSpeaking: 'आवाज रोकें',
    call1930: '1930 साइबर हेल्पलाइन पर कॉल करें',
    call112: '112 आपातकालीन कॉल',
    verifiedSources: 'सत्यापित आधिकारिक जानकारी',
    newChat: 'नई बातचीत',
    send: 'भेजें',
    clearChat: 'मेसेज साफ करें',
    scamScannerTitle: 'संदिग्ध मेसेज जाँचें',
    scamScannerDesc: 'कोई भी संदिग्ध एसएमएस या व्हाट्सएप मेसेज यहाँ पेस्ट करें ताकि पता चल सके कि यह धोखाधड़ी तो नहीं।',
    scanButton: 'बडी से जाँच करवाएं',
    todayWellness: 'आज की स्वास्थ्य जाँच',
    waterCounter: 'पानी के गिलास',
    stepsWalked: 'आज चले गए कदम',
    feelingGood: 'बहुत अच्छा लग रहा है',
    feelingCalm: 'शांत और प्रसन्न',
    feelingTired: 'थकावट / आराम चाहिए',
    switchRole: 'डेमो रोल बदलें'
  },
  mr: {
    appName: 'बडी एल्डर एआय',
    tagline: 'तुमचा आपुलकीचा डिजिटल मित्र आणि मार्गदर्शक',
    emergencyHelpline: 'आपत्कालीन (पोलीस/रुग्णवाहिका): 112 | सायबर फसवणूक: 1930',
    navHome: 'मुख्य पान',
    navChat: 'बडीशी बोला',
    navLessons: 'डिजिटल शिक्षण',
    navSafety: 'फसवणूक सुरक्षा',
    navWellness: 'दैनिक आरोग्य',
    navCaregiver: 'कुटुंब आणि काळजीवाहक',
    navAdmin: 'प्रशासक प्रणाली',
    fontSize: 'फॉन्ट आकार',
    language: 'भाषा',
    login: 'लॉग इन',
    register: 'नोंदणी करा',
    logout: 'लॉग आउट',
    welcomeBack: 'नमस्कार',
    askBuddyPlaceholder: 'व्हॉट्सअ‍ॅप, ऑनलाईन पेमेंट किंवा मोबाईलबद्दल काहीही विचारा...',
    micTip: 'बोलण्यासाठी दाबा',
    listening: 'ऐकत आहे... कृपया बोला',
    speakAloud: 'मोठ्याने ऐका',
    stopSpeaking: 'आवाज थांबवा',
    call1930: '१९३० सायबर हेल्पलाइनवर कॉल करा',
    call112: '११२ आपत्कालीन कॉल',
    verifiedSources: 'अधिकृत मार्गदर्शक माहिती',
    newChat: 'नवीन संवाद',
    send: 'पाठवा',
    clearChat: 'संवाद पुसून टाका',
    scamScannerTitle: 'संशयास्पद मेसेज तपासा',
    scamScannerDesc: 'कोणताही आलेला संशयास्पद एसएमएस किंवा व्हॉट्सअ‍ॅप मेसेज येथे पेस्ट करा आणि फसवणूक तपासा.',
    scanButton: 'बडीकडून तपासून घ्या',
    todayWellness: 'आजची आरोग्य नोंद',
    waterCounter: 'पाण्याचे ग्लास',
    stepsWalked: 'आज चाललेली पावले',
    feelingGood: 'मस्त आणि आनंदी',
    feelingCalm: 'शांत आणि समाधानी',
    feelingTired: 'थकवा / विश्रांती हवी',
    switchRole: 'डेमो रोल बदला'
  }
};

interface PreferencesContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  t: (key: string) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    return (localStorage.getItem('buddy_lang') as AppLanguage) || 'en';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('buddy_font_size') as FontSize) || 'large';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('buddy_high_contrast') === 'true';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('buddy_lang', lang);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('buddy_font_size', size);
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem('buddy_high_contrast', String(val));
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
    root.classList.add(`font-size-${fontSize}`);

    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [fontSize, highContrast]);

  return (
    <PreferencesContext.Provider
      value={{
        language,
        setLanguage,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        t
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
};
