import { getImageProps } from "next/image";
import { HomepageClient } from "../components/homepage-client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const getHomepageMarkup = () => {
  const html = readFileSync(join(process.cwd(), "public", "clingo-homepage", "index.html"), "utf8");
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";

  return body
    .replace(/<script\s+src=["']main\.js["']><\/script>/i, "")
    .replaceAll('src="assets/', 'src="/clingo-homepage/assets/')
    .replaceAll('href="assets/', 'href="/clingo-homepage/assets/')
    .replace(/src="(\/clingo-homepage\/assets\/images\/hero-[^"]+\.png)"/g, (_, src: string) => {
      const { props } = getImageProps({ src, alt: "", width: 1024, height: 1536, sizes: "180px" });
      return `src="${props.src.replaceAll("&", "&amp;")}" srcset="${props.srcSet?.replaceAll("&", "&amp;")}" sizes="180px" width="1024" height="1536" decoding="async"`;
    });
};

const addonImages = Object.fromEntries([
  "mycie-okien", "lodowka", "naczynia", "piekarnik", "okap", "mikrofalowka", "prasowanie", "szafa", "szafki", "kuweta"
].map(name => {
  const src = `/clingo-homepage/assets/icons/addon-${name}.png`;
  return [src, getImageProps({ src, alt: "", width: 70, height: 70 }).props.src];
}));

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
      <HomepageClient markup={getHomepageMarkup()} images={addonImages} />
    </>
  );
}
