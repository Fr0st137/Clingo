"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent } from "react";

declare global {
  interface Window {
    initializeClingoHomepage?: (root: HTMLElement, navigate: (href: string) => void, images: Record<string, string>) => () => void;
  }
}

export function HomepageClient({ markup, images }: { markup: string; images: Record<string, string> }) {
  const root = useRef<HTMLDivElement>(null);
  const cleanup = useRef<(() => void) | undefined>(undefined);
  const router = useRouter();
  const initialize = useCallback(() => {
    cleanup.current?.();
    if (root.current) cleanup.current = window.initializeClingoHomepage?.(root.current, href => router.push(href), images);
  }, [router, images]);

  useEffect(() => {
    initialize();
    return () => { cleanup.current?.(); cleanup.current = undefined; };
  }, [initialize]);

  useEffect(() => {
    router.prefetch("/tablica-ogloszen");
  }, [router]);

  function followLink(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || link.target || link.hasAttribute("download")) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin || !["http:", "https:"].includes(url.protocol)) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
    event.preventDefault();
    router.push(`${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <>
      <div data-clingo-homepage ref={root} onClick={followLink} dangerouslySetInnerHTML={{ __html: markup }} />
      <Script src="/clingo-homepage/main.js" strategy="afterInteractive" onReady={initialize} />
    </>
  );
}
