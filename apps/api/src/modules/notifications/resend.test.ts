import { describe, expect, it, vi } from "vitest";

import { createResendProvider } from "./resend";

const message = { to: "sara@example.com", subject: "Hi", text: "Body" };

describe("createResendProvider", () => {
  it("posts the message with the key as a bearer token", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    await createResendProvider({ apiKey: "re_key", from: "Shop <a@b.com>", fetchImpl }).send(
      message,
    );
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer re_key");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "Shop <a@b.com>",
      to: ["sara@example.com"],
      subject: "Hi",
      text: "Body",
    });
  });

  it("throws on a non-2xx answer without leaking the key", async () => {
    const fetchImpl = vi.fn(async () => new Response("domain not verified", { status: 403 }));
    const provider = createResendProvider({ apiKey: "re_secret", from: "a@b.com", fetchImpl });
    const error = await provider.send(message).then(
      () => new Error("did not throw"),
      (e: unknown) => e as Error,
    );
    expect(error.message).toContain("403");
    expect(error.message).toContain("domain not verified");
    expect(error.message).not.toContain("re_secret");
  });
});
