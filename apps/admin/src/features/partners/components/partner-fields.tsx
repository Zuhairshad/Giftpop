import type { PartnerRequest } from "@giftpop/contracts";
import type { ReactNode } from "react";

import { formatDateTime } from "../lib/format";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="wrap-anywhere whitespace-pre-wrap">{children}</dd>
    </div>
  );
}

function Missing() {
  return <span className="text-muted-foreground">Not given</span>;
}

/** Every field the requester filled in. Email and phone are links. */
export function PartnerFields({
  request,
  countryName,
}: {
  request: PartnerRequest;
  countryName: (code: string) => string;
}) {
  const link = request.kind === "brand" ? request.link : null;
  const isWeb = link !== null && /^https?:\/\//i.test(link);
  return (
    <dl className="grid grid-cols-1 gap-3">
      {request.kind === "brand" ? <Row label="Brand name">{request.brandName}</Row> : null}
      <Row label="Contact name">{request.contactName}</Row>
      <Row label="Email">
        <a className="underline underline-offset-4" href={`mailto:${request.email}`}>
          {request.email}
        </a>
      </Row>
      <Row label="Phone">
        <a
          className="underline underline-offset-4"
          href={`tel:${request.phone.replace(/\s+/g, "")}`}
        >
          {request.phone}
        </a>
      </Row>
      <Row label="Country">{countryName(request.country)}</Row>
      {request.kind === "brand" ? (
        <>
          <Row label="Product categories">{request.productCategories.join(", ")}</Row>
          <Row label="Website or Instagram">
            {isWeb ? (
              <a
                className="underline underline-offset-4"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link}
              </a>
            ) : (
              link
            )}
          </Row>
        </>
      ) : (
        <Row label="What they offer">{request.offering}</Row>
      )}
      <Row label="Message">{request.message === "" ? <Missing /> : request.message}</Row>
      <Row label="Received">{formatDateTime(request.createdAt)}</Row>
    </dl>
  );
}
