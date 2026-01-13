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
        
        // Simulate "rm" or "truncate" (The Fix) - CHECK THIS FIRST!
        // If the agent chains `rm && df`, we want the deletion to happen first.
        if ((cmd.includes("rm") || cmd.includes("truncate") || cmd.includes(">")) && cmd.includes("error.log")) {
            isDiskFull = false;
             // If they also asked for df, we can't easily return both in this simple sim, 
             // but returning the success message usually prompts them to check df next.
            return "Action successful. File 'error.log' cleared/removed.";
        }

        // Simulate "df" - Check state
        if (cmd.includes("df")) {
            if (isDiskFull) {
                return `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   50G    0G 100% /`;
            } else {
                return `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G    2G   48G   4% /`;
            }
        }
        
        if (cmd.includes("rm") && (cmd.includes("/") || cmd.includes("*"))) {
             return "Permission denied: You cannot delete root or wildcard in simulation.";
        }

        return `Command '${cmd}' executed successfully (simulated output).`;
    }
};
