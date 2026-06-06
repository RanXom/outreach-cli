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
