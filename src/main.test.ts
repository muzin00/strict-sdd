import { Model } from "@typespec/compiler";
import { expect, test } from "vitest";
import { createStrictSddTestRunner } from "./index.js";

test("Greeting model can be extended", async () => {
  const runner = await createStrictSddTestRunner();
  const { Hi } = (await runner.compile(`
    @test model Hi extends Greeting {}
  `)) as { Hi: Model };

  expect(Hi.kind).toBe("Model");
  expect(Hi.baseModel?.name).toBe("Greeting");
});
