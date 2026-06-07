import axios from "axios";
import { config } from "../config/apiConfig.js";
import { DiscoveredProspect } from "../types/index.js";

interface EnrichPersonResponse {
  error: boolean;
  error_code?: string;
  free_enrichment?: boolean;
  person?: {
    email?: {
      status: string;
      revealed: boolean;
      email: string;
      verification_method?: string;
    };
  };
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const enrichEmails = async (
  prospects: DiscoveredProspect[],
): Promise<Map<string, string>> => {
  if (!prospects || prospects.length === 0) return new Map();

  const emailMap = new Map<string, string>();

  for (let i = 0; i < prospects.length; i++) {
    const prospect = prospects[i]!;
    if (!prospect.linkedinUrl) continue;

    // Respect 1 req/sec rate limit — skip delay on first request
    if (i > 0) await delay(1100);

    try {
      const response = await axios.post<EnrichPersonResponse>(
        `${config.prospeo.baseUrl}/enrich-person`,
        {
          only_verified_email: true,
          data: {
            linkedin_url: prospect.linkedinUrl,
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
        console.error(
          `   [skip] ${prospect.name}: ${response.data.error_code || "no match"}`,
        );
        continue;
      }

      const email = response.data?.person?.email;

      if (email?.revealed && email?.email) {
        emailMap.set(prospect.linkedinUrl, email.email);
      }
    } catch (error: any) {
      console.error(
        `   [skip] ${prospect.name}: ${error.response?.data?.error_code || error.message}`,
      );
    }
  }

  return emailMap;
};
