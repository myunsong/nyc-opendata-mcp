import { z } from "zod";
import { getJSON } from "../utils/http.js";
export default {
    name: "get_dob_violations",
    description: "Retrieve DOB violations via BIN.",
    inputSchema: z.object({
        bin: z.string()
    }),
    async handler({ bin }) {
        const url = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?bin=${bin}`;
        const data = await getJSON(url);
        return {
            content: [
                {
                    type: "text",
                    text: "DOB violations returned"
                }
            ],
            structuredContent: { data }
        };
    }
};
