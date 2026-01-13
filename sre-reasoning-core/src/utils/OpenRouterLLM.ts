import type { LLMAdapter } from "../types.js";

export class OpenRouterLLM implements LLMAdapter {
    private apiKey: string;
    private model: string;
    private systemPrompt: string;

    constructor(apiKey: string, model: string = "xiaomi/mimo-v2-flash:free", systemPrompt: string = "You are a helpful SRE assistant.") {
        this.apiKey = apiKey;
        this.model = model;
        this.systemPrompt = systemPrompt;
    }

    async generate(prompt: string, history: any[]): Promise<string> {
        // Construct the messages array
        const messages = [
            { role: "system", content: this.systemPrompt },
            ...history.map(item => {
                if (typeof item === 'string' && item.startsWith("Observation:")) {
                    return { role: "user", content: item }; // Observations are "user" inputs to the LLM
                }
                return { role: "user", content: JSON.stringify(item) }; // Previous thoughts/actions
            }),
            { role: "user", content: prompt }
        ];

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://sre-reasoning-core.local", // Optional
                    "X-Title": "SRE Reasoning Core" // Optional
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    response_format: { type: "json_object" } // Force JSON if supported, otherwise rely on prompt
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API Error: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.choices || data.choices.length === 0) {
                throw new Error("OpenRouter returned no choices.");
            }

            return data.choices[0].message.content;

        } catch (error) {
            console.error("LLM Generation Failed:", error);
            throw error;
        }
    }
}
