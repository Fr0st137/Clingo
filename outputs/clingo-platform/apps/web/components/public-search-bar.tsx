"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { HomepageSearchOptions } from "./homepage-client";

export interface SearchFieldData { id: string; label: string; value: string; }
export type PublicSearchValues = Record<string, string>;

export function PublicSearchBar({ markup, initialValues, addOns, onSearch }: {
  markup: string;
  initialValues: PublicSearchValues;
  addOns: Array<{ id: string; label: string }>;
  onSearch: (values: PublicSearchValues) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const html = useMemo(() => ({ __html: markup }), [markup]);
  const cleanup = useRef<(() => void) | undefined>(undefined);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  // Sorting and unrelated filters must not discard the search draft.
  const serializedValues = JSON.stringify(initialValues);
  const serializedAddOns = JSON.stringify(addOns);
  const initialize = useCallback(() => {
    cleanup.current?.();
    if (!root.current) return;
    const options: HomepageSearchOptions = { initialValues: JSON.parse(serializedValues), addOns: JSON.parse(serializedAddOns) };
    cleanup.current = window.initializeClingoHomepage?.(root.current, href => {
      const params = new URL(href, window.location.origin).searchParams;
      onSearchRef.current({ service: params.get("service") || "", area: params.get("area") || "",
        location: params.get("address") || "", addons: params.get("addons") || "" });
    }, {}, options);
  }, [serializedValues, serializedAddOns]);

  useEffect(() => {
    initialize();
    return () => { cleanup.current?.(); cleanup.current = undefined; };
  }, [initialize]);

  return <>
    <div className="home-page__search-stage mx-auto" data-clingo-search ref={root} dangerouslySetInnerHTML={html} />
    <Script src="/clingo-homepage/main.js" strategy="afterInteractive" onReady={initialize} />
  </>;
}
