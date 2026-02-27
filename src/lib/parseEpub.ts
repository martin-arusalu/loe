/**
 * Parses an EPUB file (ArrayBuffer) and returns extracted plain text.
 * Treats the EPUB as a ZIP, reads the OPF spine, and extracts text from
 * each HTML/XHTML item directly — no epub.js required.
 */
export async function parseEpub(buffer: ArrayBuffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  // 1. Find the OPF path from META-INF/container.xml
  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) {
    throw new Error("Vigane EPUB: puudub META-INF/container.xml");
  }

  const containerDoc = new DOMParser().parseFromString(
    containerXml,
    "application/xml",
  );
  const opfPath = containerDoc
    .querySelector("rootfile")
    ?.getAttribute("full-path");
  if (!opfPath) throw new Error("Vigane EPUB: OPF faili asukohta ei leitud");

  // 2. Parse the OPF to get spine item hrefs in reading order
  const opfXml = await zip.file(opfPath)?.async("text");
  if (!opfXml) {
    throw new Error(
      `Vigane EPUB: OPF faili ei õnnestu lugeda asukohas ${opfPath}`,
    );
  }

  const opfDoc = new DOMParser().parseFromString(opfXml, "application/xml");
  const opfDir = opfPath.includes("/") ? opfPath.replace(/\/[^/]+$/, "/") : "";

  // Build id→href map from <manifest>
  const manifestMap = new Map<string, string>();
  opfDoc.querySelectorAll("manifest item").forEach((el) => {
    const id = el.getAttribute("id");
    const href = el.getAttribute("href");
    if (id && href) manifestMap.set(id, href);
  });

  // Collect spine idrefs in order
  const spineHrefs: string[] = [];
  opfDoc.querySelectorAll("spine itemref").forEach((el) => {
    const idref = el.getAttribute("idref");
    if (idref) {
      const href = manifestMap.get(idref);
      if (href) spineHrefs.push(opfDir + href);
    }
  });

  // 3. Extract text from each spine document
  const textParts: string[] = [];
  for (const href of spineHrefs) {
    // Normalise path (remove any ./ or ../ segments)
    const normHref = href.replace(/^\.\//, "");
    const html = await zip.file(normHref)?.async("text");
    if (!html) continue;

    const doc = new DOMParser().parseFromString(html, "application/xhtml+xml");
    const root = doc.body ?? doc.documentElement;
    if (!root) continue;

    root.querySelectorAll("script, style").forEach((el) => el.remove());

    // Helper to serialize element with simple structure and inline styles
    function serializeNode(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
      }
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      let content = Array.from(el.childNodes).map(serializeNode).join("");
      console.log("TAG:", tag);
      console.log(content);
      switch (tag) {
        case "h1":
          return `\n\n# ${content.trim()}\n\n`;
        case "h2":
          return `\n\n## ${content.trim()}\n\n`;
        case "h3":
          return `\n\n### ${content.trim()}\n\n`;
        case "h4":
          return `\n\n#### ${content.trim()}\n\n`;
        case "h5":
          return `\n\n##### ${content.trim()}\n\n`;
        case "h6":
          return `\n\n###### ${content.trim()}\n\n`;
        case "b":
        case "strong":
          return `**${content}**`;
        case "i":
        case "em":
          return `*${content}*`;
        case "u":
          return `_${content}_`;
        case "br":
          return "\n";
        case "p":
          return `\n\n${content.trim()}\n\n`;
        case "li":
          return `- ${content.trim()}\n`;
        case "ul":
        case "ol":
          return `\n${content}\n`;
        default:
          return content;
      }
    }

    // Only serialize block-level elements (p, h1-h6, ul, ol, etc.) at top level
    const blocks = Array.from(root.children).filter(
      (el) =>
        [
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "p",
          "ul",
          "ol",
          "blockquote",
          "pre",
        ].includes(el.tagName.toLowerCase()),
    );
    let part = "";
    if (blocks.length > 0) {
      part = blocks.map(serializeNode).join("").replace(/\n{3,}/g, "\n\n");
    } else {
      part = serializeNode(root).replace(/\n{3,}/g, "\n\n");
    }
    part = part.replace(/[ \t]+/g, " ").replace(/\n +/g, "\n").trim();
    if (part.length > 0) textParts.push(part);
  }

  return textParts.join("\n\n");
}
