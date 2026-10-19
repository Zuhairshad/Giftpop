import pkg from "../../../package.json" with { type: "json" };

/** The API package version, bundled at build time. */
export const APP_VERSION: string = pkg.version;
