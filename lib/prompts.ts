/**
 * LLM prompt templates for Aawaz modes
 */

export function buildNotesPrompt(transcript: string, outputLanguage: string): string {
  return `You are an expert note-taker. Convert the following speech transcript into structured notes.

IMPORTANT RULES:
- Do NOT invent facts, names, dates, or numbers not present in the transcript
- Keep all names, dates, amounts exactly as spoken
- Handle code-mixed Hinglish/Indian language input naturally
- Output ONLY valid JSON, no other text
- Write all output text in: ${outputLanguage}
- If a field has no content, use an empty array []

TRANSCRIPT:
${transcript}

Return a JSON object with exactly this structure:
{
  "title": "Brief descriptive title of the content (5-10 words)",
  "summary": "2-4 sentence summary of the main content",
  "keyPoints": ["key point 1", "key point 2", ...],
  "decisions": ["decision 1", "decision 2", ...],
  "actionItems": [
    {"task": "what needs to be done", "owner": "person responsible or null", "due": "due date/time if mentioned or null"}
  ],
  "openQuestions": ["question 1", "question 2", ...]
}`;
}

export function buildLetterPrompt(
  transcript: string,
  letterType: string,
  outputLanguage: string,
  tone: string
): string {
  const toneDesc = {
    formal: 'formal and professional',
    polite: 'polite and respectful',
    firm: 'firm and assertive but courteous',
  }[tone] || 'formal and professional';

  const typeDesc = {
    complaint: 'complaint letter',
    request: 'request/application letter',
    refund: 'refund or deposit demand letter',
    resignation: 'resignation letter',
    leave: 'leave application',
    other: 'formal letter',
  }[letterType] || 'formal letter';

  return `You are an expert at drafting formal ${typeDesc}s in Indian context. 

IMPORTANT RULES:
- Do NOT invent facts, names, addresses, or details not mentioned in the speech
- Keep all names, amounts, dates exactly as spoken  
- For missing details (like full name, address, company name, date), use placeholders like [Your Name], [Your Address], [Date], [Recipient Name], [Company/Organization Name], [Amount], [Department] etc.
- List ALL placeholders you used in the "placeholders" array
- Tone should be: ${toneDesc}
- Output language: ${outputLanguage}
- Output ONLY valid JSON, no other text

SPEECH TRANSCRIPT:
${transcript}

Return a JSON object with exactly this structure:
{
  "subject": "Subject line of the letter",
  "salutation": "Dear [Name/Sir/Madam],",
  "body": "Full body of the letter with proper paragraphs. Use \\n for line breaks.",
  "closing": "Yours sincerely,\\n[Your Name]\\n[Your Contact]",
  "placeholders": ["[Your Name]", "[Date]", ...]
}`;
}
