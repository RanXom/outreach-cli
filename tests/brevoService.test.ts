import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendBatchOutreach } from "../src/services/brevoService.ts";

vi.mock("axios");

describe("brevoService -> sendBatchOutreach", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully compile multiple contact frames into a single unified batch payload request", async () => {
    const mockApiResponse = {
      data: {
        messageIds: ["msg_id_hash_1@smtp", "msg_id_hash_2@smtp"],
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

    const targets = [
      {
        name: "Tyler Durden",
        title: "CEO",
        company: "fc.com",
        email: "tyler@fc.com",
      },
      {
        name: "Marla Singer",
        title: "VP",
        company: "paper.io",
        email: "marla@paper.io",
      },
    ];

    const result = await sendBatchOutreach(targets);

    expect(result).toEqual(["msg_id_hash_1@smtp", "msg_id_hash_2@smtp"]);
    expect(axios.post).toHaveBeenCalledTimes(1);

    expect(axios.post).toHaveBeenLastCalledWith(
      expect.stringContaining("/smtp/email"),
      expect.objectContaining({
        subject: expect.any(String),
        htmlContent: expect.any(String),
        messageVersions: expect.arrayContaining([
          expect.objectContaining({
            to: [{ email: "tyler@fc.com", name: "Tyler Durden" }],
          }),
        ]),
      }),
      expect.any(Object),
    );
  });

  it("should include a top-level subject in the request body", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { messageIds: ["id@smtp"] },
    });

    await sendBatchOutreach([
      { name: "X", title: "Y", company: "Z", email: "x@z.com" },
    ]);

    const payload = vi.mocked(axios.post).mock.calls[0]![1] as any;
    expect(payload.subject).toBeDefined();
    expect(typeof payload.subject).toBe("string");
  });

  it("should chunk contacts into batches of 1000", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { messageIds: ["id@smtp"] },
    });

    const contacts = Array.from({ length: 1500 }, (_, i) => ({
      name: `Person ${i}`,
      title: "VP",
      company: `company${i}.com`,
      email: `p${i}@company${i}.com`,
    }));

    await sendBatchOutreach(contacts);

    // 1500 contacts = 2 chunks (1000 + 500)
    expect(axios.post).toHaveBeenCalledTimes(2);

    const firstPayload = vi.mocked(axios.post).mock.calls[0]![1] as any;
    const secondPayload = vi.mocked(axios.post).mock.calls[1]![1] as any;

    expect(firstPayload.messageVersions).toHaveLength(1000);
    expect(secondPayload.messageVersions).toHaveLength(500);
  });

  it("should bubble up raw validation drop metrics if remote relays reject payload properties", async () => {
    vi.mocked(axios.post).mockRejectedValue({
      response: {
        data: { message: "Unauthorized Sender Domain Configuration" },
      },
    });

    await expect(
      sendBatchOutreach([
        {
          name: "X",
          title: "Y",
          company: "Z",
          email: "x@z.com",
        },
      ]),
    ).rejects.toThrow(
      "Brevo Batch SMTP relay rejected transmission: Unauthorized Sender Domain Configuration",
    );
  });
});
