import axios from "axios";
import { config } from "../config/apiConfig.js";
import { ProspeoSearchResponse, DiscoveredProspect } from "../types/index.js";

const ALLOWED_TITLE_KEYWORDS = [
  // Technology
  "cto",
  "chief technology",
  "technology",
  "engineering",
  "software",
  "backend",
  "platform",
  "infrastructure",
  "devops",
  "technical",
  "architect",
  "developer",

  // Product
  "cpo",
  "chief product",
  "head of product",
  "vp product",
  "director of product",
  "product manager",

  "founder",
  "co-founder",
  "owner",

  // HR / Recruiting
  "hr",
  "human resources",
  "recruit",
  "recruiting",
  "talent",
  "talent acquisition",
  "people operations",
  "people ops",
];

const isRelevantTitle = (title: string): boolean => {
  const normalized = title.toLowerCase();

  return ALLOWED_TITLE_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const findDecisionMakers = async (
  domains: string[],
): Promise<DiscoveredProspect[]> => {
  if (!domains || domains.length === 0) return [];

  try {
    const response = await axios.post<ProspeoSearchResponse>(
      `${config.prospeo.baseUrl}/search-person`,
      {
        page: 1,
        filters: {
          company: {
            websites: {
              include: domains,
            },
          },
          person_department: {
            include: [
              "Engineering & Technical",
              "Information Technology",
              "Human Resources",
              "C-Suite",
              "Product",
            ],
          },
          person_seniority: {
            include: [
              "Founder/Owner",
              "C-Suite",
              "Head",
              "Director",
              "Manager",
            ],
          },
        },
      },
      {
        headers: {
          "X-KEY": config.prospeo.token,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data?.error) {
      console.error("Prospeo search flag returned true error validation state");
      return [];
    }

    const searchResults = response.data?.results || [];

    const seen = new Set<string>();

    return searchResults.flatMap((item) => {
      const p = item.person;
      const linkedinUrl = p.linkedin_url || "";
      const title = p?.current_job_title || "";

      if (!linkedinUrl) return [];
      if (!isRelevantTitle(title)) {
        console.log(`[FILTERED] ${title}`);
        return [];
      }

      const normalizedUrl = linkedinUrl.toLowerCase();
      if (seen.has(normalizedUrl)) return [];
      seen.add(normalizedUrl);

      return [
        {
          name: p.full_name || "Executive Target",
          title: p.current_job_title || "Leadership Matrix Target",
          linkedinUrl,
          company: item.company?.name,
          companyDomain: item.company?.domain,
        },
      ];
    });
  } catch (error: any) {
    const apiDetail =
      error.response?.data?.filter_error || error.response?.data?.error_code;

    if (apiDetail === "NO_RESULTS") {
      return [];
    }

    throw new Error(`Prospeo execution dropped: ${apiDetail || error.message}`);
  }
};
