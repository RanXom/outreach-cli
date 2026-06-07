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

  it("should succesfully extract company domains with names", async () => {
    const mockApiResponse = {
      data: {
        companies: [
          { domain: "utterbond.com", name: "Utterbond Inc" },
          { domain: "rekart.io", name: "Rekart" },
        ],
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

    const result = await fetchLookalikes("subspace.money");

    expect(result).toEqual([
      { domain: "utterbond.com", name: "Utterbond Inc" },
      { domain: "rekart.io", name: "Rekart" },
    ]);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("should exclude the seed domain from results", async () => {
    const mockApiResponse = {
      data: {
        companies: [
          { domain: "subspace.money", name: "Subspace" },
          { domain: "utterbond.com", name: "Utterbond" },
        ],
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

    const result = await fetchLookalikes("subspace.money");

    expect(result).toEqual([{ domain: "utterbond.com", name: "Utterbond" }]);
  });

  it("should deduplicate domains", async () => {
    const mockApiResponse = {
      data: {
        companies: [
          { domain: "utterbond.com", name: "Utterbond" },
          { domain: "utterbond.com", name: "Utterbond Inc" },
          { domain: "rekart.io", name: "Rekart" },
        ],
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

    const result = await fetchLookalikes("seed.com");

    expect(result).toHaveLength(2);
    expect(result[0]!.domain).toBe("utterbond.com");
    expect(result[1]!.domain).toBe("rekart.io");
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
