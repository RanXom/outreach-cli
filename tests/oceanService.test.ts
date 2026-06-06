import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  fetchLookalikes,
  sanitizeDomain,
} from "../src/services/oceanService.ts";

vi.mock("axios");

describe("oceanService -> fetchLookalikes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should succesfully extract extract company domains", async () => {
    const mockApiResponse = {
      data: {
        companies: [{ domain: "utterbond.com" }, { domain: "rekart.io" }],
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

    const result = await fetchLookalikes("subspace.money");

    expect(result).toEqual(["utterbond.com", "rekart.io"]);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

describe("sanitizeDomain Helper", () => {
  it("should extract clean hostnames from various dirty inputs", () => {
    expect(sanitizeDomain({ domain: "https://www.google.com/" })).toBe(
      "google.com",
    );
    expect(sanitizeDomain({ domain: "http://stripe.com/v3/checkout" })).toBe(
      "stripe.com",
    );
    expect(sanitizeDomain({ domain: "apple.com" })).toBe("apple.com");
    expect(sanitizeDomain({ domain: undefined })).toBe(undefined);
    expect(sanitizeDomain({ domain: "not-a-valid-url!!!" })).toBe(undefined);
  });
});
