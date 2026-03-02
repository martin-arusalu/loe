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

  // Split on sentence-ending punctuation (optionally followed by a closing quote)
  // followed by whitespace and a letter or opening quote.
  // Handles: . ! ? — optionally followed by » " " then space/newline.
  // Also splits on : when directly followed by an opening quote (e.g. `Something: „quote`).
  const raw = normalized.split(
    /(?<=[.!?—][»""]?)\s+(?=[\p{L}«"„])|(?<=:)\s+(?=[«"„])/u,
  );

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
        chunks.push(currentChunk.join("  \n").trim());
        currentChunk = [];
      }
      chunks.push(line); // heading is its own chunk
    } else {
      currentChunk.push(line);
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("  \n").trim());
  }

  // Now, further split non-heading chunks into sentences as before
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (isHeading(chunk)) {
      finalChunks.push(chunk);
    } else {
      const sentences = splitIntoSentences(chunk);
      const MIN_CHARS = 60;
      const TARGET_MAX = 300; // preferred ceiling; avoid exceeding when combining sentences
      const SOFT_MAX = 380; // soft ceiling; individual sentences under this are kept whole
      const HARD_MAX = 500; // hard ceiling; force-split anything longer
      let i = 0;
      while (i < sentences.length) {
        let subChunk = sentences[i];
        let nextIdx = i + 1;
        // Force-split truly long individual sentences
        if (subChunk.length > HARD_MAX) {
          let splitIdx = subChunk.lastIndexOf(" ", TARGET_MAX);
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
        // Try to combine short sentences, staying within TARGET_MAX
        while (subChunk.length < MIN_CHARS && nextIdx < sentences.length) {
          const testChunk = subChunk + " " + sentences[nextIdx];
          if (testChunk.length > TARGET_MAX) {
            break;
          }
          subChunk = testChunk;
          nextIdx++;
        }
        // One more sentence allowed up to SOFT_MAX if still short
        if (subChunk.length < MIN_CHARS && nextIdx < sentences.length) {
          const testChunk = subChunk + " " + sentences[nextIdx];
          if (testChunk.length <= SOFT_MAX) {
            subChunk = testChunk;
            nextIdx++;
          }
        }
        // Shrink back if somehow over SOFT_MAX
        while (subChunk.length > SOFT_MAX && nextIdx > i + 1) {
          nextIdx--;
          subChunk = sentences.slice(i, nextIdx).join(" ");
        }
        // Last resort: force-split if still over SOFT_MAX (edge case)
        if (subChunk.length > SOFT_MAX) {
          let splitIdx = subChunk.lastIndexOf(" ", TARGET_MAX);
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

  // TODO: Comment in when needed. dev stats: average chunk character length
  // if (finalChunks.length > 0) {
  //   const total = finalChunks.reduce((sum, c) => sum + c.length, 0);
  //   const avg = Math.round(total / finalChunks.length);
  //   const min = Math.min(...finalChunks.map((c) => c.length));
  //   const max = Math.max(...finalChunks.map((c) => c.length));
  //   console.log(`[chunker] ${finalChunks.length} chunks — avg: ${avg} chars, min: ${min}, max: ${max}`);
  // }

  return finalChunks;
}
