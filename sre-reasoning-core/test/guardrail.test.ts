import { Guardrail } from "../src/safety/Guardrail.js";

describe("Guardrail", () => {
    let guardrail: Guardrail;

    beforeEach(() => {
        guardrail = new Guardrail();
    });

    it("should allow safe commands", () => {
        const result = guardrail.validate("bash", { cmd: "ls -la" });
        expect(result).toBe(true);
    });

    it("should block 'rm -rf'", () => {
        const result = guardrail.validate("bash", { cmd: "rm -rf /" });
        expect(result).toBe(false);
    });

    it("should block 'DROP TABLE'", () => {
        const result = guardrail.validate("sql_executor", { query: "DROP TABLE users;" });
        expect(result).toBe(false);
    });

    it("should block 'System.exit'", () => {
        const result = guardrail.validate("eval", { code: "System.exit(0)" });
        expect(result).toBe(false);
    });
});
