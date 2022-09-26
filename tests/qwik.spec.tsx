import { ElementFixture } from "@builder.io/qwik/testing";
import { suite } from "uvu";
import { match, snapshot } from "uvu/assert";
import { format } from "prettier";
import { render } from "@builder.io/qwik";
import { QwikPartytown } from "../src/index";

const qComponent = suite("q-component");

qComponent(
  "should declare and render basic component with script party town",
  async () => {
    const fixture = new ElementFixture().host;
    await render(fixture, <QwikPartytown />);
    await expectRegex(
      fixture,
      `querySelectorAll\('script\[type="text\/partytown"\]'`
    );
  }
);

export async function expectDOM(actual: Element, expected: string) {
  const options = {
    parser: "html",
    htmlWhitespaceSensitivity: "ignore" as const,
  };
  snapshot(format(actual.outerHTML, options), format(expected, options));
}

export async function expectRegex(actual: Element, expected: string) {
  const options = {
    parser: "html",
    htmlWhitespaceSensitivity: "ignore" as const,
  };
  match(format(actual.outerHTML, options), expected);
}

qComponent.run();
