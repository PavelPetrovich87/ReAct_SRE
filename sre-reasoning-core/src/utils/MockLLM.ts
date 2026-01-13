import type { LLMAdapter } from "../types.js";

export class MockLLM implements LLMAdapter {
    private responses: string[];

    constructor(responses: string[] = []) {
        this.responses = responses;
    }

    setResponses(responses: string[]) {
        this.responses = responses;
    }

    async generate(prompt: string, history: any[]): Promise<string> {
        const response = this.responses.shift();
        if (!response) {
            throw new Error("MockLLM: No more responses configured for this test sequence.");
        }
        return response;
    }
}
