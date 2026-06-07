import axios from "axios";
import { config } from "../config/apiConfig.js";
import { OceanCompany } from "../types/index.js";

export const fetchLookalikes = async (
  seedDomain: string,
): Promise<OceanCompany[]> => {
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

    const normalizedSeed = seedDomain.toLowerCase().replace(/^www\./, "");

    const seen = new Set<string>();

    return companies.flatMap((company) => {
      const domain = sanitizeDomain(company);
      if (!domain) return [];

      if (domain.toLowerCase() === normalizedSeed) return [];

      if (seen.has(domain.toLowerCase())) return [];
      seen.add(domain.toLowerCase());

      return [{ domain, name: company.name }];
    });
  } catch (error: any) {
    throw new Error(
      `Ocean.io execution dropped: ${error.response?.data?.detail || error.message}`,
    );
  }
};

export const sanitizeDomain = (company: OceanCompany): string | undefined => {
  if (!company.domain) return undefined;

  if (!company.domain.includes(".")) return undefined;

  try {
    const urlString = company.domain.includes("://")
      ? company.domain
      : `https://${company.domain}`;

    const parsedUrl = new URL(urlString);

    if (!parsedUrl.hostname.includes(".")) return undefined;

    return parsedUrl.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};
