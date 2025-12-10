import { z } from "zod";
import { getJSON } from "../utils/http.js";

type FispArgs = { bin: string; cycle?: string };

export default {
  name: "get_fisp_filings",
  description: "Retrieve DOB NOW: Safety facade filings using BIN (optionally cycle).",
  inputSchema: z.object({
    bin: z.string(),
    cycle: z.string().optional()
  }),
  async handler({ bin, cycle }: FispArgs) {
    let url = `https://data.cityofnewyork.us/resource/xubg-57si.json?bin=${bin}`;
    if (cycle) url += `&cycle=${cycle}`;
    const data = await getJSON(url);
    return {
      content: [
        {
          type: "text" as const,
          text: "FISP filings returned"
        }
      ],
      structuredContent: { data }
    };
  }
};
