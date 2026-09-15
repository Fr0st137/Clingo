export type ProviderSearchSource = {
  id: string;
  image?: string;
  provider: string;
};

export type ProviderSearchResult = ProviderSearchSource;

export function normalizedProviderName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pl-PL")
    .replace(/[ł]/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchRank(name: string, query: string) {
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.split(" ").some((part) => part.startsWith(query))) return 2;
  return 3;
}

export function searchProviders(providers: ProviderSearchSource[], queryValue: string, limit = 8): ProviderSearchResult[] {
  const query = normalizedProviderName(queryValue);
  if (!query) return [];

  const terms = query.split(/\s+/).filter(Boolean);

  return providers
    .map((provider, index) => ({ index, name: normalizedProviderName(provider.provider), provider }))
    .filter(({ name }) => terms.every((term) => name.includes(term)))
    .sort((first, second) => matchRank(first.name, query) - matchRank(second.name, query) || first.index - second.index)
    .slice(0, Math.max(0, limit))
    .map(({ provider }) => provider);
}
