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
            company: { name: "Fight Club Inc", domain: "fc.com" },
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
        company: "Fight Club Inc",
        companyDomain: "fc.com",
      },
      {
        name: "Executive Target",
        title: "Leadership Matrix Target",
        linkedinUrl: "https://linkedin.com/in/anonymous-exec",
        company: undefined,
        companyDomain: undefined,
      },
    ]);

    expect(axios.post).toHaveBeenCalledTimes(1);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        filters: expect.objectContaining({
          person_seniority: {
            include: ["C-Suite", "Vice President"],
          },
        }),
      }),
      expect.objectContaining({
        headers: {
          "X-KEY": expect.any(String),
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("should deduplicate prospects by LinkedIn URL", async () => {
    const mockApiResponse = {
      data: {
        error: false,
        results: [
          {
            person: {
              full_name: "Tyler Durden",
              current_job_title: "CEO",
              linkedin_url: "https://linkedin.com/in/tyler-durden",
            },
          },
          {
            person: {
              full_name: "Tyler Durden Copy",
              current_job_title: "CEO",
              linkedin_url: "https://linkedin.com/in/tyler-durden",
            },
          },
        ],
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

    const result = await findDecisionMakers(["fc.com"]);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Tyler Durden");
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
