import type { PartnerRequest, PartnerRequestStatus } from "@giftpop/contracts";

export const STATUS_LABELS: Record<PartnerRequestStatus, string> = {
  new: "New",
  in_talks: "In talks",
  accepted: "Accepted",
  declined: "Declined",
};

export const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as PartnerRequestStatus[]).map(
  (value) => ({ value, label: STATUS_LABELS[value] }),
);

/** Staff names are not available, so a note shows "Staff" and the last 4 characters of the id. */
export function actorLabel(actorId: string): string {
  return `Staff ${actorId.slice(-4)}`;
}

/** Fixed locale and UTC so server and browser print the same text. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

/** The main name in the list: the brand, or the country asked about. */
export function requestTitle(
  request: PartnerRequest,
  countryName: (code: string) => string,
): string {
  return request.kind === "brand" ? request.brandName : countryName(request.country);
}
