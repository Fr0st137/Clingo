import { Fragment, type ReactNode } from "react";

// Render the editor's small formatting vocabulary as React nodes, never raw HTML.
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|~~[^~]+~~|<u>[^<]+<\/u>|<mark>[^<]+<\/mark>)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("_") && part.endsWith("_")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <s key={index}>{part.slice(2, -2)}</s>;
    if (part.startsWith("<u>") && part.endsWith("</u>")) return <u key={index}>{part.slice(3, -4)}</u>;
    if (part.startsWith("<mark>") && part.endsWith("</mark>")) return <mark key={index}>{part.slice(6, -7)}</mark>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
export function ProviderOfferDescription({ text }: { text: string }) {
  return <>{text.split("\n").map((line, index) => <Fragment key={index}>{index > 0 && <br />}{line.startsWith("- ") ? <>• {inline(line.slice(2))}</> : inline(line)}</Fragment>)}</>;
}
