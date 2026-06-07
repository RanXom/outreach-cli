import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  fetchEmails,
  resetToken,
} from "../src/services/eazyreachService.ts";

vi.mock("axios");

describe("eazyreachService -> Double Hop Resolution Loop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetToken();
  });

  it("should sequentially request an authorization token and hit the email profile route", async () => {
    vi.mocked(axios.post)
      .mockResolvedValueOnce({
        data: { status: "success", auth_token: "mock_jwt_token", id: "123" },
      })
      .mockResolvedValueOnce({
        data: {
          status: "success",
          emails: [
            { email: "shizain@subspace.money", verification: "verified" },
          ],
        },
      });

    const email = await fetchEmails("www.linkedin.com/in/saiyedshizain");

    expect(email).toBe("shizain@subspace.money");
    expect(axios.post).toHaveBeenCalledTimes(2);

    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/b2b/createAuthToken/"),
      expect.objectContaining({
        clientId: expect.any(String),
        clientSecret: expect.any(String),
      }),
      expect.any(Object),
    );

    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/b2b/linkedin-emails"),
      { linkedinUrl: "www.linkedin.com/in/saiyedshizain" },
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock_jwt_token",
        },
      }),
    );
  });

  it("should reuse cached token on subsequent calls instead of requesting a new one", async () => {
    vi.mocked(axios.post)
      // First call: token + email lookup
      .mockResolvedValueOnce({
        data: { status: "success", auth_token: "cached_token" },
      })
      .mockResolvedValueOnce({
        data: {
          status: "success",
          emails: [{ email: "a@test.com", verification: "verified" }],
        },
      })
      // Second call: only email lookup (token is cached)
      .mockResolvedValueOnce({
        data: {
          status: "success",
          emails: [{ email: "b@test.com", verification: "verified" }],
        },
      });

    await fetchEmails("www.linkedin.com/in/first");
    await fetchEmails("www.linkedin.com/in/second");

    // 1 token request + 2 email lookups = 3 total (not 4)
    expect(axios.post).toHaveBeenCalledTimes(3);
  });

  it("should favor a 'verified' row even if it is placed later in the data response collection array", async () => {
    vi.mocked(axios.post)
      .mockResolvedValueOnce({
        data: { status: "success", auth_token: "valid" },
      })
      .mockResolvedValueOnce({
        data: {
          status: "success",
          emails: [
            { email: "probable@test.com", verification: "probable" },
            { email: "priority-verified@test.com", verification: "verified" }, // Should skip index [0] for this
          ],
        },
      });

    const email = await fetchEmails("www.linkedin.com/in/target");
    expect(email).toBe("priority-verified@test.com");
  });

  it("should fallback cleanly to the first available record if no 'verified' record exists", async () => {
    vi.mocked(axios.post)
      .mockResolvedValueOnce({
        data: { status: "success", auth_token: "valid" },
      })
      .mockResolvedValueOnce({
        data: {
          status: "success",
          emails: [
            {
              email: "fallback-first-probable@test.com",
              verification: "probable",
            },
            { email: "second-probable@test.com", verification: "probable" },
          ],
        },
      });

    const email = await fetchEmails("www.linkedin.com/in/target");
    expect(email).toBe("fallback-first-probable@test.com");
  });

  it("should return null instantly without making network calls if an empty linkedinUrl string is given", async () => {
    const result = await fetchEmails("");
    expect(result).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should return null gracefully when the email collection route drops with an HTTP error code", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(axios.post)
      .mockResolvedValueOnce({
        data: { status: "success", auth_token: "valid" },
      })
      .mockRejectedValueOnce(new Error("404 linkedin profile not found"));

    const result = await fetchEmails("www.linkedin.com/in/dead-link");

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "[Eazyreach Step Drop] Failed resolving target route",
      ),
    );

    consoleSpy.mockRestore();
  });
});
