import { z } from "zod";
import { getJSON } from "../utils/http.js";
export default {
    name: "get_fisp_filings",
    description: "Retrieve DOB NOW: Safety facade filings using BIN (optionally cycle).",
    inputSchema: z.object({
        bin: z.string(),
        cycle: z.string().optional()
    }),
    async handler({ bin, cycle }) {
        let url = `https://data.cityofnewyork.us/resource/xubg-57si.json?bin=${bin}`;
        if (cycle)
            url += `&cycle=${cycle}`;
        const data = await getJSON(url);
        return {
            content: [
                {
                    type: "text",
                    text: "FISP filings returned"
                }
            ],
            structuredContent: { data }
        };
    }
};
