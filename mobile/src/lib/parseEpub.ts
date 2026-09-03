/**
 * Parses an EPUB (base64 string) into markdown text.
 *
 * Same algorithm as the web `src/lib/parseEpub.ts`, but React Native has no
 * `DOMParser`, so XML goes through `fast-xml-parser` and the HTML→markdown step
 * is a small hand-rolled converter instead of `turndown` (which needs a DOM).
 */
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) =>
    name === "item" || name === "itemref" || name === "rootfile",
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

const BLOCK_END = /<\/(p|div|section|article|li|tr|h[1-6]|blockquote)>/gi;

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** Minimal HTML → markdown: headings, emphasis, list items, paragraph breaks. */
function htmlToMarkdown(html: string): string {
  return decodeEntities(
    html
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
      .replace(/<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi, "\n\n## $2\n\n")
      .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
      .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(BLOCK_END, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function parseEpub(base64: string): Promise<string> {
  const zip = await JSZip.loadAsync(base64, { base64: true });

  // 1. Locate the OPF via META-INF/container.xml
  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) {
    throw new Error("Vigane EPUB: puudub META-INF/container.xml");
  }

  const container = xml.parse(containerXml);
  const opfPath: string | undefined = toArray(
    container?.container?.rootfiles?.rootfile,
  )[0]?.["@_full-path"];
  if (!opfPath) throw new Error("Vigane EPUB: OPF faili asukohta ei leitud");

  // 2. Read the manifest + spine to get documents in reading order
  const opfXml = await zip.file(opfPath)?.async("text");
  if (!opfXml) {
    throw new Error(
      `Vigane EPUB: OPF faili ei õnnestu lugeda asukohas ${opfPath}`,
    );
  }

  const opf = xml.parse(opfXml);
  const opfDir = opfPath.includes("/") ? opfPath.replace(/\/[^/]+$/, "/") : "";

  const manifestMap = new Map<string, string>();
  for (const item of toArray(opf?.package?.manifest?.item)) {
    const id = item?.["@_id"];
    const href = item?.["@_href"];
    if (id && href) manifestMap.set(id, href);
  }

  const spineHrefs: string[] = [];
  for (const ref of toArray(opf?.package?.spine?.itemref)) {
    const href = manifestMap.get(ref?.["@_idref"]);
    if (href) spineHrefs.push(opfDir + href);
  }

  // 3. Convert each document to markdown
  const parts: string[] = [];
  for (const href of spineHrefs) {
    const html = await zip.file(href.replace(/^\.\//, ""))?.async("text");
    if (!html) continue;
    const md = htmlToMarkdown(html);
    if (md.length > 0) parts.push(md);
  }

  return parts.join("\n\n");
}
