import { z } from "zod";
import { getJSON } from "../utils/http.js";

type ResolveAddressArgs = { text: string };

export default {
  name: "resolve_address",
  description: "Resolve an address to possible matches with BBL/BIN.",
  inputSchema: z.object({
    text: z.string()
  }),
  async handler({ text }: ResolveAddressArgs) {
    const url = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(text)}`;
    const data: any = await getJSON(url);

    const features = Array.isArray(data?.features)
      ? data.features.map((f: any) => ({
          label: f.properties?.label,
          borough: f.properties?.borough,
          zipcode: f.properties?.postalcode,
          coordinates: f.geometry?.coordinates,
          bbl: f.properties?.addendum?.pad?.bbl || null,
          bin: f.properties?.addendum?.pad?.bin || null,
          raw: f
        }))
      : [];

    const summary = `GeoSearch results for ${text} (count=${features.length})`;
    return {
      content: [
        {
          type: "text" as const,
          text: summary
        }
      ],
      structuredContent: { query: text, count: features.length, features }
    };
  }
};
