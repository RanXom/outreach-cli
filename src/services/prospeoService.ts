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

const scoreTitle = (title: string): number => {
  const t = title.toLowerCase();

  if (t.includes("cto")) return 100;
  if (t.includes("cpto")) return 95;

  if (t.includes("founder")) return 90;
  if (t.includes("co-founder")) return 90;

  if (t.includes("ceo")) return 85;
  if (t.includes("cpo")) return 85;

  if (t.includes("head of engineering")) return 80;
  if (t.includes("director of engineering")) return 75;

  if (t.includes("engineering manager")) return 70;
  if (t.includes("lead software engineer")) return 65;

  if (t.includes("developer relations")) return 60;
  if (t.includes("developer advocacy")) return 55;

  if (t.includes("hr")) return 50;
  if (t.includes("talent")) return 50;

  if (t.includes("product manager")) return 40;

  return 10;
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

    const prospects: DiscoveredProspect[] = searchResults.flatMap((item) => {
      const p = item.person;
      const linkedinUrl = p.linkedin_url || "";
      const title = p.current_job_title || "";

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
          title,
          linkedinUrl,
          company: item.company?.name,
          companyDomain: item.company?.domain,
        },
      ];
    });

    const grouped = new Map<string, DiscoveredProspect[]>();

    for (const prospect of prospects) {
      const company = prospect.companyDomain || prospect.company || "unknown";

      if (!grouped.has(company)) {
        grouped.set(company, []);
      }

      grouped.get(company)!.push(prospect);
    }

    const finalProspects: DiscoveredProspect[] = [];

    for (const [, companyProspects] of grouped) {
      companyProspects.sort(
        (a, b) => scoreTitle(b.title) - scoreTitle(a.title),
      );

      finalProspects.push(...companyProspects.slice(0, 2));
    }

    return finalProspects;

    // return searchResults.flatMap((item) => {
    //   const p = item.person;
    //   const linkedinUrl = p.linkedin_url || "";
    //   const title = p?.current_job_title || "";
    //
    //   if (!linkedinUrl) return [];
    //   if (!isRelevantTitle(title)) {
    //     console.log(`[FILTERED] ${title}`);
    //     return [];
    //   }
    //
    //   const normalizedUrl = linkedinUrl.toLowerCase();
    //   if (seen.has(normalizedUrl)) return [];
    //   seen.add(normalizedUrl);
    //
    //   return [
    //     {
    //       name: p.full_name || "Executive Target",
    //       title: p.current_job_title || "Leadership Matrix Target",
    //       linkedinUrl,
    //       company: item.company?.name,
    //       companyDomain: item.company?.domain,
    //     },
    //   ];
    // });
  } catch (error: any) {
    const apiDetail =
      error.response?.data?.filter_error || error.response?.data?.error_code;

    if (apiDetail === "NO_RESULTS") {
      return [];
    }

    throw new Error(`Prospeo execution dropped: ${apiDetail || error.message}`);
  }
};
