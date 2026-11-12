import { GoogleGenAI } from '@google/genai';
import { db, Citation } from './db.js';

// Helper to check whether a string is a valid Gemini model name and not an API key or token
export function isValidModelName(name: string | null | undefined): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  // API keys frequently start with AQ. or AIzaSy or contain slashes/dots and are ~40-60 chars
  if (trimmed.startsWith('AQ.') || trimmed.startsWith('AIzaSy') || trimmed.length > 50) {
    return false;
  }
  // Must match official Gemini/Lyria model naming patterns
  return /^(models\/)?(gemini-[a-zA-Z0-9.-]+|lyria-[a-zA-Z0-9.-]+)$/i.test(trimmed);
}

// Clean and normalize model name (e.g. models/gemini-3.8-flash -> gemini-3.8-flash)
export function normalizeModelName(name: string): string {
  return name.trim().replace(/^models\//, '');
}

// Resolve effective API key: checks GEMINI_API_KEY, or rescues an API key mistakenly set in GEMINI_MODEL
export function getEffectiveApiKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    return apiKey;
  }
  // If GEMINI_MODEL was mistakenly set to an API key string (starts with AQ. or AIzaSy)
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel && (envModel.startsWith('AQ.') || envModel.startsWith('AIzaSy'))) {
    return envModel;
  }
  return null;
}

// Build sanitized list of candidate models from official @google/genai specification
export function getCandidateModels(): string[] {
  const envModel = process.env.GEMINI_MODEL?.trim();
  const candidates: string[] = [];

  if (envModel && isValidModelName(envModel)) {
    candidates.push(normalizeModelName(envModel));
  }

  const standardModels = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];

  for (const m of standardModels) {
    if (!candidates.includes(m)) {
      candidates.push(m);
    }
  }

  return candidates;
}

const envModelCandidate = process.env.GEMINI_MODEL?.trim();
let activeModelName: string = (envModelCandidate && isValidModelName(envModelCandidate))
  ? normalizeModelName(envModelCandidate)
  : 'gemini-3.8-flash';

let isModelVerified = false;
let lastModelCheckTime: string = '';
let lastVerificationError: string | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

/**
 * Proactively verifies model availability and discovers a functional model
 */
export async function verifyAndDiscoverGeminiModel(): Promise<{
  success: boolean;
  model: string;
  testedModels: { model: string; ok: boolean; error?: string }[];
  error?: string;
}> {
  const ai = getGeminiClient();
  lastModelCheckTime = new Date().toISOString();

  if (!ai) {
    lastVerificationError = 'GEMINI_API_KEY is not configured or is a placeholder.';
    return {
      success: false,
      model: activeModelName,
      testedModels: [],
      error: lastVerificationError
    };
  }

  const tested: { model: string; ok: boolean; error?: string }[] = [];
  const candidateModels = getCandidateModels();

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: 'Reply with the single word: READY'
      });

      if (response && response.text) {
        activeModelName = model;
        isModelVerified = true;
        lastVerificationError = null;
        tested.push({ model, ok: true });
        return {
          success: true,
          model,
          testedModels: tested
        };
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      tested.push({ model, ok: false, error: errMsg });
      console.warn(`Model probe for ${model} failed:`, errMsg);
    }
  }

  lastVerificationError = `None of the candidate models (${candidateModels.join(', ')}) succeeded. Check API key permissions.`;
  return {
    success: false,
    model: activeModelName,
    testedModels: tested,
    error: lastVerificationError
  };
}

export function getModelStatus() {
  const candidateModels = getCandidateModels();
  return {
    activeModel: activeModelName,
    isVerified: isModelVerified,
    hasApiKey: Boolean(getEffectiveApiKey()),
    lastChecked: lastModelCheckTime,
    lastError: lastVerificationError,
    candidateModels
  };
}

interface ChatTurn {
  role: 'user' | 'buddy';
  text: string;
}

/**
 * Builds the personalized, elderly-focused system prompt with RAG grounding
 */
function buildSystemInstruction(language: 'en' | 'hi' | 'mr', retrievedContext: string): string {
  const languageInstructions = {
    en: 'Respond in clear, warm, patient English. Use simple vocabulary and short sentences. Break directions into numbered steps (Step 1, Step 2). Avoid tech jargon. If technical terms like OTP or UPI PIN appear, explain what they mean with everyday analogies.',
    hi: 'हिंदी में अत्यंत विनम्र, सरल और सम्मानजनक भाषा (जैसे "नमस्ते जी", "आप") में उत्तर दें। कठिन तकनीकी शब्दों को आसान भाषा में समझाएं और क्रमबद्ध चरण (चरण 1, चरण 2) दें।',
    mr: 'मराठीत अत्यंत आदराने, आपुलकीने आणि सोप्या भाषेत (उदा. "नमस्कार", "तुम्ही") उत्तर द्या. तांत्रिक गोष्टी सोप्या उदाहरणांसह समजावून सांगा आणि पायऱ्या (पायरी १, पायरी २) द्या.'
  };

  return `You are "Buddy", a loving, patient, and knowledgeable digital companion designed specifically for senior citizens and elderly users.
Your goal is to empower elders with confidence in using smartphones, WhatsApp, digital payments, internet browsing, and recognizing scams.

Core Principles:
1. Warmth & Patience: Be reassuring, polite, and encouraging. Never be impatient or condescending.
2. Simplicity & Clarity: Use numbered step-by-step instructions (1, 2, 3). Keep paragraphs short (1-3 sentences).
3. Metaphors for Seniors:
   - OTP: Explain it is like a "one-time paper token" that you should NEVER share with strangers.
   - UPI PIN: Explain it is like your "bank locker secret key", used ONLY when you SEND money, NEVER to receive money.
   - Screen-sharing apps (AnyDesk, TeamViewer): Explain they allow strangers to view their phone screen like a live TV, so never install them on strangers' requests.
4. Security & Safety First:
   - India Emergency Helpline: 112
   - India Cyber Fraud Helpline: 1930 (National Cyber Crime Reporting Portal)
   - Rule: Legitimate banks and police NEVER ask for OTP, passwords, or UPI PINs.
   - Digital Arrest: If someone asks about "digital arrest", clearly reassure them that Indian law has NO such thing as digital arrest over video call.
5. Multilingual Fluency:
   ${languageInstructions[language] || languageInstructions.en}
6. Grounded Truth:
   Below is verified reference information from official government and platform guidelines (CERT-In, RBI, NPCI, WhatsApp).
   Use this reference context to provide accurate facts. If the answer is not supported by facts, kindly explain that you are unsure and suggest consulting a trusted family member.

--- VERIFIED REFERENCE KNOWLEDGE ---
${retrievedContext || 'No specific document match found for this question. Rely on verified safe digital literacy practices.'}
-------------------------------------`;
}

/**
 * Main conversational response generator
 */
export async function generateBuddyResponse(params: {
  userMessage: string;
  history: ChatTurn[];
  language?: 'en' | 'hi' | 'mr';
}): Promise<{ text: string; citations: Citation[]; modelUsed: string }> {
  const { userMessage, history, language = 'en' } = params;

  // 1. RAG Retrieval from trusted local knowledge base
  const searchResults = db.searchKnowledge(userMessage, 2);
  const citations: Citation[] = [];
  let contextText = '';

  for (const res of searchResults) {
    contextText += `[Source: ${res.source.publisher} - "${res.source.title}"]\n${res.chunk.content}\n\n`;
    if (!citations.some(c => c.url === res.source.url)) {
      citations.push({
        title: res.source.title,
        url: res.source.url,
        publisher: res.source.publisher,
        category: res.source.category
      });
    }
  }

  const ai = getGeminiClient();

  // If no Gemini API key configured, provide thoughtful elderly-friendly fallback with citations
  if (!ai) {
    let fallbackText = '';
    const qLower = userMessage.toLowerCase();

    if (qLower.includes('whatsapp') && (qLower.includes('call') || qLower.includes('video'))) {
      if (language === 'hi') {
        fallbackText = "नमस्ते जी! व्हाट्सएप पर वीडियो कॉल करना बहुत आसान है:\n\n1. अपने फोन में व्हाट्सएप खोलें।\n2. अपने परिवार के सदस्य के नाम पर टैप करें।\n3. ऊपर दाईं ओर बने वीडियो कैमरा 📹 आइकन पर टैप करें।\n4. फोन को आंखों के सामने सीधा रखें ताकि आपका चेहरा साफ दिखे।\n\nबात पूरी होने पर नीचे दिए गए लाल बटन को दबाकर कॉल समाप्त करें।";
      } else if (language === 'mr') {
        fallbackText = "नमस्कार! व्हॉट्सअ‍ॅपवर व्हिडिओ कॉल करणे खूप सोपे आहे:\n\n१. आपल्या फोनमध्ये व्हॉट्सअ‍ॅप उघडा.\n२. आपल्या मुलांच्या किंवा नातेवाईकांच्या नावावर टॅप करा.\n३. वर उजव्या कोपऱ्यात असलेल्या व्हिडिओ कॅमेरा 📹 चिन्हावर टॅप करा.\n४. फोन डोळ्यांच्या समोर सरळ धरा जेणेकरून तुमचा चेहरा स्पष्ट दिसेल.\n\nबोलणे झाल्यावर खालील लाल फोन बटणावर टॅप करून कॉल बंद करा.";
      } else {
        fallbackText = "Hello! Making a WhatsApp video call is very easy:\n\n1. Open WhatsApp on your phone.\n2. Tap on your family member's name.\n3. Look at the top right corner and tap the Video Camera 📹 icon.\n4. Hold your phone at eye level so your face is nicely visible.\n\nWhen you are done talking, tap the red phone icon at the bottom to end the call.";
      }
    } else if (qLower.includes('otp') || qLower.includes('pin') || qLower.includes('upi')) {
      if (language === 'hi') {
        fallbackText = "सावधान जी! सबसे महत्वपूर्ण नियम:\n\n1. यूपीआई पिन केवल पैसे भेजने के लिए होता है, पैसे प्राप्त करने के लिए कभी नहीं।\n2. आपका बैंक या कोई भी अधिकारी कभी भी ओटीपी (OTP) या यूपीआई पिन नहीं मांगता।\n3. यदि किसी ने धोखाधड़ी से पैसे निकाल लिए हैं, तो तुरंत 1930 साइबर हेल्पलाइन पर कॉल करें।";
      } else if (language === 'mr') {
        fallbackText = "महत्त्वाची सुरक्षा सूचना:\n\n१. यूपीआय पिन (UPI PIN) फक्त पैसे पाठवतानाच टाकायचा असतो, पैसे खात्यात येण्यासाठी कधीही नाही.\n२. बँक अधिकारी किंवा कोणताही व्यक्ती कधीही ओटीपी किंवा पासवर्ड मागत नाही.\n३. फसवणूक झाल्यास त्वरित १९३० या सायबर सुरक्षा हेल्पलाइन क्रमांकावर कॉल करा.";
      } else {
        fallbackText = "Important Safety Rule:\n\n1. You only enter your UPI PIN when SENDING money, NEVER to receive money.\n2. No legitimate bank officer or company ever asks for your OTP or UPI PIN.\n3. If anyone pressures you or money was taken, immediately dial the National Cyber Crime Helpline: 1930.";
      }
    } else {
      fallbackText = language === 'mr'
        ? `नमस्कार! मी बडी, तुमचा डिजिटल मित्र. तुमच्या प्रश्नाचे सोप्या भाषेत उत्तर देण्यासाठी मी नेहमी तयार आहे. मी तुम्हाला स्मार्टफोन वापरणे, व्हॉट्सअ‍ॅप, सुरक्षित पेमेंट्स आणि ऑनलाईन फसवणुकीपासून सावध राहण्यास मदत करतो.`
        : language === 'hi'
        ? `नमस्ते जी! मैं बडी, आपका डिजिटल साथी। मैं आपको स्मार्टफोन चलाना, व्हाट्सएप, ऑनलाइन भुगतान और साइबर फ्रॉड से सुरक्षित रहना सिखाता हूँ। आप मुझसे कोई भी सवाल पूछ सकते हैं।`
        : `Hello! I am Buddy, your patient digital companion. I am here to help you navigate your smartphone, stay safe from scams, connect with family on WhatsApp, and use digital services with complete confidence.`;
    }

    return {
      text: fallbackText,
      citations,
      modelUsed: 'offline-safe-assistant'
    };
  }

  // Build conversational contents structure for Gemini
  const systemInstruction = buildSystemInstruction(language, contextText);

  // Compile dialogue history
  const recentHistory = history.slice(-6);
  const contents: any[] = [];

  for (const turn of recentHistory) {
    contents.push({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.text }]
    });
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // Try active model first, fallback to candidates if model availability issues occur
  const candidateModels = getCandidateModels();
  const modelsToTry = [activeModelName, ...candidateModels.filter(m => m !== activeModelName)];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          // For elderly users, we want clear, reassuring, structured responses
          thinkingConfig: {
            thinkingLevel: 'LOW' as any
          }
        }
      });

      const responseText = response.text;
      if (responseText && responseText.trim()) {
        activeModelName = model;
        isModelVerified = true;
        return {
          text: responseText.trim(),
          citations,
          modelUsed: model
        };
      }
    } catch (err: any) {
      console.warn(`Error generating content with model ${model}:`, err?.message || err);
      // Continue to next candidate model
    }
  }

  // If all models failed or encountered rate limits, provide an informative error
  throw new Error(`Gemini API was unable to generate a response with available models (${modelsToTry.join(', ')}). Please verify your API key in the Secrets panel.`);
}

/**
 * Specialized Scam & Fraud Analyzer for suspicious text, SMS, or WhatsApp messages
 */
export async function analyzeSuspiciousMessage(messageText: string, language: 'en' | 'hi' | 'mr' = 'en'): Promise<{
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'DANGER_SCAM';
  score: number; // 0 to 100
  verdict: string;
  reasons: string[];
  safeAction: string;
  emergencyNumber: string;
  officialReference: string;
}> {
  const lower = messageText.toLowerCase();

  // Rule-based heuristic indicators
  const hasUrgency = /urgent|immediately|tonight|blocked|suspended|terminated|cutoff|cut off|disconnected|arrest/i.test(lower);
  const hasOtpOrPin = /otp|one time password|upi pin|pin number|cvv|secret code/i.test(lower);
  const hasLotteryOrPrize = /winner|won|lottery|crore|lakh|cashback|bonus|gift voucher|congratulations/i.test(lower);
  const hasRemoteAccess = /anydesk|teamviewer|rustdesk|quicksupport/i.test(lower);
  const hasThreat = /police|cbi|customs|digital arrest|narcotics|parcel seized/i.test(lower);
  const hasElectricityOrKyc = /electricity|power bill|bill update|kyc pending|sim block/i.test(lower);

  let calculatedScore = 15;
  const detectedReasons: string[] = [];

  if (hasOtpOrPin) {
    calculatedScore += 40;
    detectedReasons.push('Asks for OTP or PIN (Never share OTP or secret PINs with anyone).');
  }
  if (hasRemoteAccess) {
    calculatedScore += 50;
    detectedReasons.push('Mentions remote screen sharing apps (AnyDesk, TeamViewer) which scammers use to control phones.');
  }
  if (hasThreat) {
    calculatedScore += 45;
    detectedReasons.push('Uses fear or fake law enforcement threats ("Digital Arrest" or police impersonation).');
  }
  if (hasElectricityOrKyc) {
    calculatedScore += 35;
    detectedReasons.push('Claims urgent electricity cutoff or KYC suspension, a very common fraud tactic.');
  }
  if (hasLotteryOrPrize) {
    calculatedScore += 30;
    detectedReasons.push('Promises unexpected lottery money, prize, or high returns.');
  }
  if (hasUrgency) {
    calculatedScore += 20;
    detectedReasons.push('Creates artificial urgency or panic to rush you into acting without thinking.');
  }

  const riskLevel: 'SAFE' | 'SUSPICIOUS' | 'DANGER_SCAM' =
    calculatedScore >= 60 ? 'DANGER_SCAM' : calculatedScore >= 35 ? 'SUSPICIOUS' : 'SAFE';

  // AI prompt for personalized elderly explanation
  const ai = getGeminiClient();
  if (ai) {
    try {
      const modelToUse = isValidModelName(activeModelName) ? activeModelName : 'gemini-3.8-flash';
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: `Analyze this message received by an elderly person in India:
"""${messageText}"""

Explain whether this is a scam or safe in very simple terms for an elderly grandmother or grandfather.
Specify:
1. Verdict (Safe, Suspicious, or Scam)
2. Why (in simple bullet points)
3. Exactly what they should do (Do not click links, do not share OTP, delete message).
Respond in ${language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}.`,
        config: {
          thinkingConfig: { thinkingLevel: 'LOW' as any }
        }
      });

      if (response.text) {
        return {
          riskLevel,
          score: Math.min(100, calculatedScore),
          verdict: response.text,
          reasons: detectedReasons.length > 0 ? detectedReasons : ['Suspicious phrasing and unsolicited sender.'],
          safeAction: 'Do NOT click any link, do NOT call the number in the message, and NEVER share OTP or UPI PIN. If money was debited, dial 1930 immediately.',
          emergencyNumber: '1930 (National Cyber Crime Helpline) or 112',
          officialReference: 'CERT-In & RBI Kehta Hai Advisory'
        };
      }
    } catch (err) {
      console.warn('Scam AI reasoning failed, using heuristic analysis:', err);
    }
  }

  const defaultVerdicts = {
    en: riskLevel === 'DANGER_SCAM'
      ? 'DANGER: This message shows classic signs of a financial fraud or scam. Do not reply or click any link.'
      : riskLevel === 'SUSPICIOUS'
      ? 'SUSPICIOUS: Please be careful. Do not share any personal details or passwords.'
      : 'LIKELY SAFE: No urgent scam keywords detected, but always verify sender identity before sharing information.',
    hi: riskLevel === 'DANGER_SCAM'
      ? 'खतरा: यह संदेश वित्तीय धोखाधड़ी या घोटाले का संकेत देता है। किसी भी लिंक पर क्लिक न करें।'
      : 'सतर्क रहें: कोई भी व्यक्तिगत जानकारी या ओटीपी किसी के साथ साझा न करें।',
    mr: riskLevel === 'DANGER_SCAM'
      ? 'धोकादायक: हा मेसेज ऑनलाईन फसवणुकीचा वाटत आहे. कोणत्याही लिंकवर क्लिक करू नका.'
      : 'सावधान रहा: अनोळखी व्यक्तीसोबत ओटीपी किंवा बँक माहिती शेअर करू नका.'
  };

  return {
    riskLevel,
    score: Math.min(100, calculatedScore),
    verdict: defaultVerdicts[language] || defaultVerdicts.en,
    reasons: detectedReasons.length > 0 ? detectedReasons : ['Sender requests unexpected action or verification.'],
    safeAction: 'Never enter your UPI PIN to receive money. Never share OTPs. Dial 1930 if you need to report cyber fraud.',
    emergencyNumber: '1930',
    officialReference: 'CERT-In Citizen Safety Portal'
  };
}
