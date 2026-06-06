import dotenv from "dotenv";

dotenv.config();

const response = await fetch("https://api.ocean.io/v2/credits/balance", {
  method: "GET",
  headers: { "X-Api-Token": process.env.OCEANIO_API_TOKEN },
});

console.log(response);
