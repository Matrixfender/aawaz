/**
 * Robust JSON parser that:
 * 1. Strips <think>...</think> blocks and markdown fences
 * 2. Extracts the first valid JSON object/array
 * 3. Retries once with a cleanup pass if initial parse fails
 */
export function parseJson<T = unknown>(raw: string): T {
  const cleaned = stripThinkingAndFences(raw);
  
  // First attempt: parse the cleaned string directly
  const firstAttempt = tryParse<T>(cleaned);
  if (firstAttempt !== null) return firstAttempt;
  
  // Second attempt: extract JSON from the string
  const extracted = extractJson(cleaned);
  if (extracted !== null) {
    const secondAttempt = tryParse<T>(extracted);
    if (secondAttempt !== null) return secondAttempt;
  }
  
  throw new Error(`Failed to parse JSON from response: ${raw.slice(0, 200)}`);
}

function tryParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

function stripThinkingAndFences(raw: string): string {
  let result = raw;
  
  // Remove <think>...</think> blocks (including across newlines)
  result = result.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  result = result.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1');
  
  return result.trim();
}

function extractJson(str: string): string | null {
  // Find the first { or [ and the matching closing bracket
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  
  let startIdx = -1;
  let openChar: string;
  let closeChar: string;
  
  if (firstBrace === -1 && firstBracket === -1) return null;
  
  if (firstBrace === -1) {
    startIdx = firstBracket;
    openChar = '[';
    closeChar = ']';
  } else if (firstBracket === -1) {
    startIdx = firstBrace;
    openChar = '{';
    closeChar = '}';
  } else if (firstBrace < firstBracket) {
    startIdx = firstBrace;
    openChar = '{';
    closeChar = '}';
  } else {
    startIdx = firstBracket;
    openChar = '[';
    closeChar = ']';
  }
  
  // Find matching closing bracket
  let depth = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = startIdx; i < str.length; i++) {
    const ch = str[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return str.slice(startIdx, i + 1);
      }
    }
  }
  
  return null;
}
