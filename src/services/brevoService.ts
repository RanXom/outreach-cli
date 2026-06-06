import axios from "axios";
import { config } from "../config/apiConfig.js";
import { application, json } from "express";

export interface Contact {
  name: string;
  title: string;
  company: string;
  email: string;
}

export interface MessageVersion {
  to: Array<{ name: string; email: string }>;
  params: {
    firstName: string;
    company: string;
  };
  subject: string;
}

export interface BrevoBatchResponse {
  messageIds: string[];
}

export const sendBatchOutreach = async (
  contacts: Contact[],
): Promise<string[]> => {
  if (!contacts || contacts.length === 0) return [];

  const messageVersions: MessageVersion[] = contacts.map((contact) => {
    const firstName = contact.name.split(" ")[0] || "there";
    return {
      to: [{ email: contact.email, name: contact.name }],
      params: {
        firstName: firstName,
        company: contact.company,
      },
      subject: `Optimizing engineering overhead visibility at ${contact.company}`, // TODO: replace this with and by taking personalized subject as function param
    };
  });

  // TODO: replace this with personalized email from user input (passed in as function param)
  const baseHtmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 600px; margin: 0 auto;">
      <p>Hey {{params.firstName}},</p>
      <p>Saw your work leading scaling execution choices over at <strong>{{params.company}}</strong>.</p>
      <p>As engineering stacks expand, tracking seat bleed and phantom SaaS subscription overhead falls behind active sprint priorities instantly. We built a background automation layer at SubSpace that maps tech-stack overhead dynamically to eliminate unused seat costs with zero manual workflow disruption.</p>
      <p>Are you open to a quick 5-minute deep-dive sync next Tuesday at 2 PM IST to audit your core visibility blocks?</p>
      <p>Best,<br><strong>Saiyed Shizain</strong><br>Backend & Systems Engineering | SubSpace</p>
    </body>
    </html>
  `;

  try {
    const response = await axios.post<BrevoBatchResponse>(
      `${config.brevo.baseUrl}/smtp/email`,
      {
        sender: { name: "Shizain", email: config.brevo.senderEmail },
        htmlContent: baseHtmlContent,
        messageVersions: messageVersions,
      },
      {
        headers: {
          "api-key": config.brevo.apiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      },
    );

    return response.data?.messageIds || [];
  } catch (error: any) {
    throw new Error(
      `Brevo Batch SMTP relay rejected transmission: ${
        error.response?.data?.message || error.message
      }`,
    );
  }
};
