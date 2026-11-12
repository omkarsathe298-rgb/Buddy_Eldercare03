import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'ELDER' | 'CAREGIVER' | 'ADMIN';
  phone?: string;
  preferredLang: 'en' | 'hi' | 'mr';
  fontSize: 'normal' | 'large' | 'xlarge';
  createdAt: string;
  updatedAt: string;
}

export interface ElderProfile {
  id: string;
  userId: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  city?: string;
  medicalNotes?: string;
  dailyGoalSteps: number;
  waterGoalGlasses: number;
}

export interface CaregiverLink {
  id: string;
  caregiverId: string;
  elderId: string;
  status: 'ACTIVE' | 'PENDING';
  createdAt: string;
}

export interface CaregiverNote {
  id: string;
  linkId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  language: 'en' | 'hi' | 'mr';
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  title: string;
  url: string;
  publisher: string;
  category: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'buddy' | 'system';
  text: string;
  citations?: Citation[];
  feedback?: 'thumbs_up' | 'thumbs_down';
  createdAt: string;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  titleMr: string;
  category: 'smartphone' | 'whatsapp' | 'payments' | 'safety' | 'computer';
  summary: string;
  summaryHi: string;
  summaryMr: string;
  icon: string;
  order: number;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  completedAt?: string;
  updatedAt: string;
}

export interface WellnessCheckin {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: 'happy' | 'calm' | 'tired' | 'sad' | 'unwell';
  waterGlasses: number;
  stepsTaken: number;
  sleepHours?: number;
  medicationTaken: boolean;
  notes?: string;
  createdAt: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  category: string;
  trustScore: number;
  lastVerified: string;
  summary: string;
  chunks: {
    id: string;
    content: string;
    keywords: string[];
  }[];
}

interface DatabaseSchema {
  users: User[];
  elderProfiles: ElderProfile[];
  caregiverLinks: CaregiverLink[];
  caregiverNotes: CaregiverNote[];
  conversations: Conversation[];
  messages: Message[];
  lessons: Lesson[];
  lessonProgress: LessonProgress[];
  wellnessCheckins: WellnessCheckin[];
  knowledgeSources: KnowledgeSource[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'buddy_elder_db.json');

// Initial seed knowledge sources with verified Indian & global authorities
const INITIAL_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'src-cert-in',
    title: 'CERT-In Citizen Cyber Safety Guidelines',
    url: 'https://www.cert-in.org.in/',
    publisher: 'CERT-In (Govt. of India)',
    category: 'scam_prevention',
    trustScore: 100,
    lastVerified: '2026-03-01T00:00:00.000Z',
    summary: 'Official advisories on preventing identity theft, phishing, lottery fraud, and malicious APK files targeting Indian citizens.',
    chunks: [
      {
        id: 'chunk-cert-1',
        content: 'Never install Android applications from unknown links sent via WhatsApp or SMS. Always install only from the official Google Play Store. Do not grant Accessibility permissions to unfamiliar apps.',
        keywords: ['apk', 'install', 'unknown', 'download', 'link', 'sms', 'whatsapp', 'play store']
      },
      {
        id: 'chunk-cert-2',
        content: 'National Cyber Crime Reporting Portal: If you have fallen victim to financial cyber fraud, immediately dial helpline number 1930 or lodge an official complaint at cybercrime.gov.in within the golden hour to freeze stolen funds.',
        keywords: ['1930', 'helpline', 'cybercrime', 'fraud', 'freeze', 'complaint', 'money stolen', 'scam']
      }
    ]
  },
  {
    id: 'src-rbi',
    title: 'RBI Kehta Hai: Financial Literacy & Safety Advice',
    url: 'https://rbi.org.in/',
    publisher: 'Reserve Bank of India (RBI)',
    category: 'upi_safety',
    trustScore: 100,
    lastVerified: '2026-03-01T00:00:00.000Z',
    summary: 'Central bank guidelines on protecting bank accounts, debit/credit cards, and OTP secrecy.',
    chunks: [
      {
        id: 'chunk-rbi-1',
        content: 'RBI Rule: Your Bank or RBI never asks for your OTP (One Time Password), UPI PIN, CVV, or Net Banking password over call, SMS, or WhatsApp. Never disclose OTP or passwords to anyone, even if caller claims to be your Bank Manager.',
        keywords: ['otp', 'password', 'cvv', 'bank manager', 'pin', 'call', 'rbi', 'share']
      },
      {
        id: 'chunk-rbi-2',
        content: 'Electricity Bill & KYC Disconnection Scams: Fraudsters send urgent messages claiming your electricity or SIM card will be disconnected tonight due to pending KYC update. Never call phone numbers inside such messages. Legitimate agencies do not ask for urgent app installations (like AnyDesk or TeamViewer) to verify KYC.',
        keywords: ['electricity', 'bill', 'kyc', 'disconnect', 'power', 'sim card', 'anydesk', 'teamviewer']
      }
    ]
  },
  {
    id: 'src-npci',
    title: 'NPCI UPI Safety Shield: Receiving Money Never Requires PIN',
    url: 'https://www.npci.org.in/',
    publisher: 'NPCI (National Payments Corporation of India)',
    category: 'upi_safety',
    trustScore: 100,
    lastVerified: '2026-03-01T00:00:00.000Z',
    summary: 'Universal rule for Google Pay, PhonePe, Paytm, and BHIM: You enter your UPI PIN only to SEND money, never to RECEIVE money.',
    chunks: [
      {
        id: 'chunk-npci-1',
        content: 'GOLDEN UPI RULE: You only enter your UPI PIN when money is leaving your bank account. You NEVER need to enter your UPI PIN, scan a QR code, or click "Pay" to receive money, lottery, pension, or refunds into your account.',
        keywords: ['upi pin', 'receive money', 'qr code', 'google pay', 'phonepe', 'paytm', 'bhim', 'pin']
      }
    ]
  },
  {
    id: 'src-whatsapp',
    title: 'Official WhatsApp Help Center: Security & Privacy',
    url: 'https://faq.whatsapp.com/',
    publisher: 'WhatsApp LLC',
    category: 'whatsapp_guide',
    trustScore: 100,
    lastVerified: '2026-03-01T00:00:00.000Z',
    summary: 'Guidelines on making audio and video calls, privacy settings, blocking unknown numbers, and two-step verification.',
    chunks: [
      {
        id: 'chunk-wa-1',
        content: 'To make a WhatsApp Video Call: 1. Open WhatsApp. 2. Tap on the contact name of your family member or friend. 3. Tap the Video Camera icon at the top right corner. Ensure your front camera is clean and your room has good lighting.',
        keywords: ['whatsapp', 'video call', 'family', 'camera', 'call', 'how to call']
      },
      {
        id: 'chunk-wa-2',
        content: 'How to block and report scammers on WhatsApp: If an unknown number messages with job offers, lottery wins, or demands money, open the chat, tap the three dots (More) -> Block -> Report & Block. Never send money to strangers.',
        keywords: ['block', 'unknown number', 'report', 'whatsapp scam', 'job offer']
      }
    ]
  },
  {
    id: 'src-national-emergency',
    title: 'National Emergency Response System (112 India)',
    url: 'https://112.gov.in/',
    publisher: 'Ministry of Home Affairs (Govt. of India)',
    category: 'emergency',
    trustScore: 100,
    lastVerified: '2026-03-01T00:00:00.000Z',
    summary: 'Single unified emergency number for Police, Fire, Ambulance, and Senior Citizen distress.',
    chunks: [
      {
        id: 'chunk-emerg-1',
        content: 'In any physical emergency, medical crisis, or safety threat, dial 112 from any phone. It connects directly to emergency police, ambulance, and disaster response services across India 24/7.',
        keywords: ['emergency', '112', 'police', 'ambulance', 'hospital', 'help', 'danger']
      }
    ]
  }
];

const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    slug: 'smartphone-basics',
    title: 'Smartphone Basics: Tap, Scroll & Volume',
    titleHi: 'स्मार्टफोन मूल बातें: टैप, स्क्रॉल और वॉल्यूम',
    titleMr: 'स्मार्टफोन मूलभूत गोष्टी: टॅप, स्क्रोल आणि आवाज',
    category: 'smartphone',
    summary: 'Learn how to hold your phone, tap buttons accurately, adjust ringtone volume, and manage battery.',
    summaryHi: 'आपला फोन व्यवस्थित कसा धरावा, बटणे कशी दाबावी, रिंगटोन आवाज आणि बॅटरी व्यवस्थापन शिका.',
    summaryMr: 'आपला फोन कसा धरावा, बटणे अचूक कशी टॅप करावीत, रिंगटोनचा आवाज आणि बॅटरी काळजी शिका.',
    icon: 'Smartphone',
    order: 1,
    steps: [
      {
        title: 'Holding and Tapping',
        description: 'Hold the phone comfortably with both hands. Use your thumb or index finger to gently touch the screen once to open an application.',
        tip: 'A gentle quick touch is all you need—no need to press hard on modern touchscreens!'
      },
      {
        title: 'Adjusting Volume',
        description: 'Locate the long volume buttons on the side of your phone. Press the upper button to make voices louder, and lower button to reduce sound.',
        tip: 'If you miss calls often, keep your ringtone volume at 80% or higher.'
      },
      {
        title: 'Battery and Charging',
        description: 'Charge your phone once daily when battery reaches around 25%. Always use your original charger on a stable flat surface.',
        tip: 'Avoid using the phone while it is plugged into a charger.'
      }
    ],
    quiz: [
      {
        question: 'Do you need to press hard on the glass screen to open an app?',
        options: ['Yes, press as hard as possible', 'No, a gentle light tap is enough', 'Only when battery is low'],
        correctIndex: 1,
        explanation: 'Modern touchscreens respond to a gentle, light touch. You never need to press hard.'
      }
    ]
  },
  {
    id: 'lesson-2',
    slug: 'whatsapp-family-calls',
    title: 'WhatsApp: Messages, Voice Notes & Video Calls',
    titleHi: 'व्हॉट्सअ‍ॅप: मेसेज, व्हॉईस नोट्स आणि व्हिडिओ कॉल',
    titleMr: 'व्हॉट्सअ‍ॅप: मेसेज, व्हॉइस नोट्स आणि व्हिडिओ कॉलिंग',
    category: 'whatsapp',
    summary: 'Step-by-step guide to sending voice messages to grandchildren and making crystal-clear video calls.',
    summaryHi: 'मुलांना व्हॉइस मेसेज पाठवणे आणि स्पष्ट व्हिडिओ कॉल करण्याचे सोपे मार्गदर्शन.',
    summaryMr: 'नातेवाईक आणि मुलांना व्हॉइस मेसेज पाठवणे व स्पष्ट व्हिडिओ कॉल करण्याची सोपी पद्धत.',
    icon: 'MessageCircle',
    order: 2,
    steps: [
      {
        title: 'Sending a Voice Note',
        description: 'Open a chat with your family member. Press and hold the green Microphone icon at the bottom right, speak your message clearly, then release your finger to send.',
        tip: 'If you speak Marathi or Hindi, your voice note will be delivered instantly without needing to type!'
      },
      {
        title: 'Making a Video Call',
        description: 'Open your loved one\'s chat and look at the top right corner. Tap the Video Camera icon. When they answer, hold the phone at eye level.',
        tip: 'Sit facing a window or room light so your face is clear and bright for your family.'
      },
      {
        title: 'Ending the Call',
        description: 'When your conversation is finished, tap the red phone icon at the bottom of the screen to hang up.',
        tip: 'Always confirm the call has ended before placing the phone down.'
      }
    ],
    quiz: [
      {
        question: 'Which icon at the top of a WhatsApp chat starts a video call with your family?',
        options: ['The Video Camera icon', 'The Paperclip icon', 'The Three Dots menu'],
        correctIndex: 0,
        explanation: 'Tapping the Video Camera icon directly starts a live face-to-face video call.'
      }
    ]
  },
  {
    id: 'lesson-3',
    slug: 'upi-digital-payments-safety',
    title: 'Safe Digital Payments: GPay, PhonePe & UPI',
    titleHi: 'सुरक्षित डिजिटल पेमेंट: जीपे, फोनपे आणि यूपीआय',
    titleMr: 'सुरक्षित डिजिटल पेमेंट: गुगल पे, फोनपे आणि यूपीआय',
    category: 'payments',
    summary: 'Master the Golden Rule of UPI: You only enter your secret PIN to send money, NEVER to receive money.',
    summaryHi: 'यूपीआयचा सुवर्ण नियम शिका: पैसे पाठवतानाच पिन टाकायचा असतो, पैसे मिळवण्यासाठी कधीही नाही.',
    summaryMr: 'यूपीआयचा सर्वात महत्त्वाचा नियम: पैसे पाठवतानाच पिन टाकायचा असतो, पैसे स्वीकारताना कधीही नाही.',
    icon: 'CreditCard',
    order: 3,
    steps: [
      {
        title: 'The Golden Rule of UPI',
        description: 'You only type your 4 or 6 digit secret UPI PIN when money is leaving your account. If someone claims they are sending you money, pension, or a refund and asks for your PIN, it is 100% a fraud.',
        tip: 'NEVER enter your UPI PIN to receive money!'
      },
      {
        title: 'Paying at a Local Grocery Store',
        description: 'Open your UPI app (Google Pay, PhonePe, Paytm). Tap "Scan QR code". Point your camera at the shopkeeper\'s printed QR code. Check their name on the screen, enter the amount, and enter your PIN.',
        tip: 'Always verify the recipient\'s name shown on screen before typing your PIN.'
      },
      {
        title: 'Never Share OTP or Screen Sharing',
        description: 'Never install apps like AnyDesk, RustDesk, or TeamViewer if anyone over the phone tells you to. Scammers use these to see your screen and steal money.',
        tip: 'No legitimate bank manager will ever ask you to download a screen-sharing app.'
      }
    ],
    quiz: [
      {
        question: 'Someone calls and says they are sending you ₹5,000 lottery and asks you to enter your UPI PIN. What should you do?',
        options: ['Enter your UPI PIN immediately', 'Disconnect call and report as scam—never enter PIN to receive money', 'Ask them for an OTP instead'],
        correctIndex: 1,
        explanation: 'Entering your UPI PIN authorizes money to leave your account. Disconnect and report immediately.'
      }
    ]
  },
  {
    id: 'lesson-4',
    slug: 'scam-identification-defense',
    title: 'Scam Defense: Spotting Fake Calls, OTPs & Fraud Links',
    titleHi: 'घोटाळा ओळख आणि बचाव: बनावट कॉल, ओटीपी आणि लिंक्स',
    titleMr: 'फसवणूक ओळख आणि संरक्षण: खोटे कॉल्स, ओटीपी आणि लिंक्स',
    category: 'safety',
    summary: 'Identify electricity bill threats, fake courier SMS, digital arrest threats, and learn the 1930 Cyber Helpline.',
    summaryHi: 'वीज बिल कट करण्याचे मेसेज, बनावट कुरिअर, डिजिटल अटक धमक्या ओळखा आणि १९३० हेल्पलाइन वापरा.',
    summaryMr: 'लाईट बिल बंद होण्याचे खोटे मेसेज, पार्सल मेसेज, डिजिटल अरेस्टची भीती ओळखा आणि १९३० हेल्पलाइन वापरा.',
    icon: 'ShieldCheck',
    order: 4,
    steps: [
      {
        title: 'Spotting Urgent Threatening Messages',
        description: 'Scammers try to create panic with messages like "Your electricity will be cut off at 9:30 PM tonight due to unpaid bill" or "Your SIM is blocked". Stay calm. Do not click links or call numbers in the SMS.',
        tip: 'Real government utilities do not send threatening SMS from random 10-digit mobile numbers.'
      },
      {
        title: 'Digital Arrest Hoax',
        description: 'Scammers impersonating police or CBI may video call you in fake uniforms claiming a parcel in your name contains illegal items and put you under "Digital Arrest". Know that Indian law has NO such thing as "Digital Arrest".',
        tip: 'Police never conduct court or arrest people over Skype or WhatsApp video calls.'
      },
      {
        title: 'Emergency Action: 1930 Helpline',
        description: 'If money was mistakenly transferred or debited without your permission, dial 1930 immediately. It connects to the National Cyber Crime Bureau which works with banks to stop fraudulent transfers.',
        tip: 'Save 1930 in your phone contacts right now under "Cyber Helpline".'
      }
    ],
    quiz: [
      {
        question: 'If you accidentally clicked a fraudulent link and money was debited, which national helpline number should you dial immediately?',
        options: ['100', '1930', '108'],
        correctIndex: 1,
        explanation: '1930 is the official National Cyber Financial Fraud Helpline operated by the Ministry of Home Affairs.'
      }
    ]
  }
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          elderProfiles: parsed.elderProfiles || [],
          caregiverLinks: parsed.caregiverLinks || [],
          caregiverNotes: parsed.caregiverNotes || [],
          conversations: parsed.conversations || [],
          messages: parsed.messages || [],
          lessons: parsed.lessons && parsed.lessons.length > 0 ? parsed.lessons : INITIAL_LESSONS,
          lessonProgress: parsed.lessonProgress || [],
          wellnessCheckins: parsed.wellnessCheckins || [],
          knowledgeSources: parsed.knowledgeSources && parsed.knowledgeSources.length > 0 ? parsed.knowledgeSources : INITIAL_KNOWLEDGE_SOURCES
        };
      }
    } catch (err) {
      console.warn('Could not read existing db file, initializing fresh store:', err);
    }

    const defaultStore: DatabaseSchema = {
      users: [],
      elderProfiles: [],
      caregiverLinks: [],
      caregiverNotes: [],
      conversations: [],
      messages: [],
      lessons: INITIAL_LESSONS,
      lessonProgress: [],
      wellnessCheckins: [],
      knowledgeSources: INITIAL_KNOWLEDGE_SOURCES
    };

    this.seedDefaultUsers(defaultStore);
    this.saveData(defaultStore);
    return defaultStore;
  }

  private seedDefaultUsers(store: DatabaseSchema) {
    const salt = bcrypt.genSaltSync(10);
    const defaultPassword = 'password123';
    const hash = bcrypt.hashSync(defaultPassword, salt);

    // 1. Default Elder user
    const elderUser: User = {
      id: 'usr-elder-1',
      email: 'elder@buddy.com',
      passwordHash: hash,
      name: 'Ramesh Sharma',
      role: 'ELDER',
      phone: '+91 98765 43210',
      preferredLang: 'en',
      fontSize: 'large',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const elderProfile: ElderProfile = {
      id: 'prof-elder-1',
      userId: elderUser.id,
      emergencyContact: 'Priya Sharma (Daughter)',
      emergencyPhone: '+91 98765 11111',
      city: 'Pune',
      medicalNotes: 'Mild hypertension. Morning tablet prescribed.',
      dailyGoalSteps: 3000,
      waterGoalGlasses: 6
    };

    // 2. Default Caregiver user
    const caregiverUser: User = {
      id: 'usr-caregiver-1',
      email: 'caregiver@buddy.com',
      passwordHash: hash,
      name: 'Priya Sharma',
      role: 'CAREGIVER',
      phone: '+91 98765 11111',
      preferredLang: 'en',
      fontSize: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 3. Default Admin user
    const adminUser: User = {
      id: 'usr-admin-1',
      email: 'admin@buddy.com',
      passwordHash: hash,
      name: 'Dr. Anand Joshi',
      role: 'ADMIN',
      phone: '+91 98765 99999',
      preferredLang: 'en',
      fontSize: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Link Caregiver to Elder
    const link: CaregiverLink = {
      id: 'link-1',
      caregiverId: caregiverUser.id,
      elderId: elderUser.id,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    const note: CaregiverNote = {
      id: 'note-1',
      linkId: link.id,
      authorId: caregiverUser.id,
      authorName: caregiverUser.name,
      title: 'Doctor Appointment Next Tuesday',
      content: 'Remember Dad has his routine blood pressure check-up at 10:30 AM with Dr. Kulkarni. Water intake has been good this week.',
      createdAt: new Date().toISOString()
    };

    // Initial checkin for today
    const todayStr = new Date().toISOString().split('T')[0];
    const checkin: WellnessCheckin = {
      id: 'chk-1',
      userId: elderUser.id,
      date: todayStr,
      mood: 'happy',
      waterGlasses: 4,
      stepsTaken: 1850,
      sleepHours: 7.5,
      medicationTaken: true,
      notes: 'Morning walk in the garden felt very refreshing. Spoke with grandson.',
      createdAt: new Date().toISOString()
    };

    // Initial Welcome conversation
    const conv: Conversation = {
      id: 'conv-1',
      userId: elderUser.id,
      title: 'Welcome to Buddy!',
      language: 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const msg1: Message = {
      id: 'msg-1',
      conversationId: conv.id,
      sender: 'buddy',
      text: "Namaste Ramesh ji! I am Buddy, your personal digital companion. I am here to help you learn your smartphone, practice WhatsApp calls, stay safe from online scams, and feel confident with modern technology. How can I help you today?",
      citations: [
        {
          title: 'CERT-In Citizen Cyber Safety Guidelines',
          url: 'https://www.cert-in.org.in/',
          publisher: 'CERT-In',
          category: 'scam_prevention'
        }
      ],
      createdAt: new Date().toISOString()
    };

    store.users.push(elderUser, caregiverUser, adminUser);
    store.elderProfiles.push(elderProfile);
    store.caregiverLinks.push(link);
    store.caregiverNotes.push(note);
    store.wellnessCheckins.push(checkin);
    store.conversations.push(conv);
    store.messages.push(msg1);
  }

  private saveData(data = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to file:', err);
    }
  }

  // --- Users & Profiles ---
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);

    if (newUser.role === 'ELDER') {
      const profile: ElderProfile = {
        id: `prof-${Date.now()}`,
        userId: newUser.id,
        dailyGoalSteps: 2500,
        waterGoalGlasses: 6
      };
      this.data.elderProfiles.push(profile);
    }

    this.saveData();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.saveData();
    return user;
  }

  getElderProfile(userId: string): ElderProfile | undefined {
    return this.data.elderProfiles.find(p => p.userId === userId);
  }

  updateElderProfile(userId: string, updates: Partial<ElderProfile>): ElderProfile {
    let profile = this.data.elderProfiles.find(p => p.userId === userId);
    if (!profile) {
      profile = {
        id: `prof-${Date.now()}`,
        userId,
        dailyGoalSteps: 2500,
        waterGoalGlasses: 6,
        ...updates
      };
      this.data.elderProfiles.push(profile);
    } else {
      Object.assign(profile, updates);
    }
    this.saveData();
    return profile;
  }

  // --- Caregiver & Elders Relations ---
  getLinkedElders(caregiverId: string): (User & { profile?: ElderProfile; lastCheckin?: WellnessCheckin })[] {
    const links = this.data.caregiverLinks.filter(l => l.caregiverId === caregiverId && l.status === 'ACTIVE');
    return links.map(link => {
      const elder = this.data.users.find(u => u.id === link.elderId);
      if (!elder) return null;
      const profile = this.data.elderProfiles.find(p => p.userId === elder.id);
      const checkins = this.data.wellnessCheckins
        .filter(c => c.userId === elder.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      return {
        ...elder,
        profile,
        lastCheckin: checkins[0]
      };
    }).filter(Boolean) as (User & { profile?: ElderProfile; lastCheckin?: WellnessCheckin })[];
  }

  getLinkedCaregivers(elderId: string): (User & { linkId: string })[] {
    const links = this.data.caregiverLinks.filter(l => l.elderId === elderId && l.status === 'ACTIVE');
    return links.map(link => {
      const cg = this.data.users.find(u => u.id === link.caregiverId);
      if (!cg) return null;
      return { ...cg, linkId: link.id };
    }).filter(Boolean) as (User & { linkId: string })[];
  }

  linkCaregiver(caregiverEmail: string, elderId: string): { success: boolean; message: string; link?: CaregiverLink } {
    const caregiver = this.findUserByEmail(caregiverEmail);
    if (!caregiver) {
      return { success: false, message: 'Caregiver with that email was not found. Please ask them to register first.' };
    }
    const existing = this.data.caregiverLinks.find(l => l.caregiverId === caregiver.id && l.elderId === elderId);
    if (existing) {
      return { success: true, message: 'Already connected with this family member.', link: existing };
    }
    const newLink: CaregiverLink = {
      id: `link-${Date.now()}`,
      caregiverId: caregiver.id,
      elderId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.data.caregiverLinks.push(newLink);
    this.saveData();
    return { success: true, message: `Successfully linked with ${caregiver.name}!`, link: newLink };
  }

  getCaregiverNotes(elderId: string): CaregiverNote[] {
    const links = this.data.caregiverLinks.filter(l => l.elderId === elderId);
    const linkIds = new Set(links.map(l => l.id));
    return this.data.caregiverNotes
      .filter(n => linkIds.has(n.linkId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addCaregiverNote(caregiverId: string, elderId: string, title: string, content: string): CaregiverNote {
    const link = this.data.caregiverLinks.find(l => l.caregiverId === caregiverId && l.elderId === elderId);
    const linkId = link ? link.id : 'direct';
    const author = this.findUserById(caregiverId);

    const note: CaregiverNote = {
      id: `note-${Date.now()}`,
      linkId,
      authorId: caregiverId,
      authorName: author ? author.name : 'Caregiver',
      title,
      content,
      createdAt: new Date().toISOString()
    };
    this.data.caregiverNotes.unshift(note);
    this.saveData();
    return note;
  }

  // --- Conversations & Messages ---
  getConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getConversation(id: string, userId: string): Conversation | undefined {
    return this.data.conversations.find(c => c.id === id && c.userId === userId);
  }

  createConversation(userId: string, title = 'New Conversation', language: 'en' | 'hi' | 'mr' = 'en'): Conversation {
    const conv: Conversation = {
      id: `conv-${Date.now()}`,
      userId,
      title,
      language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.conversations.unshift(conv);
    this.saveData();
    return conv;
  }

  updateConversation(id: string, userId: string, updates: Partial<Conversation>): Conversation | undefined {
    const conv = this.getConversation(id, userId);
    if (!conv) return undefined;
    Object.assign(conv, updates, { updatedAt: new Date().toISOString() });
    this.saveData();
    return conv;
  }

  deleteConversation(id: string, userId: string): boolean {
    const initialLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter(c => !(c.id === id && c.userId === userId));
    this.data.messages = this.data.messages.filter(m => m.conversationId !== id);
    if (this.data.conversations.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  getMessages(conversationId: string): Message[] {
    return this.data.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  addMessage(conversationId: string, sender: 'user' | 'buddy' | 'system', text: string, citations?: Citation[]): Message {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      conversationId,
      sender,
      text,
      citations,
      createdAt: new Date().toISOString()
    };
    this.data.messages.push(msg);

    // Update conversation timestamp and title if it's the first user message
    const conv = this.data.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
      if (sender === 'user' && conv.title === 'New Conversation') {
        conv.title = text.slice(0, 35) + (text.length > 35 ? '...' : '');
      }
    }
    this.saveData();
    return msg;
  }

  clearMessages(conversationId: string): void {
    this.data.messages = this.data.messages.filter(m => m.conversationId !== conversationId);
    this.saveData();
  }

  // --- Lessons & Progress ---
  getLessons(): Lesson[] {
    return [...this.data.lessons].sort((a, b) => a.order - b.order);
  }

  getLessonBySlug(slug: string): Lesson | undefined {
    return this.data.lessons.find(l => l.slug === slug || l.id === slug);
  }

  getLessonProgress(userId: string): LessonProgress[] {
    return this.data.lessonProgress.filter(p => p.userId === userId);
  }

  saveLessonProgress(userId: string, lessonId: string, completed: boolean, quizScore?: number): LessonProgress {
    let progress = this.data.lessonProgress.find(p => p.userId === userId && p.lessonId === lessonId);
    if (!progress) {
      progress = {
        id: `prog-${Date.now()}`,
        userId,
        lessonId,
        completed,
        quizScore,
        completedAt: completed ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString()
      };
      this.data.lessonProgress.push(progress);
    } else {
      progress.completed = completed;
      if (quizScore !== undefined) progress.quizScore = quizScore;
      if (completed && !progress.completedAt) progress.completedAt = new Date().toISOString();
      progress.updatedAt = new Date().toISOString();
    }
    this.saveData();
    return progress;
  }

  // --- Wellness Check-ins ---
  getWellnessCheckins(userId: string, limit = 14): WellnessCheckin[] {
    return this.data.wellnessCheckins
      .filter(c => c.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  saveWellnessCheckin(userId: string, checkin: Omit<WellnessCheckin, 'id' | 'createdAt' | 'userId'>): WellnessCheckin {
    const existingIndex = this.data.wellnessCheckins.findIndex(c => c.userId === userId && c.date === checkin.date);
    const fullCheckin: WellnessCheckin = {
      ...checkin,
      userId,
      id: existingIndex >= 0 ? this.data.wellnessCheckins[existingIndex].id : `chk-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      this.data.wellnessCheckins[existingIndex] = fullCheckin;
    } else {
      this.data.wellnessCheckins.unshift(fullCheckin);
    }
    this.saveData();
    return fullCheckin;
  }

  // --- Knowledge & RAG Retrieval ---
  getKnowledgeSources(): KnowledgeSource[] {
    return this.data.knowledgeSources;
  }

  addKnowledgeSource(source: Omit<KnowledgeSource, 'id'>): KnowledgeSource {
    const newSource: KnowledgeSource = {
      ...source,
      id: `src-${Date.now()}`
    };
    this.data.knowledgeSources.push(newSource);
    this.saveData();
    return newSource;
  }

  searchKnowledge(query: string, maxResults = 3): { chunk: { id: string; content: string }; source: KnowledgeSource; score: number }[] {
    const qLower = query.toLowerCase();
    const queryWords = qLower.split(/\W+/).filter(w => w.length > 2);
    const results: { chunk: { id: string; content: string }; source: KnowledgeSource; score: number }[] = [];

    for (const source of this.data.knowledgeSources) {
      for (const chunk of source.chunks) {
        let score = 0;
        const cLower = chunk.content.toLowerCase();

        for (const word of queryWords) {
          if (cLower.includes(word)) score += 3;
          if (chunk.keywords.some(k => k.toLowerCase().includes(word))) score += 5;
        }

        // Direct keyphrase matches
        if (qLower.includes('otp') && chunk.keywords.includes('otp')) score += 10;
        if (qLower.includes('pin') && chunk.keywords.includes('pin')) score += 10;
        if (qLower.includes('video call') && chunk.keywords.includes('video call')) score += 10;
        if (qLower.includes('scam') && (source.category === 'scam_prevention' || source.category === 'upi_safety')) score += 5;
        if (qLower.includes('fraud') || qLower.includes('stolen') || qLower.includes('cyber')) {
          if (chunk.keywords.includes('1930') || chunk.keywords.includes('cybercrime')) score += 12;
        }

        if (score > 0) {
          results.push({
            chunk: { id: chunk.id, content: chunk.content },
            source,
            score
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }

  // --- Admin stats ---
  getAdminStats() {
    return {
      totalUsers: this.data.users.length,
      eldersCount: this.data.users.filter(u => u.role === 'ELDER').length,
      caregiversCount: this.data.users.filter(u => u.role === 'CAREGIVER').length,
      totalConversations: this.data.conversations.length,
      totalMessages: this.data.messages.length,
      totalCheckins: this.data.wellnessCheckins.length,
      totalKnowledgeSources: this.data.knowledgeSources.length,
      totalLessons: this.data.lessons.length
    };
  }
}

export const db = new DatabaseService();
