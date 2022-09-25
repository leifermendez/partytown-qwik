import { test } from "uvu";
import * as assert from "uvu/assert";
import { QwikPartytown } from "../src";
test("Snippet Script", () => {
    const currentSnippet = QwikPartytown();
    assert.is(currentSnippet, 2);
});
test.run();
