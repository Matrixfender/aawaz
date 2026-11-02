// Language definitions for Sarvam AI
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  sttCode: string; // BCP-47 for STT
  ttsCode: string; // language_code for TTS
  translateCode: string; // for Sarvam Translate
}

export const INPUT_LANGUAGES: Language[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: 'Auto', sttCode: '', ttsCode: 'hi-IN', translateCode: 'auto' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी', sttCode: 'hi-IN', ttsCode: 'hi-IN', translateCode: 'hi-IN' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', sttCode: 'mr-IN', ttsCode: 'mr-IN', translateCode: 'mr-IN' },
  { code: 'en-IN', name: 'English', nativeName: 'English', sttCode: 'en-IN', ttsCode: 'en-IN', translateCode: 'en-IN' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', sttCode: 'bn-IN', ttsCode: 'bn-IN', translateCode: 'bn-IN' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', sttCode: 'ta-IN', ttsCode: 'ta-IN', translateCode: 'ta-IN' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', sttCode: 'te-IN', ttsCode: 'te-IN', translateCode: 'te-IN' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', sttCode: 'gu-IN', ttsCode: 'gu-IN', translateCode: 'gu-IN' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sttCode: 'kn-IN', ttsCode: 'kn-IN', translateCode: 'kn-IN' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', sttCode: 'ml-IN', ttsCode: 'ml-IN', translateCode: 'ml-IN' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', sttCode: 'pa-IN', ttsCode: 'pa-IN', translateCode: 'pa-IN' },
  { code: 'od-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', sttCode: 'od-IN', ttsCode: 'od-IN', translateCode: 'od-IN' },
];

export const OUTPUT_LANGUAGES: Language[] = INPUT_LANGUAGES.filter(l => l.code !== 'auto');

export function getLanguageByCode(code: string): Language | undefined {
  return INPUT_LANGUAGES.find(l => l.code === code);
}

export const LETTER_TYPES = [
  { value: 'complaint', label: 'Complaint' },
  { value: 'request', label: 'Request / Application' },
  { value: 'refund', label: 'Refund / Deposit Demand' },
  { value: 'resignation', label: 'Resignation' },
  { value: 'leave', label: 'Leave Application' },
  { value: 'other', label: 'Other' },
] as const;

export const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'polite', label: 'Polite' },
  { value: 'firm', label: 'Firm' },
] as const;
