import "dotenv/config"; // Load .env file
import { ReActAgent } from "../src/ReActAgent.js";
import { Guardrail } from "../src/safety/Guardrail.js";
import { Registry } from "../src/tools/Registry.js";
import { OpenRouterLLM } from "../src/utils/OpenRouterLLM.js";
import { SimulatedBashTool } from "../src/tools/SimulatedBash.js";

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "xiaomi/mimo-v2-flash:free";

const SYSTEM_PROMPT = `You are a Senior SRE Agent.
Your Goal: Solve the incident described by the user.
You follow the ReAct pattern: Thought, Action, Observation.

IMPORTANT: You MUST output structured JSON matching this schema:
{
  "thought": "your reasoning",
  "action": { "name": "tool_name", "arguments": { ... } },
  "finalAnswer": "optional final answer"
}
  "finalAnswer": "optional final answer"
}
`;

async function main() {
    if (!API_KEY) {
        console.error("❌ Please set OPENROUTER_API_KEY in .env file.");
        process.exit(1);
    }

    console.log("🚀 Initializing SRE Agent with OpenRouter...");
    console.log(`🤖 Model: ${MODEL}`);

    // 1. Setup Components
    const llm = new OpenRouterLLM(API_KEY, MODEL, SYSTEM_PROMPT);
    const registry = new Registry();
    registry.register(SimulatedBashTool);
    const guardrail = new Guardrail();

    // 2. Create Agent
    const agent = new ReActAgent(
        { maxLoops: 10, systemPrompt: SYSTEM_PROMPT },
        llm,
        registry,
        guardrail
    );

    // 3. Run Incident
    const incident = "ALERT: Disk usage is at 100% on /dev/sda1. Fix it immediately.";
    console.log(`\n🚨 Incident: ${incident}\n`);

    try {
        const generator = agent.run(incident);
        
        for await (const step of generator) {
            console.log(`\n🧠 Thought: ${step.thought}`);
            if (step.finalAnswer) {
                console.log(`\n✅ Final Answer: ${step.finalAnswer}`);
                break;
            }
            if (step.action) {
                console.log(`🛠️ Action: ${step.action.name} -> ${JSON.stringify(step.action.arguments)}`);
            }
        }
        
    } catch (error) {
        console.error("\n💥 Agent Crashed:", error);
    }
}

main().catch(error => {
    console.error("FATAL: Top-level script error:", error);
    process.exit(1);
});
