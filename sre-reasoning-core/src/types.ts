import type { ZodSchema } from "zod";

export interface AgentConfig {
    maxLoops: number;
    systemPrompt?: string;
}

export interface Tool {
    name: string;
    description: string;
    schema: ZodSchema;
    execute: (args: any) => Promise<any>;
}

export interface LLMAdapter {
    generate(prompt: string, history: any[]): Promise<string>;
}

export class ToolExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ToolExecutionError";
    }
}
