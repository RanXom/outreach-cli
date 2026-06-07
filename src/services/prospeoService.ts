import axios from "axios";
import { config } from "../config/apiConfig.js";
import { ProspeoSearchResponse, DiscoveredProspect } from "../types/index.js";

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
          person_seniority: {
            include: ["C-Level", "VP"],
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

      if (!linkedinUrl) return [];

      const normalizedUrl = linkedinUrl.toLowerCase();
      if (seen.has(normalizedUrl)) return [];
      seen.add(normalizedUrl);

      return [{
        name: p.full_name || "Executive Target",
        title: p.current_job_title || "Leadership Matrix Target",
        linkedinUrl,
        company: item.company?.name,
        companyDomain: item.company?.domain,
      }];
    });
  } catch (error: any) {
    const apiDetail =
      error.response?.data?.filter_error || error.response?.data?.error_code;

    throw new Error(`Prospeo execution dropped: ${apiDetail || error.message}`);
  }
};
