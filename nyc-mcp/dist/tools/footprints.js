import { z } from "zod";
import { getJSON } from "../utils/http.js";
export default {
    name: "get_building_footprint",
    description: "Retrieve building footprint geometry via BIN.",
    inputSchema: z.object({
        bin: z.string()
    }),
    async handler({ bin }) {
        const url = `https://data.cityofnewyork.us/resource/5zhs-2jue.json?bin=${bin}`;
        const data = await getJSON(url);
        return {
            content: [
                {
                    type: "text",
                    text: "Building footprint returned"
                }
            ],
            structuredContent: { data }
        };
    }
};
