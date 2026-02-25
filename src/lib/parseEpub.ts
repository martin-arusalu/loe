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
    throw new Error("Invalid EPUB: missing META-INF/container.xml");
  }

  const containerDoc = new DOMParser().parseFromString(
    containerXml,
    "application/xml",
  );
  const opfPath = containerDoc
    .querySelector("rootfile")
    ?.getAttribute("full-path");
  if (!opfPath) throw new Error("Invalid EPUB: cannot find OPF path");

  // 2. Parse the OPF to get spine item hrefs in reading order
  const opfXml = await zip.file(opfPath)?.async("text");
  if (!opfXml) throw new Error(`Invalid EPUB: cannot read OPF at ${opfPath}`);

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
    const text = (root.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length > 0) textParts.push(text);
  }

  return textParts.join("\n\n");
}
