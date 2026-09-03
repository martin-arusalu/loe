/**
 * Markdown renderer for a single reading chunk.
 * Replaces `streamdown` + the `prose prose-invert` Tailwind typography classes.
 */
import MarkdownDisplay from "react-native-markdown-display";
import { colors, fonts } from "@/theme";

const styles = {
  body: {
    color: colors.stone[100],
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 32,
  },
  paragraph: {
    marginTop: 16,
    marginBottom: 16,
  },
  heading1: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 34,
    color: colors.stone[200],
    marginBottom: 12,
  },
  heading2: {
    fontFamily: fonts.heading,
    fontSize: 22,
    lineHeight: 32,
    color: colors.stone[200],
    marginBottom: 12,
  },
  strong: { fontFamily: fonts.serifBold },
  em: { fontStyle: "italic" as const },
  bullet_list: { marginTop: 16, marginBottom: 16 },
  ordered_list: { marginTop: 16, marginBottom: 16 },
  list_item: { marginTop: 4, marginBottom: 4 },
  link: { color: colors.amber[400] },
};

export default function ChunkMarkdown({ children }: { children: string }) {
  return <MarkdownDisplay style={styles}>{children}</MarkdownDisplay>;
}
