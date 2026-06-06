import axios from "axios";
import { config } from "../config/apiConfig.js";
import { MessageVersion, BrevoBatchResponse, Contact } from "../types/index.js";

export const sendBatchOutreach = async (
  contacts: Contact[],
  customSubject?: string,
  customHtmlBody?: string,
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
      subject:
        customSubject ||
        `Software Engineering Opportunities - ${contact.company}`,
    };
  });

  const baseHtmlContent =
    customHtmlBody ||
    `
     <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 600px; margin: 0 auto;">
      <p>Hey {{params.firstName}},</p>
      <p>I was recently tracking engineering and product scaling footprints over at <strong>{{params.company}}</strong>, and I wanted to reach out directly.</p>
      <p>I am a self-driven B.Tech CSE student heavily focused on core backend architecture, distributed systems patterns, and cloud infrastructure operations. I spend my time building high-throughput infrastructure components (like custom CLI system logging utilities written in Rust and scalable microservice architectures using Java + Spring Boot).</p>
      <p>Given your focus on product stability and system scaling execution speeds, I believe my technical focus and absolute dedication to system efficiency would make me an excellent fit for your engineering team as a Software Engineer Intern.</p>
      <p>Are you open to a brief 5-minute chat sometime next week? I'd love to share some of the backend automation systems I've built and see how I can help ship high-quality code for your team.</p>
      <p>Best regards,<br><strong>Saiyed Shizain</strong><br>Computer Science & Systems Engineering Student<br>GitHub: github.com/RanXom</p>
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
