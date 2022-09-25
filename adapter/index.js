import { jsx as _jsx } from "@builder.io/qwik/jsx-runtime";
import { partytownSnippet, } from "@builder.io/partytown/integration";
/**
 * @public
 * You can pass setting with props
 */
export const QwikPartytown = (props) => {
    if (typeof document !== "undefined" && !document._partytown) {
        if (!document.querySelector("script[data-partytown]")) {
            const scriptElm = document.createElement("script");
            scriptElm.dataset.partytown = "";
            scriptElm.innerHTML = partytownSnippet(props);
            document.head.appendChild(scriptElm);
        }
        // should only append this script once per document, and is not dynamic
        document._partytown = true;
    }
    const innerHTML = partytownSnippet(props);
    return _jsx("script", { children: innerHTML });
};
