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
  });
});
