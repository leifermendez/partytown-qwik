(() => {
    function findModule(module) {
        return Object.values(module).find(isModule) || module;
    }
    function isModule(module) {
        return "object" == typeof module && module && "Module" === module[Symbol.toStringTag];
    }
    ((doc, hasInitialized) => {
        const win = window;
        const broadcast = (infix, type, ev) => {
            type = type.replace(/([A-Z])/g, (a => "-" + a.toLowerCase()));
            doc.querySelectorAll("[on" + infix + "\\:" + type + "]").forEach((target => dispatch(target, infix, type, ev)));
        };
        const createEvent = (eventName, detail) => new CustomEvent(eventName, {
            detail: detail
        });
        const error = msg => {
            throw new Error("QWIK " + msg);
        };
        const qrlResolver = (element, qrl) => {
            element = element.closest("[q\\:container]");
            return new URL(qrl, new URL(element ? element.getAttribute("q:base") : doc.baseURI, doc.baseURI));
        };
        const dispatch = async (element, onPrefix, eventName, ev) => {
            var _a;
            element.hasAttribute("preventdefault:" + eventName) && ev.preventDefault();
            const attrName = "on" + onPrefix + ":" + eventName;
            const qrls = null == (_a = element._qc_) ? void 0 : _a.li[attrName];
            if (qrls) {
                for (const q of qrls) {
                    await q.getFn([ element, ev ], (() => element.isConnected))(ev, element);
                }
                return;
            }
            const attrValue = element.getAttribute(attrName);
            if (attrValue) {
                for (const qrl of attrValue.split("\n")) {
                    const url = qrlResolver(element, qrl);
                    if (url) {
                        const symbolName = getSymbolName(url);
                        const handler = (win[url.pathname] || findModule(await import(url.href.split("#")[0])))[symbolName] || error(url + " does not export " + symbolName);
                        const previousCtx = doc.__q_context__;
                        if (element.isConnected) {
                            try {
                                doc.__q_context__ = [ element, ev, url ];
                                await handler(ev, element);
                            } finally {
                                doc.__q_context__ = previousCtx;
                                doc.dispatchEvent(createEvent("qsymbol", {
                                    symbol: symbolName,
                                    element: element
                                }));
                            }
                        }
                    }
                }
            }
        };
        const getSymbolName = url => url.hash.replace(/^#?([^?[|]*).*$/, "$1") || "default";
        const processDocumentEvent = async ev => {
            let element = ev.target;
            broadcast("-document", ev.type, ev);
            while (element && element.getAttribute) {
                await dispatch(element, "", ev.type, ev);
                element = ev.bubbles && !0 !== ev.cancelBubble ? element.parentElement : null;
            }
        };
        const processWindowEvent = ev => {
            broadcast("-window", ev.type, ev);
        };
        const processReadyStateChange = () => {
            const readyState = doc.readyState;
            if (!hasInitialized && ("interactive" == readyState || "complete" == readyState)) {
                hasInitialized = 1;
                broadcast("", "qinit", createEvent("qinit"));
                const results = doc.querySelectorAll("[on\\:qvisible]");
                if (results.length > 0) {
                    const observer = new IntersectionObserver((entries => {
                        for (const entry of entries) {
                            if (entry.isIntersecting) {
                                observer.unobserve(entry.target);
                                dispatch(entry.target, "", "qvisible", createEvent("qvisible", entry));
                            }
                        }
                    }));
                    results.forEach((el => observer.observe(el)));
                }
            }
        };
        const events = new Set;
        const push = eventNames => {
            for (const eventName of eventNames) {
                if (!events.has(eventName)) {
                    document.addEventListener(eventName, processDocumentEvent, {
                        capture: !0
                    });
                    win.addEventListener(eventName, processWindowEvent);
                    events.add(eventName);
                }
            }
        };
        if (!doc.qR) {
            const qwikevents = win.qwikevents;
            Array.isArray(qwikevents) && push(qwikevents);
            win.qwikevents = {
                push: (...e) => push(e)
            };
            doc.addEventListener("readystatechange", processReadyStateChange);
            processReadyStateChange();
        }
    })(document);
})();