import { z } from "zod";
import { getJSON } from "../utils/http.js";

type PlutoArgs = { borough: string; block: string; lot: string };

export default {
  name: "get_pluto",
  description: "Retrieve PLUTO data via borough, block, and lot.",
  inputSchema: z.object({
    borough: z.string(),
    block: z.string(),
    lot: z.string()
  }),
  async handler({ borough, block, lot }: PlutoArgs) {
    const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?borough=${borough}&block=${block}&lot=${lot}`;
    const json: any = await getJSON(url);
    const record = (Array.isArray(json) ? json[0] : json) || {};

    return {
      content: [
        {
          type: "text" as const,
          text: "PLUTO record retrieved"
        }
      ],
      structuredContent: record
    };
  }
};
