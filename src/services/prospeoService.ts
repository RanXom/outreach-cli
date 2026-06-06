import axios from "axios";
import { config } from "../config/apiConfig.js";

export const findDecisionMakers = async (domains: string[]): Promise<any> => {
  try {
    const response = await axios.post(
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
          "X-Api-Token": config.prospeo.token,
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
    throw new Error(
      `Ocean.io execution dropped: ${error.response?.data?.detail || error.message}`,
    );
  }
};
