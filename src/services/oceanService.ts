import axios from "axios";
import { config } from "../config/apiConfig.js";

interface OceanCompany {
  domain: string;
}

export const fetchLookalikes = async (
  seedDomain: string,
): Promise<string[]> => {
  try {
    const response = await axios.post(
      `${config.ocean.baseUrl}/v3/search/companies`,
      {
        size: 10,
        companiesFilters: {
          lookalikeDomains: [seedDomain],
        },
      },
      {
        headers: {
          "X-Api-Token": config.ocean.token,
          "Content-Type": "application/json",
        },
      },
    );

    const companies: OceanCompany[] = response.data?.companies || [];

    return companies
      .map(sanitizeDomain)
      .filter((domain): domain is string => domain !== undefined);
  } catch (error: any) {
    throw new Error(
      `Ocean.io execution dropped: ${error.response?.data?.detail || error.message}`,
    );
  }
};

export const sanitizeDomain = (company: OceanCompany): string | undefined => {
  if (!company.domain) return undefined;

  try {
    const urlString = company.domain.includes("://")
      ? company.domain
      : `https://${company.domain}`;

    const parsedUrl = new URL(urlString);

    return parsedUrl.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};
