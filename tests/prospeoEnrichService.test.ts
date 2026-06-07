import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { enrichEmails } from "../src/services/prospeoEnrichService.ts";

vi.mock("axios");

describe("prospeoEnrichService -> enrichEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should enrich all prospects and return a Map of linkedinUrl -> email", async () => {
    vi.mocked(axios.post)
      .mockResolvedValueOnce({
        data: {
          error: false,
          person: {
            email: {
              status: "VERIFIED",
              revealed: true,
              email: "tyler@fc.com",
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          error: false,
          person: {
            email: {
              status: "VERIFIED",
              revealed: true,
              email: "marla@paper.io",
            },
          },
        },
      });

    const prospects = [
      {
        name: "Tyler Durden",
        title: "CEO",
        linkedinUrl: "https://www.linkedin.com/in/tyler-durden",
      },
      {
        name: "Marla Singer",
        title: "VP",
        linkedinUrl: "https://www.linkedin.com/in/marla-singer",
      },
    ];

    const promise = enrichEmails(prospects);

    // Advance past the delay between requests
    await vi.advanceTimersByTimeAsync(1200);

    const result = await promise;

    expect(result.size).toBe(2);
    expect(result.get("https://www.linkedin.com/in/tyler-durden")).toBe("tyler@fc.com");
    expect(result.get("https://www.linkedin.com/in/marla-singer")).toBe("marla@paper.io");
    expect(axios.post).toHaveBeenCalledTimes(2);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/enrich-person"),
      expect.objectContaining({
        only_verified_email: true,
        data: {
          linkedin_url: "https://www.linkedin.com/in/tyler-durden",
        },
      }),
      expect.any(Object),
    );
  });

  it("should skip prospects with unrevealed emails", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        error: false,
        person: {
          email: {
            status: "VERIFIED",
            revealed: false,
            email: "hidden@***.com",
          },
        },
      },
    });

    const result = await enrichEmails([
      {
        name: "Hidden",
        title: "CTO",
        linkedinUrl: "https://www.linkedin.com/in/hidden",
      },
    ]);

    expect(result.size).toBe(0);
  });

  it("should skip prospects when API returns error (NO_MATCH)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(axios.post).mockResolvedValue({
      data: {
        error: true,
        error_code: "NO_MATCH",
      },
    });

    const result = await enrichEmails([
      {
        name: "Ghost",
        title: "VP",
        linkedinUrl: "https://www.linkedin.com/in/ghost",
      },
    ]);

    expect(result.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Ghost"),
    );

    consoleSpy.mockRestore();
  });

  it("should return an empty Map without API calls for empty input", async () => {
    const result = await enrichEmails([]);
    expect(result.size).toBe(0);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should gracefully skip prospects that fail with HTTP errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(axios.post).mockRejectedValue({
      response: {
        data: {
          error: true,
          error_code: "INSUFFICIENT_CREDITS",
        },
      },
    });

    const result = await enrichEmails([
      {
        name: "Test",
        title: "VP",
        linkedinUrl: "https://www.linkedin.com/in/test",
      },
    ]);

    expect(result.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("INSUFFICIENT_CREDITS"),
    );

    consoleSpy.mockRestore();
  });
});
