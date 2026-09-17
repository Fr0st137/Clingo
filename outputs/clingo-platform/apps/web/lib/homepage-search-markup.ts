import { readFileSync } from "node:fs";
import { join } from "node:path";

// Both pages use the original homepage template and its shared initializer.
export function getHomepageSearchMarkup() {
  const html = readFileSync(join(process.cwd(), "public/clingo-homepage/index.html"), "utf8");
  const search = html.match(/<div class="home-page__search-shell"[\s\S]*?<\/section>/)?.[0];
  if (!search) throw new Error("Homepage search template is missing.");
  return search.replaceAll('src="assets/', 'src="/clingo-homepage/assets/');
}
