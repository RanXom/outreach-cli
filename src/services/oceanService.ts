import axios from "axios";
import { config } from "../config/apiConfig.js";

export const fetchLookalikes = async (
  seedDomain: string,
): Promise<string[]> => {
  try {
    const response = await axios.post(
      `${config.ocean.baseUrl}/v3/search/companies`,
      {
        companiesFilters: {
          lookalikeDomains: [seedDomain],
        },
        size: 10,
      },
      {
        headers: {
          "X-Api-Token": config.ocean.token,
          "Content-Type": "application/json",
        },
      },
    );

    const companies = response.data?.companies || [];

    return companies
      .map((company) => company.domain)
      .filter((domain) => domain !== undefined);
  } catch (error: any) {
    throw new Error(
      `Ocean.io execution dropped: ${error.response?.data?.detail || error.message}`,
    );
  }
};
