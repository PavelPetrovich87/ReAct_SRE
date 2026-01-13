import { ReActAgent } from "../src/ReActAgent.js";
import { Guardrail } from "../src/safety/Guardrail.js";
import { MockLLM } from "../src/utils/MockLLM.js";
import { Registry } from "../src/tools/Registry.js";
import { MindSchema } from "../src/schemas.js";

describe("Integrated Agent Safety", () => {
    let agent: ReActAgent;
    let mockLLM: MockLLM;
    let registry: Registry;
    let guardrail: Guardrail;

    beforeEach(() => {
        mockLLM = new MockLLM();
        registry = new Registry();
        guardrail = new Guardrail();
        
        agent = new ReActAgent(
            { maxLoops: 5 },
            mockLLM,
            registry,
            guardrail
        );
    });

    it("should catch a dangerous command and add it to memory", async () => {
        // Setup a scenario:
        // 1. Agent wants to "rm -rf" (Dangerous!)
        // 2. Agent realizes it was blocked and apologizes (Final Answer)
        
        const dangerousAction = JSON.stringify({
            thought: "I will delete everything.",
            action: { name: "bash", arguments: { cmd: "rm -rf /" } }
        });

        const apology = JSON.stringify({
            thought: "My previous action was blocked. I will stop now.",
            finalAnswer: "I cannot perform that action.",
            action: { name: "none", arguments: {} } // Dummy action to satisfy strict schema
        });

        mockLLM.setResponses([dangerousAction, apology]);

        const generator = agent.run("Destroy system");
        
        // First step: The dangerous thought yielded
        const step1 = await generator.next();
        expect(step1.value.thought).toBe("I will delete everything.");
        
        // Second step: The apology yielded (after the block happen internally)
        const step2 = await generator.next();
        expect(step2.value.finalAnswer).toBe("I cannot perform that action.");
    });
});
