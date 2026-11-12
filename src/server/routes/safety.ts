import { Router } from 'express';
import { analyzeSuspiciousMessage } from '../gemini.js';

const router = Router();

const EMERGENCY_CONTACTS = [
  {
    name: 'National Emergency Helpline',
    number: '112',
    category: 'Police, Fire, Ambulance & Medical',
    description: 'Universal emergency number across India, available 24/7 without recharge.'
  },
  {
    name: 'National Cyber Financial Fraud Helpline',
    number: '1930',
    category: 'Cyber Fraud & Stolen Money',
    description: 'Ministry of Home Affairs helpline to immediately report and freeze unauthorized bank transfers.'
  },
  {
    name: 'Elder Line (National Helpline for Senior Citizens)',
    number: '14567',
    category: 'Senior Citizen Support & Protection',
    description: 'Govt. of India toll-free helpline providing guidance, emotional support, and elder abuse intervention.'
  },
  {
    name: 'RBI Financial Ombudsman',
    number: '14448',
    category: 'Banking Grievances',
    description: 'Reserve Bank of India helpline for unresolved complaints with commercial banks and UPI providers.'
  }
];

const SCAM_ADVISORIES = [
  {
    id: 'adv-1',
    title: 'The "Digital Arrest" Video Call Scam',
    severity: 'CRITICAL',
    summary: 'Scammers dress in fake police or customs uniforms on WhatsApp/Skype video calls claiming your parcel contains illegal goods and placing you under fake "Digital Arrest".',
    safetyRule: 'Indian law has NO provision for Digital Arrest or court hearings on WhatsApp. Real police will NEVER interrogate you on video calls or ask you to transfer funds to "safety accounts". Disconnect immediately and call 1930.',
    keywords: ['digital arrest', 'customs', 'parcel', 'police video call']
  },
  {
    id: 'adv-2',
    title: 'Urgent Electricity Bill Cutoff SMS',
    severity: 'HIGH',
    summary: 'SMS claiming "Your power will be disconnected at 9:30 PM tonight due to unpaid previous month bill. Call officer at XXXXXXXXXX".',
    safetyRule: 'State power boards never send messages from 10-digit private numbers. Never call the number in the SMS. Check your official electricity bill app or bill receipt.',
    keywords: ['electricity bill', 'power disconnected', 'cutoff']
  },
  {
    id: 'adv-3',
    title: 'Receiving Money via UPI QR Code / PIN Trick',
    severity: 'HIGH',
    summary: 'A buyer on OLX or stranger says they sent you ₹10,000 and asks you to scan a QR code or enter your UPI PIN to receive the money.',
    safetyRule: 'THE GOLDEN RULE: You only enter your UPI PIN when money is leaving your account. You NEVER need a PIN to receive money into your bank.',
    keywords: ['qr code', 'upi pin', 'receive money']
  },
  {
    id: 'adv-4',
    title: 'AnyDesk / Screen Sharing App Installation',
    severity: 'CRITICAL',
    summary: 'Caller claiming to be customer service asks you to install AnyDesk, RustDesk, or QuickSupport to "verify your KYC" or "fix your phone".',
    safetyRule: 'These apps allow the caller to see your screen and passwords in real-time. NEVER install screen sharing apps at the request of an unknown caller.',
    keywords: ['anydesk', 'teamviewer', 'rustdesk', 'screen sharing']
  }
];

router.get('/safety/contacts', (_req, res) => {
  res.json({ contacts: EMERGENCY_CONTACTS });
});

router.get('/safety/advisories', (_req, res) => {
  res.json({ advisories: SCAM_ADVISORIES });
});

router.post('/safety/analyze', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Please paste or type the message you want to check.' });
      return;
    }

    const report = await analyzeSuspiciousMessage(text.trim(), language);
    res.json({ report });
  } catch (err: any) {
    console.error('Safety analyze error:', err);
    res.status(500).json({ error: 'Could not complete scan. Please call 1930 if you suspect fraud.' });
  }
});

export default router;
