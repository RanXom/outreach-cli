import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { findDecisionMakers } from "../src/services/prospeoService.ts";

vi.mock("axios");

describe("prospeoService -> findDecisionMakers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should succesfully extract and format decision makers LinkedIn profiles", async () => {
    const mockApiResponse = {
      data: {
        error: false,
        free: false,
        results: [
          {
            person: {
              full_name: "Tyler Durden",
              current_job_title: "Chief Executive Officer",
              linkedin_url: "https://linkedin.com/in/tyler-durden",
            },
          },
          {
            person: {
              linkedin_url: "https://linkedin.com/in/anonymous-exec",
            },
          },
          {
            person: {
              full_name: "Hidden Profile",
              current_job_title: "Vice President",
              linkedin_url: "",
            },
          },
        ],
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

    const result = await findDecisionMakers(["fc.com"]);

    expect(result).toEqual([
      {
        name: "Tyler Durden",
        title: "Chief Executive Officer",
        linkedinUrl: "https://linkedin.com/in/tyler-durden",
      },
      {
        name: "Executive Target",
        title: "Leadership Matrix Target",
        linkedinUrl: "https://linkedin.com/in/anonymous-exec",
      },
    ]);

    expect(axios.post).toHaveBeenCalledTimes(1);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: {
          "X-KEY": expect.any(String),
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("should handle structural validation errors returned inside successful HTTP blocks gracefully", async () => {
    const mockApiResponse = {
      data: {
        error: true,
        error_code: "INVALID_FILTERS",
        filter_error: "The value is not supported.",
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await findDecisionMakers(["bad-domain!!!"]);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Prospeo search flag returned true error validation state",
    );

    consoleErrorSpy.mockRestore();
  });

  it("should extract rich API error codes when requests are rejected with a non-2xx status", async () => {
    const mockHttpError = {
      response: {
        data: {
          error: true,
          error_code: "INVALID_FILTERS",
          filter_error:
            "The value `Accountingg` is not supported for the filter `company_industry`.",
        },
      },
    };

    vi.mocked(axios.post).mockRejectedValue(mockHttpError);

    await expect(findDecisionMakers(["test.com"])).rejects.toThrow(
      "Prospeo execution dropped: The value `Accountingg` is not supported for the filter `company_industry`.",
    );
  });

  it("should fallback to generic exception messages when raw system level drop occurs", async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error("Network Timeout"));

    await expect(findDecisionMakers(["test.com"])).rejects.toThrow(
      "Prospeo execution dropped: Network Timeout",
    );
  });
});
