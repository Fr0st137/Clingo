import Script from "next/script";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const getHomepageMarkup = () => {
  const html = readFileSync(join(process.cwd(), "public", "clingo-homepage", "index.html"), "utf8");
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";

  return body
    .replace(/<script\s+src=["']main\.js["']><\/script>/i, "")
    .replaceAll('src="assets/', 'src="/clingo-homepage/assets/')
    .replaceAll('href="assets/', 'href="/clingo-homepage/assets/');
};

export function ClingoHomepageView() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      <link
        rel="preload"
        href="/clingo-homepage/assets/backgrounds/background-clingo-home.svg"
        as="image"
        type="image/svg+xml"
        fetchPriority="high"
      />
      <link rel="stylesheet" href="/clingo-homepage/styles/base.css" />
      <link rel="stylesheet" href="/clingo-homepage/styles/header-not-login.css" />
      <link rel="stylesheet" href="/clingo-homepage/styles/home.css" />
      <div dangerouslySetInnerHTML={{ __html: getHomepageMarkup() }} />
      <Script src="/clingo-homepage/main.js" strategy="afterInteractive" />
    </>
  );
}
