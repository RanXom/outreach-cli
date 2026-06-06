import axios from "axios";
import { config } from "../config/apiConfig.js";

interface ProspeoSearchResponse {
  error: boolean;
  free?: boolean;
  results?: Array<{
    person: {
      person_id: string;
      full_name: string | null;
      current_job_title: string | null;
      linkedin_url: string | null;
    };
    company?: {
      name: string;
      domain: string;
    };
  }>;
}

export interface DiscoveredProspect {
  name: string;
  title: string;
  linkedinUrl: string;
}

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
            include: ["C-Suite", "Vice President"],
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

    return searchResults
      .map((item) => {
        const p = item.person;
        return {
          name: p.full_name || "Executive Target",
          title: p.current_job_title || "Leadership Matrix Target",
          linkedinUrl: p.linkedin_url || "",
        };
      })
      .filter((prospect) => prospect.linkedinUrl !== "");
  } catch (error: any) {
    const apiDetail =
      error.response?.data?.filter_error || error.response?.data?.error_code;

    throw new Error(`Prospeo execution dropped: ${apiDetail || error.message}`);
  }
};
