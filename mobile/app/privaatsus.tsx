/**
 * Store-required legal page. The canonical text lives in the web repo at
 * `public/PrivacyPolicy.md`; it is fetched so both surfaces stay in sync and a
 * policy update does not require an app release.
 */
import LegalDocument from "@/components/LegalDocument";

export default function Privaatsus() {
  return <LegalDocument title="Privaatsuspoliitika" url="https://lauselt.ee/PrivacyPolicy.md" />;
}
