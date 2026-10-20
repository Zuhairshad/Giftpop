/** Top-level pages about an order already placed: the visitor is not browsing, so no suggestion. */
const ORDER_PAGES = new Set(["order", "track"]);

/**
 * The "Shipping to X?" suggestion is for browsing. Inside the builder and checkout the visitor has
 * already chosen a country (it is in the URL), and on order and tracking pages they are looking at
 * an order they placed, so the banner would only add Tab stops and push the content down.
 * The 404 page hides it with CSS (`data-hide-suggestion`), since its path can be anything.
 */
export function suggestionHiddenOn(pathname: string): boolean {
  const [, first = "", section] = pathname.split("/");
  if (ORDER_PAGES.has(first.toLowerCase())) return true;
  return section === "build" || section === "checkout";
}
