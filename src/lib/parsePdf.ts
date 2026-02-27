import { getDocument } from "pdfjs-dist";

type Item = { str: string; x: number; y: number; fontSize: number };
type Line = { y: number; xMin: number; fontSize: number; text: string };

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function normalizeSpace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function isMostlyAllCaps(s: string) {
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length < 6) return false;
  const caps = letters.replace(/[^A-Z]/g, "").length;
  return caps / letters.length > 0.8;
}

function looksLikeChapterHeading(s: string) {
  const t = normalizeSpace(s);
  if (!t) return false;
  if (/^chapter\s+\d+/i.test(t)) return true;
  if (/^ch\.\s*\d+/i.test(t)) return true;
  if (/^(prologue|epilogue)\b/i.test(t)) return true;
  // Common ebook headings: short, all-caps line
  if (t.length <= 40 && isMostlyAllCaps(t)) return true;
  return false;
}

function looksLikePageNumber(s: string) {
  const t = normalizeSpace(s);
  return /^\d{1,4}$/.test(t);
}

function roundToStep(n: number, step: number) {
  return Math.round(n / step) * step;
}

function mdEscapeMinimal(s: string) {
  // Keep light: just avoid accidental code fences
  return s.replace(/```/g, "\\`\\`\\`");
}

/**
 * Convert a text-based, single-column ebook PDF to readable Markdown.
 */
export async function parsePdf(
  arrayBuffer: ArrayBuffer,
  opts?: {
    maxPages?: number;
    // How aggressively to group text items into the same line.
    // Lower = more lines (safer). Higher = fewer lines (may merge).
    yStep?: number;

    // Consider top/bottom % of page as header/footer zones
    headerZonePct?: number;
    footerZonePct?: number;

    // How many pages must share the same header/footer line to drop it
    repeatedLineMinCount?: number;

    // Paragraph logic tuning
    paragraphGapFactor?: number; // larger = fewer paragraph breaks
  },
): Promise<string> {
  const maxPages = opts?.maxPages ?? Infinity;
  const yStep = opts?.yStep ?? 2; // ebooks usually stable
  const headerZonePct = clamp01(opts?.headerZonePct ?? 0.10);
  const footerZonePct = clamp01(opts?.footerZonePct ?? 0.12);
  const repeatedLineMinCount = opts?.repeatedLineMinCount ?? 3;
  const paragraphGapFactor = opts?.paragraphGapFactor ?? 1.8;

  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = Math.min(pdf.numPages, maxPages);

  // First pass: extract lines per page and gather candidate header/footer repeats
  const pagesLines: Line[][] = [];
  const repeatCounts = new Map<string, number>();

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageHeight = viewport.height;

    const tc = await page.getTextContent({});

    const items: Item[] = (tc.items as any[])
      .map((it) => {
        const tx = it.transform; // [a,b,c,d,e,f] ; e=x, f=y
        const x = tx[4];
        const y = tx[5];
        // font size approx: d is scaleY
        const fontSize = Math.abs(tx[3]) || 0;
        return { str: it.str ?? "", x, y, fontSize };
      })
      .filter((it) => normalizeSpace(it.str).length > 0);

    // Group items into lines by rounded y
    const lineMap = new Map<number, Item[]>();
    for (const it of items) {
      const yKey = roundToStep(it.y, yStep);
      const arr = lineMap.get(yKey) ?? [];
      arr.push(it);
      lineMap.set(yKey, arr);
    }

    const lines: Line[] = [];
    for (const [y, arr] of lineMap.entries()) {
      arr.sort((a, b) => a.x - b.x);
      const text = normalizeSpace(arr.map((a) => a.str).join(" "));
      const xMin = arr.length ? arr[0].x : 0;
      const fontSize = arr.reduce((m, a) => Math.max(m, a.fontSize), 0);
      if (text) lines.push({ y, xMin, fontSize, text });
    }

    // Sort lines from top to bottom (PDF coords: y increases upward; in pdfjs viewport, y is from bottom)
    // In practice, sorting by y descending usually gives top→bottom reading order.
    lines.sort((a, b) => b.y - a.y);

    // Record potential header/footer lines (top/bottom zones)
    const headerCut = pageHeight * (1 - headerZonePct);
    const footerCut = pageHeight * footerZonePct;

    for (const ln of lines) {
      const t = ln.text;
      if (!t) continue;

      const inHeader = ln.y >= headerCut;
      const inFooter = ln.y <= footerCut;

      if ((inHeader || inFooter) && t.length <= 80) {
        // Avoid counting pure page numbers too aggressively; still count, but separately helpful later
        const key = t.toLowerCase();
        repeatCounts.set(key, (repeatCounts.get(key) ?? 0) + 1);
      }
    }

    pagesLines.push(lines);
  }

  // Determine which repeated header/footer lines to drop
  const dropSet = new Set<string>();
  for (const [k, count] of repeatCounts.entries()) {
    if (count >= repeatedLineMinCount) dropSet.add(k);
  }

  // Second pass: build markdown
  const out: string[] = [];
  let prevLineY: number | null = null;
  let prevLineText = "";
  let typicalLineGap = 0;

  // Estimate a typical line gap from first few pages (helps paragraph break heuristic)
  {
    const gaps: number[] = [];
    for (const lines of pagesLines.slice(0, Math.min(5, pagesLines.length))) {
      for (let i = 1; i < lines.length; i++) {
        const g = Math.abs(lines[i - 1].y - lines[i].y);
        if (g > 0 && g < 80) gaps.push(g);
      }
    }
    gaps.sort((a, b) => a - b);
    typicalLineGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 12;
  }
  const paraGap = typicalLineGap * paragraphGapFactor;

  // Helper: decide if we should insert a paragraph break between lines
  function shouldBreakParagraph(prev: string, curr: string, yGap: number) {
    if (!prev) return false;
    if (!curr) return true;
    if (yGap >= paraGap) return true;

    // If previous line ends with sentence punctuation, prefer paragraph break when gap is moderate
    if (yGap >= typicalLineGap * 1.25 && /[.!?]["')\]]?$/.test(prev)) {
      return true;
    }

    // If current line looks like a chapter heading, break
    if (looksLikeChapterHeading(curr)) return true;

    return false;
  }

  // Hyphenation merge: join "hy-" + "phen" => "hyphen"
  function mergeHyphenWrap(prev: string, curr: string) {
    const p = prev;
    const c = curr;

    // Only if prev ends with a hyphen attached to a word (no trailing space)
    // and curr starts with a lowercase letter (common for wrapped words)
    if (/[A-Za-z]-$/.test(p) && /^[a-z]/.test(c)) {
      return { mergedPrev: p.slice(0, -1), mergedCurr: c }; // we'll concatenate without space
    }
    return null;
  }

  // Build per page, but keep flow continuous
  for (let pageIdx = 0; pageIdx < pagesLines.length; pageIdx++) {
    const lines = pagesLines[pageIdx];

    // Optional: add a page separator comment (usually not wanted for ebooks)
    // out.push(`\n<!-- Page ${pageIdx + 1} -->\n`);

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      let text = ln.text;

      // Drop repeated header/footer lines
      if (dropSet.has(text.toLowerCase())) continue;

      // Drop standalone page numbers (common in footers)
      if (looksLikePageNumber(text)) continue;

      // Heading detection
      const isHeading = looksLikeChapterHeading(text);

      const yGap = prevLineY === null ? 0 : Math.abs(prevLineY - ln.y);

      // If heading: ensure blank line before and format as Markdown heading
      if (isHeading) {
        if (out.length && out[out.length - 1].trim() !== "") out.push("");
        out.push(`# ${mdEscapeMinimal(text)}`);
        out.push("");
        prevLineY = ln.y;
        prevLineText = text;
        continue;
      }

      // Normal text line
      text = mdEscapeMinimal(text);

      // Decide paragraph breaks vs line joins
      if (out.length === 0) {
        out.push(text);
      } else {
        const last = out[out.length - 1] ?? "";
        const lastTrim = last.trim();

        // If we just wrote a blank line, start new paragraph
        if (lastTrim === "") {
          out.push(text);
        } else {
          // Hyphenation handling
          const hy = mergeHyphenWrap(lastTrim, text);
          if (hy) {
            out[out.length - 1] = hy.mergedPrev + hy.mergedCurr; // no space
          } else if (shouldBreakParagraph(lastTrim, text, yGap)) {
            out.push("");
            out.push(text);
          } else {
            // Join wrapped lines: add a space unless previous ends with hyphen/emdash
            out[out.length - 1] = lastTrim + " " + text;
          }
        }
      }

      prevLineY = ln.y;
      prevLineText = text;
    }

    // Add an empty line between pages to reduce accidental joins across pages
    // (ebooks often have headers/footers; we removed them, but page breaks can still be paragraph breaks)
    out.push("");
    prevLineY = null;
    prevLineText = "";
  }

  // Cleanup: collapse too many blank lines
  const cleaned: string[] = [];
  for (const line of out) {
    if (
      line.trim() === "" && cleaned.length &&
      cleaned[cleaned.length - 1].trim() === ""
    ) {
      continue;
    }
    cleaned.push(line);
  }

  return cleaned.join("\n").trim() + "\n";
}
