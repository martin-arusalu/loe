import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";

export default function TermsOfService() {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch("/TermsOfService.md")
      .then((res) => res.text())
      .then(setContent);
  }, []);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200 px-6 py-12 max-w-3xl mx-auto">
      <div className="text-stone-100 text-xl md:text-2xl leading-relaxed font-serif text-balance prose prose-invert prose-p:my-4 prose-strong:font-bold prose-em:italic prose-ul:my-4 prose-ol:my-4 prose-li:my-1">
        <Streamdown linkSafety={{ enabled: false }}>{content}</Streamdown>
      </div>
    </div>
  );
}
