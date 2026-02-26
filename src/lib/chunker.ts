/**
 * Splits a block of text into bite-sized chunks (roughly 1-3 sentences each).
 */

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
  const lines = text.split(/\n/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  function isHeading(line: string): boolean {
    // Only consider markdown h1 and h2 headings
    return /^(#|##)\s+.+/.test(line);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    if (isHeading(line)) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" ").trim());
        currentChunk = [];
      }
      chunks.push(line); // heading is its own chunk
    } else {
      currentChunk.push(line);
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" ").trim());
  }

  // Now, further split non-heading chunks into sentences as before
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (isHeading(chunk)) {
      finalChunks.push(chunk);
    } else {
      const sentences = splitIntoSentences(chunk);
      const MIN_CHARS = 80;
      const HARD_MAX = 600;
      let i = 0;
      while (i < sentences.length) {
        let subChunk = sentences[i];
        let nextIdx = i + 1;
        if (subChunk.length > HARD_MAX) {
          let splitIdx = subChunk.lastIndexOf(" ", HARD_MAX);
          if (splitIdx === -1 || splitIdx < MIN_CHARS) splitIdx = HARD_MAX;
          const firstPart = subChunk.slice(0, splitIdx) + "...";
          const rest = subChunk.slice(splitIdx).trim();
          finalChunks.push(firstPart);
          if (rest.length > 0) {
            sentences.splice(i + 1, 0, rest);
          }
          i++;
          continue;
        }
        while (subChunk.length < MIN_CHARS && nextIdx < sentences.length) {
          const testChunk = subChunk + " " + sentences[nextIdx];
          if (testChunk.length > HARD_MAX) {
            break;
          }
          subChunk = testChunk;
          nextIdx++;
        }
        if (subChunk.length < MIN_CHARS && nextIdx < sentences.length) {
          const testChunk = subChunk + " " + sentences[nextIdx];
          if (testChunk.length <= HARD_MAX) {
            subChunk = testChunk;
            nextIdx++;
          }
        }
        while (subChunk.length > HARD_MAX && nextIdx > i + 1) {
          nextIdx--;
          subChunk = sentences.slice(i, nextIdx).join(" ");
        }
        if (subChunk.length > HARD_MAX) {
          let splitIdx = subChunk.lastIndexOf(" ", HARD_MAX);
          if (splitIdx === -1 || splitIdx < MIN_CHARS) splitIdx = HARD_MAX;
          const firstPart = subChunk.slice(0, splitIdx) + "...";
          const rest = subChunk.slice(splitIdx).trim();
          finalChunks.push(firstPart);
          if (rest.length > 0) {
            sentences.splice(nextIdx, 0, rest);
          }
          i = nextIdx + 1;
          continue;
        }
        finalChunks.push(subChunk);
        i = nextIdx;
      }
    }
  }
  return finalChunks;
}
