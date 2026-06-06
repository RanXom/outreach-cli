import dotenv from "dotenv";
import { config } from "./config/apiConfig.js";

dotenv.config();

const response = await fetch(`${config.ocean.baseUrl}/v2/credits/balance`, {
  method: "GET",
  headers: { "X-Api-Token": process.env.OCEANIO_API_TOKEN! },
});

const data = await response.json();

console.log(data);
