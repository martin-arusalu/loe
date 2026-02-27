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

  // 3. Extract text from each spine document using turndown
  const TurndownService = (await import("turndown")).default;
  const turndownService = new TurndownService();
  const textParts: string[] = [];
  for (const href of spineHrefs) {
    // Normalise path (remove any ./ or ../ segments)
    const normHref = href.replace(/^\.\//, "");
    let html = await zip.file(normHref)?.async("text");
    if (!html) continue;

    // Remove all <img> tags
    html = html.replace(/<img\b[^>]*>/gi, "");
    // Remove all <script> and <style> tags and their content
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");

    // Use turndown to convert HTML to markdown
    const md = turndownService.turndown(html);
    if (md.trim().length > 0) textParts.push(md.trim());
  }

  return textParts.join("\n\n");
}
