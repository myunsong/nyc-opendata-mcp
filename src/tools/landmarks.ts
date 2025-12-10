import { z } from "zod";
import { getJSON } from "../utils/http.js";

type LandmarkArgs = { bin: string };

export default {
  name: "get_landmark_status",
  description: "Retrieve Landmark and Historic District building info via BIN.",
  inputSchema: z.object({
    bin: z.string()
  }),
  async handler({ bin }: LandmarkArgs) {
    const url = `https://data.cityofnewyork.us/resource/gpmc-yuvp.json?bin=${bin}`;
    const data = await getJSON(url);
    return {
      content: [
        {
          type: "text" as const,
          text: "Landmark status returned"
        }
      ],
      structuredContent: { data }
    };
  }
};
