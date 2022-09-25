import { test } from "uvu";
import * as assert from "uvu/assert";
import { QwikPartytown } from "../src";

test("Snippet Script", () => {
  const currentSnippet = QwikPartytown();
  assert.type(currentSnippet, "function");
});

test.run();
