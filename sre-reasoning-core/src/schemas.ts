import { z } from "zod";

/**
 * 👤 USER IMPLEMENTATION: Structured Outputs (Goal: ai_structured_outputs)
 *
 * Challenge: Create a schema that validates a "Thought" (reasoning) followed by an "Action" (tool call).
 *
 * Requirements:
 * 1. `thought`: A string where the agent explains its reasoning.
 * 2. `action`: An object containing:
 *    - `name`: The name of the tool to use.
 *    - `arguments`: The arguments to pass to the tool.
 * 3. `finalAnswer`: A string (optional). If present, the loop should stop.
 *
 * HINT: Use `z.object`, `z.string`, `z.optional`, or `z.union`.
 */

export const MindSchema = z.object({
    thought: z.string(),
    action: z.object({
        name: z.string(),
        arguments: z.any()
    }),
    finalAnswer: z.string().optional()
});

export type MindParams = z.infer<typeof MindSchema>;
