import { z } from "zod";
import { getJSON } from "../utils/http.js";
export default {
    name: "get_pluto",
    description: "Retrieve PLUTO data via borough, block, and lot.",
    inputSchema: z.object({
        borough: z.string(),
        block: z.string(),
        lot: z.string()
    }),
    async handler({ borough, block, lot }) {
        const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?borough=${borough}&block=${block}&lot=${lot}`;
        const json = await getJSON(url);
        const record = (Array.isArray(json) ? json[0] : json) || {};
        return {
            content: [
                {
                    type: "text",
                    text: "PLUTO record retrieved"
                }
            ],
            structuredContent: record
        };
    }
};
