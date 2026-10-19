/**
 * The "Shipping to X?" suggestion is for browsing. Inside the builder and checkout the visitor has
 * already chosen a country (it is in the URL), and the banner would only add three Tab stops and
 * cover the step they are working on.
 */
export function suggestionHiddenOn(pathname: string): boolean {
  const [, , section] = pathname.split("/");
  return section === "build" || section === "checkout";
}
