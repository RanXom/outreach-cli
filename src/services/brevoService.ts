import axios from "axios";
import { config } from "../config/apiConfig.js";
import { MessageVersion, BrevoBatchResponse, Contact } from "../types/index.js";

const BREVO_BATCH_LIMIT = 1000;

export const sendBatchOutreach = async (
  contacts: Contact[],
  customSubject?: string,
  customHtmlBody?: string,
): Promise<string[]> => {
  if (!contacts || contacts.length === 0) return [];

  const allMessageIds: string[] = [];

  for (let i = 0; i < contacts.length; i += BREVO_BATCH_LIMIT) {
    const chunk = contacts.slice(i, i + BREVO_BATCH_LIMIT);
    const ids = await sendChunk(chunk, customSubject, customHtmlBody);
    allMessageIds.push(...ids);
  }

  return allMessageIds;
};

const sendChunk = async (
  contacts: Contact[],
  customSubject?: string,
  customHtmlBody?: string,
): Promise<string[]> => {
  const defaultSubject = "Software Engineering Opportunities";

  const messageVersions: MessageVersion[] = contacts.map((contact) => {
    const firstName = contact.name.split(" ")[0] || "there";
    return {
      to: [{ email: contact.email, name: contact.name }],
      params: {
        firstName: firstName,
        company: contact.company,
      },
      subject: customSubject || `Software Engineering Internship Inquiry`,
    };
  });

  const baseHtmlContent =
    customHtmlBody ||
    `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 600px; margin: 0 auto;">

      <p>Hi {{params.firstName}},</p>

      <p>
        My name is Saiyed Shizain, and I'm a Computer Science student with a strong interest in backend engineering, systems programming, and cloud infrastructure.
      </p>

      <p>
        Recently, I've been building projects including an enterprise Identity & Access Management platform using Java, Spring Boot, Redis, and PostgreSQL, as well as a minimal x86 operating system kernel in Rust.
      </p>

      <p>
        I came across <strong>{{params.company}}</strong> while researching companies building developer-focused products and infrastructure, and I wanted to reach out.
      </p>

      <p>
        I'm currently looking for Software Engineering internship opportunities where I can contribute, learn from experienced engineers, and continue growing as a backend developer.
      </p>

      <p>
        If there are any internship opportunities available, I'd be grateful for the chance to share my work and learn more about your team.
      </p>

      <p>
        Portfolio: <a href="https://shizain.me">shizain.me</a><br>
        GitHub: <a href="https://github.com/ranxom">github.com/ranxom</a>
      </p>

      <p>
        Best regards,<br>
        <strong>Saiyed Shizain</strong>
      </p>

    </body>
    </html>
  `;

  try {
    const response = await axios.post<BrevoBatchResponse>(
      `${config.brevo.baseUrl}/smtp/email`,
      {
        sender: {
          name: config.brevo.senderName,
          email: config.brevo.senderEmail,
        },
        subject: customSubject || defaultSubject,
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
