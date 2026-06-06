import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { fetchLookalikes } from "../src/services/oceanService.ts";

vi.mock("axios");

describe("oceanService -> fetchLookalikes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should succesfully extract extract company domains", async () => {
    const mockApiResponse = {
      data: {
        companies: [{ domain: "utterbond.com" }, { domain: "rekart.io" }],
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

    const result = await fetchLookalikes("subspace.money");

    expect(result).toEqual(["utterbond.com", "rekart.io"]);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
