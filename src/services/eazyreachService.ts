import axios from "axios";
import { config } from "../config/apiConfig.js";
import { AuthTokenResponse, LinkedinEmailsResponse } from "../types/index.js";

const fetchToken = async (): Promise<string> => {
  try {
    const response = await axios.post<AuthTokenResponse>(
      `${config.eazyreach.baseUrl}/b2b/createAuthToken/`,
      {
        clientId: config.eazyreach.clientId,
        clientSecret: config.eazyreach.clientSecret,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data?.status !== "success" || !response.data?.auth_token) {
      throw new Error(
        "Superflow gateway rejected client credential verification properties",
      );
    }

    return response.data.auth_token;
  } catch (error: any) {
    throw new Error(
      `Superflow Token Generation Failed: ${error.response?.data?.message || error.message}`,
    );
  }
};

export const fetchEmails = async (
  linkedinUrl: string,
): Promise<string | null> => {
  if (!linkedinUrl) return null;

  try {
    const authToken = await fetchToken();

    const response = await axios.post<LinkedinEmailsResponse>(
      `${config.eazyreach.baseUrl}/b2b/linkedin-emails`,
      { linkedinUrl: linkedinUrl },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (response.data?.status !== "success") return null;

    const emailRecords = response.data?.emails || [];

    const bestMatch =
      emailRecords.find((e) => e.verification === "verified") ||
      emailRecords[0];

    return bestMatch?.email || null;
  } catch (error: any) {
    console.error(
      `[Eazyreach Step Drop] Failed resolving target route for ${linkedinUrl}: ${error.message}`,
    );
    return null;
  }
};
