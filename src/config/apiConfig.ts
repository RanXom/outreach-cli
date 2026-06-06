import dotenv from "dotenv";
dotenv.config();

export const config = {
  ocean: {
    token: process.env.OCEANIO_API_TOKEN || "",
    baseUrl: "https://api.ocean.io",
  },
  prospeo: {
    token: process.env.PROSPEO_API_TOKEN || "",
    baseUrl: "https://api.prospeo.io",
  },
  eazyreach: {
    clientId: process.env.EAZYREACH_CLIENT_ID || "",
    clientSecret: process.env.EAZYREACH_CLIENT_SECRET || "",
    baseUrl: "https://api.superflow.run",
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || "",
    baseUrl: "https://api.brevo.com/v3",
    senderEmail: "contact@shizain.me",
  },
};
