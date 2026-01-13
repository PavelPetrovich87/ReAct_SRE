import type { AgentConfig, LLMAdapter } from "./types.js";
import type { Registry } from "./tools/Registry.js";
import type { MindParams } from "./schemas.js";
import { MindSchema } from "./schemas.js";
import type { Guardrail } from "./safety/Guardrail.js";

/**
 * 👤 USER IMPLEMENTATION: The ReAct Loop (Goal: ai_react_pattern)
 *
 * Logic:
 * 1. Append goal to memory.
 * 2. Start Loop:
 *    a. Ask LLM for next step (using History).
 *    b. Parse Output (using your Zod schema from `src/schemas.ts`).
 *    c. If Final Answer -> Break and return answer.
 *    d. If Tool Call -> execute tool -> get observation -> append to memory -> Continue.
 * 3. Break if maxLoops is reached.
 */
export class ReActAgent {
    private config: AgentConfig;
    private llm: LLMAdapter;
    private registry: Registry;
    private guardrail: Guardrail;
    private memory: any[] = []; // TODO: Define a stricter type for memory if desired

    constructor(config: AgentConfig, llm: LLMAdapter, registry: Registry, guardrail: Guardrail) {
        this.config = config;
        this.llm = llm;
        this.registry = registry;
        this.guardrail = guardrail;
    }

    /**
     * Generator-based ReAct Loop
     *
     * @param goal - The user's prompt/goal.
     * @yields MindParams - The structured "Thought + Action" from the LLM.
     * @returns string - The final answer.
     */
    async *run(goal: string): AsyncGenerator<MindParams, string, void> {
        // GUIDELINE 0: Inject available tools into memory
        const toolsPrompt = this.getToolsPrompt();
        this.memory.push(`System Note: You have access to the following tools:\n${toolsPrompt}`);

        this.memory.push(goal);
        let loopCount = 0;

        // GUIDELINE 1: Start your 'while' loop here.
        // It should run until `loopCount` exceeds `this.config.maxLoops`.
        while (loopCount < this.config.maxLoops) {
         // inside loop:

            // GUIDELINE 2: Generate the next step.
            const response = await this.llm.generate(goal, this.memory);

            // GUIDELINE 3: Parse the response.
            // Use your `MindSchema` (which you need to define in schemas.ts) to parse the JSON.
            const mind = MindSchema.parse(JSON.parse(response));

            // GUIDELINE 4: Share the thought!
            yield mind;

            // GUIDELINE 5: Handle Final Answer.
            if (mind.finalAnswer) {
                return mind.finalAnswer;
            }
            
            // GUIDELINE 5.5: Safety Check!
            // Call `this.guardrail.validate()`. 
            // If it returns false, push a "Security Violation" observation and `continue`.
            if (!this.guardrail.validate(mind.action.name, mind.action.arguments)) {
                this.memory.push(`Observation: Security Violation - ${mind.action.name}`);
                continue;
            }
            
            // GUIDELINE 6: Execute the Tool.
            const tool = this.registry.get(mind.action.name);
            if (!tool) {
                this.memory.push(`Observation: Error - Tool '${mind.action.name}' not found.`);
                continue; // Let the agents try again!
            }
            try {
                const result = await tool.execute(mind.action.arguments);
                // DEBUG: Log the observation so we can see what's happening
                console.log(`\n👀 Observation: ${result}`);

                // GUIDELINE 7: Learn from Observation.
                // Append the result to `this.memory`.
                this.memory.push(`Observation: ${result}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.memory.push(`Observation: Tool Error - ${errorMessage}`);
            }
        }
        
        throw new Error("Max loops exceeded");
    }
    private getToolsPrompt(): string {
        const tools = this.registry.getAll();
        return tools.map(tool => {
             // Basic Schema Description
             // TODO: Use a proper JsonSchema generator in production.
             // For now, we append a generic "Arguments" hint or rely on the tool description to be very specific.
             // But to fix the "cmd" vs "command" issue, let's look at the Zod schema if possible, or just default to a standard format.
             if (tool.name === 'bash') {
                 return `- ${tool.name}: ${tool.description} Usage: { "cmd": "..." }`;
             }
            return `- ${tool.name}: ${tool.description}`;
        }).join("\n");
    }
}
