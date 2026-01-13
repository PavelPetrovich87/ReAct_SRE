import type { Tool } from "../types.js";
import { z } from "zod";

// Simple in-memory state for the simulation
let isDiskFull = true;

export const SimulatedBashTool: Tool = {
    name: "bash",
    description: "Execute bash commands safely in a simulated environment. Supported commands: df, rm, ls, cat.",
    schema: z.object({
        cmd: z.string().describe("The bash command to execute (e.g., 'df -h', 'ls -la')")
    }),
    execute: async ({ cmd }: { cmd: string }) => {
        console.log(`[SimulatedBash] Executing: ${cmd}`);
        
        const subCommands = cmd.split("&&").map(c => c.trim());
        const results: string[] = [];

        for (const subCmd of subCommands) {
            // Simulate "rm" or "truncate" (The Fix)
            if ((subCmd.includes("rm") || subCmd.includes("truncate") || subCmd.includes(">")) && subCmd.includes("error.log")) {
                isDiskFull = false;
                results.push("Action successful. File 'error.log' cleared/removed.");
                continue;
            }

            // Simulate "df"
            if (subCmd.includes("df")) {
                if (isDiskFull) {
                    results.push(`Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   50G    0G 100% /`);
                } else {
                    results.push(`Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G    2G   48G   4% /`);
                }
                continue;
            }

            // Simulate "ls"
            if (subCmd.includes("ls")) {
                results.push(isDiskFull ? `error.log\napp.js\nnode_modules` : `app.js\nnode_modules`);
                continue;
            }

            // Simulate "du"
            if (subCmd.includes("du")) {
                results.push(isDiskFull
                    ? `48G     ./error.log\n100M    ./node_modules\n50K     ./app.js`
                    : `100M    ./node_modules\n50K     ./app.js`);
                continue;
            }

            // Default success for unknown simple commands (like sleep, echo)
            if (!subCmd.includes("rm") && !subCmd.includes("df") && !subCmd.includes("du") && !subCmd.includes("ls")) {
                results.push(`Command '${subCmd}' executed successfully (simulated output).`);
            }
        }

        return results.join("\n\n");
    }
};
