/**
 * 👤 USER IMPLEMENTATION: Safety Layer (Goal: qs_testing + arch_resiliency)
 *
 * The Guardrail is the "Police Officer" of the agent.
 * It strictly forbids dangerous patterns *before* any tool is executed.
 */
export class Guardrail {
    private forbiddenPatterns: string[] = [
        // GUIDELINE 1: Define your "Blacklist" here.
        // Examples of what to block:
        "rm -rf", //(Recursive delete)
        "DROP TABLE", //(Database destruction)
        "System.exit", //(Killing the process)
        ":(){ :|:& };: " //(Fork bomb)
    ];

    /**
     * Checks if the tool call is safe to proceed.
     * @param toolName - The name of the tool (e.g., "bash_executor")
     * @param args - The arguments passed to the tool (e.g., { cmd: "rm -rf /" })
     * @returns boolean - True if safe, False if dangerous.
     * @throws Error - If a specific violation is found (optional, but better for debugging).
     */
    validate(toolName: string, args: any): boolean {
        // GUIDELINE 2: Serialize the arguments.
        const inputString = JSON.stringify(args);

        // GUIDELINE 3: Loop through the blacklist.
        for (const pattern of this.forbiddenPatterns) {
            // GUIDELINE 4: Check for matches.
            if (inputString.includes(pattern)) {
                console.error(`[Guardrail] Violation detected: Found "${pattern}" in arguments for ${toolName}.`);
                return false;
            }
        }
        
        return true;
    }
}
