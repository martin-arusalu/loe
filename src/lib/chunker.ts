/**
 * Splits a block of text into bite-sized chunks (roughly 1-3 sentences each).
 */

const SENTENCES_PER_CHUNK = 2;

function splitIntoSentences(text: string): string[] {
  // Normalize whitespace and line breaks
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n") // collapse excessive blank lines
    .trim();

  // Split on sentence-ending punctuation followed by whitespace or end of string.
  // Handles: . ! ? followed by space/newline and an uppercase letter or end of text.
  const raw = normalized.split(/(?<=[.!?])\s+(?=[A-Z"'"'])/);

  const sentences: string[] = [];
  for (const s of raw) {
    const trimmed = s.trim();
    if (trimmed.length > 0) {
      sentences.push(trimmed);
    }
  }

  return sentences;
}

export function chunkText(text: string): string[] {
  const sentences = splitIntoSentences(text);

  if (sentences.length === 0) {
    // Fallback: split by paragraphs
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      // Last resort: split by newlines
      return text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    }
    return paragraphs;
  }

  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_CHUNK) {
    const group = sentences.slice(i, i + SENTENCES_PER_CHUNK).join(" ");
    chunks.push(group);
  }

  return chunks;
}
