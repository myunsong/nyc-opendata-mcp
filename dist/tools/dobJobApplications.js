import { z } from "zod";
import { getJSON } from "../utils/http.js";
export default {
    name: "get_dob_job_applications",
    description: "Retrieve DOB job application filings using BIN.",
    inputSchema: z.object({
        bin: z.string()
    }),
    async handler({ bin }) {
        const url = `https://data.cityofnewyork.us/resource/ic3t-wcy2.json?bin__=${bin}`;
        const data = await getJSON(url);
        return {
            content: [
                {
                    type: "text",
                    text: "DOB job application filings returned"
                }
            ],
            structuredContent: { data }
        };
    }
};
