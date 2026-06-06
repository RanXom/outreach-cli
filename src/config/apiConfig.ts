import dotenv from "dotenv";
dotenv.config();

export const config = {
  ocean: {
    token: process.env.OCEANIO_API_TOKEN,
    baseUrl: "https://api.ocean.io",
  },
};
