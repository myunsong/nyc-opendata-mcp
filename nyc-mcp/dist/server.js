import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import resolveAddress from "./tools/resolveAddress.js";
import pluto from "./tools/pluto.js";
import dobJobs from "./tools/dobJobApplications.js";
import dobViolations from "./tools/dobViolations.js";
import fisp from "./tools/fisp.js";
import landmarks from "./tools/landmarks.js";
import footprints from "./tools/footprints.js";
const mcpServer = new McpServer({ name: "nyc-mcp", version: "1.0.0" });
const tools = [
    resolveAddress,
    pluto,
    dobJobs,
    dobViolations,
    fisp,
    landmarks,
    footprints
];
for (const tool of tools) {
    mcpServer.registerTool(tool.name, {
        description: tool.description,
        inputSchema: tool.inputSchema
    }, async (args) => tool.handler(args));
}
async function main() {
    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });
    await mcpServer.connect(transport);
    const app = createMcpExpressApp();
    const handler = async (req, res) => {
        try {
            // Lightweight debug log to see incoming requests when troubleshooting
            if (process.env.MCP_DEBUG) {
                console.log("Incoming MCP request", {
                    method: req.method,
                    headers: req.headers,
                    body: req.body,
                    transportInitialized: transport._initialized,
                    sessionIdGenerator: transport.sessionIdGenerator
                });
            }
            await transport.handleRequest(req, res, req.body);
        }
        catch (err) {
            console.error("Error handling MCP request", err);
            if (!res.headersSent) {
                res.status(500).send("Internal server error");
            }
        }
    };
    app.post("/mcp", handler);
    app.get("/mcp", handler);
    app.delete("/mcp", handler);
    app.listen(port, () => {
        console.log(`NYC MCP server running over Streamable HTTP on port ${port}`);
    });
}
main().catch(err => {
    console.error("Failed to start MCP server", err);
    process.exit(1);
});
