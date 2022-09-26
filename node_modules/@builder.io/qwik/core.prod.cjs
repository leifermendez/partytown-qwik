/**
 * @license
 * @builder.io/qwik 0.9.0
 * Copyright Builder.io, Inc. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
!function(global, factory) {
    "object" == typeof exports && "undefined" != typeof module ? factory(exports) : "function" == typeof define && define.amd ? define([ "exports" ], factory) : factory((global = "undefined" != typeof globalThis ? globalThis : global || self).qwikCore = {});
}(this, (function(exports) {
    "use strict";
    if ("undefined" == typeof globalThis) {
        const g = "undefined" != typeof global ? global : "undefined" != typeof window ? window : "undefined" != typeof self ? self : {};
        g.globalThis = g;
    }
    const EMPTY_ARRAY = [];
    const EMPTY_OBJ = {};
    const isSerializableObject = v => {
        const proto = Object.getPrototypeOf(v);
        return proto === Object.prototype || null === proto;
    };
    const isObject = v => v && "object" == typeof v;
    const isArray = v => Array.isArray(v);
    const isString = v => "string" == typeof v;
    const isFunction = v => "function" == typeof v;
    const QSlot = "q:slot";
    const isPromise = value => value instanceof Promise;
    const safeCall = (call, thenFn, rejectFn) => {
        try {
            const promise = call();
            return isPromise(promise) ? promise.then(thenFn, rejectFn) : thenFn(promise);
        } catch (e) {
            return rejectFn(e);
        }
    };
    const then = (promise, thenFn) => isPromise(promise) ? promise.then(thenFn) : thenFn(promise);
    const promiseAll = promises => promises.some(isPromise) ? Promise.all(promises) : promises;
    const isNotNullable = v => null != v;
    const delay = timeout => new Promise((resolve => {
        setTimeout(resolve, timeout);
    }));
    let _context;
    const tryGetInvokeContext = () => {
        if (!_context) {
            const context = "undefined" != typeof document && document && document.__q_context__;
            if (!context) {
                return;
            }
            return isArray(context) ? document.__q_context__ = newInvokeContextFromTuple(context) : context;
        }
        return _context;
    };
    const getInvokeContext = () => {
        const ctx = tryGetInvokeContext();
        if (!ctx) {
            throw qError(QError_useMethodOutsideContext);
        }
        return ctx;
    };
    const useInvokeContext = () => {
        const ctx = getInvokeContext();
        if ("qRender" !== ctx.$event$) {
            throw qError(QError_useInvokeContext);
        }
        return ctx.$hostElement$, ctx.$waitOn$, ctx.$renderCtx$, ctx.$subscriber$, ctx;
    };
    const useBindInvokeContext = callback => {
        if (null == callback) {
            return callback;
        }
        const ctx = getInvokeContext();
        return (...args) => invoke(ctx, callback.bind(void 0, ...args));
    };
    const invoke = (context, fn, ...args) => {
        const previousContext = _context;
        let returnValue;
        try {
            _context = context, returnValue = fn.apply(null, args);
        } finally {
            _context = previousContext;
        }
        return returnValue;
    };
    const waitAndRun = (ctx, callback) => {
        const waitOn = ctx.$waitOn$;
        if (0 === waitOn.length) {
            const result = callback();
            isPromise(result) && waitOn.push(result);
        } else {
            waitOn.push(Promise.all(waitOn).then(callback));
        }
    };
    const newInvokeContextFromTuple = context => {
        const element = context[0];
        return newInvokeContext(void 0, element, context[1], context[2]);
    };
    const newInvokeContext = (hostElement, element, event, url) => ({
        $seq$: 0,
        $hostElement$: hostElement,
        $element$: element,
        $event$: event,
        $url$: url,
        $qrl$: void 0,
        $props$: void 0,
        $renderCtx$: void 0,
        $subscriber$: void 0,
        $waitOn$: void 0
    });
    const getWrappingContainer = el => el.closest("[q\\:container]");
    const isNode = value => value && "number" == typeof value.nodeType;
    const isDocument = value => value && 9 === value.nodeType;
    const isElement = value => 1 === value.nodeType;
    const isQwikElement = value => isNode(value) && (1 === value.nodeType || 111 === value.nodeType);
    const isVirtualElement = value => 111 === value.nodeType;
    const isModule = module => isObject(module) && "Module" === module[Symbol.toStringTag];
    let _platform = (() => {
        const moduleCache = new Map;
        return {
            isServer: false,
            importSymbol(containerEl, url, symbolName) {
                const urlDoc = ((doc, containerEl, url) => {
                    const baseURI = doc.baseURI;
                    const base = new URL(containerEl.getAttribute("q:base") ?? baseURI, baseURI);
                    return new URL(url, base);
                })(containerEl.ownerDocument, containerEl, url).toString();
                const urlCopy = new URL(urlDoc);
                urlCopy.hash = "", urlCopy.search = "";
                const importURL = urlCopy.href;
                const mod = moduleCache.get(importURL);
                return mod ? mod[symbolName] : import(importURL).then((mod => (mod = (module => Object.values(module).find(isModule) || module)(mod), 
                moduleCache.set(importURL, mod), mod[symbolName])));
            },
            raf: fn => new Promise((resolve => {
                requestAnimationFrame((() => {
                    resolve(fn());
                }));
            })),
            nextTick: fn => new Promise((resolve => {
                setTimeout((() => {
                    resolve(fn());
                }));
            })),
            chunkForSymbol() {}
        };
    })();
    const getPlatform = () => _platform;
    const isServer = () => _platform.isServer;
    const implicit$FirstArg = fn => function(first, ...rest) {
        return fn.call(null, $(first), ...rest);
    };
    const directSetAttribute = (el, prop, value) => el.setAttribute(prop, value);
    const directGetAttribute = (el, prop) => el.getAttribute(prop);
    const ON_PROP_REGEX = /^(on|window:|document:)/;
    const isOnProp = prop => prop.endsWith("$") && ON_PROP_REGEX.test(prop);
    const addQRLListener = (listenersMap, prop, input) => {
        let existingListeners = listenersMap[prop];
        existingListeners || (listenersMap[prop] = existingListeners = []);
        for (const qrl of input) {
            const hash = qrl.$hash$;
            let replaced = false;
            for (let i = 0; i < existingListeners.length; i++) {
                if (existingListeners[i].$hash$ === hash) {
                    existingListeners.splice(i, 1, qrl), replaced = true;
                    break;
                }
            }
            replaced || existingListeners.push(qrl);
        }
        return false;
    };
    const setEvent = (listenerMap, prop, input) => {
        prop.endsWith("$");
        const qrls = isArray(input) ? input.map(ensureQrl) : [ ensureQrl(input) ];
        return prop = normalizeOnProp(prop.slice(0, -1)), addQRLListener(listenerMap, prop, qrls), 
        prop;
    };
    const ensureQrl = value => isQrl(value) ? value : $(value);
    const getDomListeners = (ctx, containerEl) => {
        const attributes = ctx.$element$.attributes;
        const listeners = {};
        for (let i = 0; i < attributes.length; i++) {
            const {name: name, value: value} = attributes.item(i);
            if (name.startsWith("on:") || name.startsWith("on-window:") || name.startsWith("on-document:")) {
                let array = listeners[name];
                array || (listeners[name] = array = []);
                const urls = value.split("\n");
                for (const url of urls) {
                    const qrl = parseQRL(url, containerEl);
                    qrl.$capture$ && inflateQrl(qrl, ctx), array.push(qrl);
                }
            }
        }
        return listeners;
    };
    const useSequentialScope = () => {
        const ctx = useInvokeContext();
        const i = ctx.$seq$;
        const hostElement = ctx.$hostElement$;
        const elCtx = getContext(hostElement);
        const seq = elCtx.$seq$ ? elCtx.$seq$ : elCtx.$seq$ = [];
        return ctx.$seq$++, {
            get: seq[i],
            set: value => seq[i] = value,
            i: i,
            ctx: ctx
        };
    };
    const useCleanupQrl = unmountFn => {
        const {get: get, set: set, i: i, ctx: ctx} = useSequentialScope();
        if (!get) {
            const el = ctx.$hostElement$;
            const watch = new Watch(WatchFlagsIsCleanup, i, el, unmountFn, void 0);
            const elCtx = getContext(el);
            set(true), elCtx.$watches$ || (elCtx.$watches$ = []), elCtx.$watches$.push(watch);
        }
    };
    const useCleanup$ = implicit$FirstArg(useCleanupQrl);
    const useOn = (event, eventQrl) => _useOn(`on-${event}`, eventQrl);
    const _useOn = (eventName, eventQrl) => {
        const invokeCtx = useInvokeContext();
        const ctx = getContext(invokeCtx.$hostElement$);
        addQRLListener(ctx.li, normalizeOnProp(eventName), [ eventQrl ]);
    };
    const getDocument = node => "undefined" != typeof document ? document : 9 === node.nodeType ? node : node.ownerDocument;
    const jsx = (type, props, key) => {
        const processed = null == key ? null : String(key);
        return new JSXNodeImpl(type, props, processed);
    };
    class JSXNodeImpl {
        constructor(type, props, key = null) {
            this.type = type, this.props = props, this.key = key;
        }
    }
    const isJSXNode = n => n instanceof JSXNodeImpl;
    const Fragment = props => props.children;
    const SkipRender = Symbol("skip render");
    const RenderOnce = (props, key) => jsx(Virtual, {
        ...props,
        qonce: ""
    }, key);
    const SSRComment = () => null;
    const Virtual = props => props.children;
    const InternalSSRStream = () => null;
    const fromCamelToKebabCase = text => text.replace(/([A-Z])/g, "-$1").toLowerCase();
    const setAttribute = (ctx, el, prop, value) => {
        ctx ? ctx.$operations$.push({
            $operation$: _setAttribute,
            $args$: [ el, prop, value ]
        }) : _setAttribute(el, prop, value);
    };
    const _setAttribute = (el, prop, value) => {
        if (null == value || false === value) {
            el.removeAttribute(prop);
        } else {
            const str = true === value ? "" : String(value);
            directSetAttribute(el, prop, str);
        }
    };
    const setProperty = (ctx, node, key, value) => {
        ctx ? ctx.$operations$.push({
            $operation$: _setProperty,
            $args$: [ node, key, value ]
        }) : _setProperty(node, key, value);
    };
    const _setProperty = (node, key, value) => {
        try {
            node[key] = value;
        } catch (err) {
            logError(codeToText(QError_setProperty), {
                node: node,
                key: key,
                value: value
            }, err);
        }
    };
    const createElement = (doc, expectTag, isSvg) => isSvg ? doc.createElementNS(SVG_NS, expectTag) : doc.createElement(expectTag);
    const insertBefore = (ctx, parent, newChild, refChild) => (ctx.$operations$.push({
        $operation$: directInsertBefore,
        $args$: [ parent, newChild, refChild || null ]
    }), newChild);
    const appendChild = (ctx, parent, newChild) => (ctx.$operations$.push({
        $operation$: directAppendChild,
        $args$: [ parent, newChild ]
    }), newChild);
    const appendHeadStyle = (ctx, styleTask) => {
        ctx.$containerState$.$styleIds$.add(styleTask.styleId), ctx.$postOperations$.push({
            $operation$: _appendHeadStyle,
            $args$: [ ctx.$containerState$.$containerEl$, styleTask ]
        });
    };
    const _setClasslist = (elm, toRemove, toAdd) => {
        const classList = elm.classList;
        classList.remove(...toRemove), classList.add(...toAdd);
    };
    const _appendHeadStyle = (containerEl, styleTask) => {
        const doc = getDocument(containerEl);
        const isDoc = doc.documentElement === containerEl;
        const headEl = doc.head;
        const style = doc.createElement("style");
        isDoc && !headEl && logWarn("document.head is undefined"), directSetAttribute(style, "q:style", styleTask.styleId), 
        style.textContent = styleTask.content, isDoc && headEl ? directAppendChild(headEl, style) : directInsertBefore(containerEl, style, containerEl.firstChild);
    };
    const removeNode = (ctx, el) => {
        ctx.$operations$.push({
            $operation$: _removeNode,
            $args$: [ el, ctx ]
        });
    };
    const _removeNode = (el, staticCtx) => {
        const parent = el.parentElement;
        if (parent) {
            if (1 === el.nodeType || 111 === el.nodeType) {
                const subsManager = staticCtx.$containerState$.$subsManager$;
                cleanupTree(el, staticCtx, subsManager, true);
            }
            directRemoveChild(parent, el);
        }
    };
    const createTemplate = (doc, slotName) => {
        const template = createElement(doc, "q:template", false);
        return directSetAttribute(template, QSlot, slotName), directSetAttribute(template, "hidden", ""), 
        directSetAttribute(template, "aria-hidden", "true"), template;
    };
    const executeDOMRender = ctx => {
        for (const op of ctx.$operations$) {
            op.$operation$.apply(void 0, op.$args$);
        }
        resolveSlotProjection(ctx);
    };
    const getKey = el => directGetAttribute(el, "q:key");
    const setKey = (el, key) => {
        null !== key && directSetAttribute(el, "q:key", key);
    };
    const resolveSlotProjection = ctx => {
        const subsManager = ctx.$containerState$.$subsManager$;
        ctx.$rmSlots$.forEach((slotEl => {
            const key = getKey(slotEl);
            const slotChildren = getChildren(slotEl, "root");
            if (slotChildren.length > 0) {
                const sref = slotEl.getAttribute("q:sref");
                const hostCtx = ctx.$roots$.find((r => r.$id$ === sref));
                if (hostCtx) {
                    const template = createTemplate(ctx.$doc$, key);
                    const hostElm = hostCtx.$element$;
                    for (const child of slotChildren) {
                        directAppendChild(template, child);
                    }
                    directInsertBefore(hostElm, template, hostElm.firstChild);
                } else {
                    cleanupTree(slotEl, ctx, subsManager, false);
                }
            }
        })), ctx.$addSlots$.forEach((([slotEl, hostElm]) => {
            const key = getKey(slotEl);
            const template = Array.from(hostElm.childNodes).find((node => isSlotTemplate(node) && node.getAttribute(QSlot) === key));
            template && (getChildren(template, "root").forEach((child => {
                directAppendChild(slotEl, child);
            })), template.remove());
        }));
    };
    class VirtualElementImpl {
        constructor(open, close) {
            this.open = open, this.close = close, this._qc_ = null, this.nodeType = 111, this.localName = ":virtual", 
            this.nodeName = ":virtual";
            const doc = this.ownerDocument = open.ownerDocument;
            this.template = createElement(doc, "template", false), this.attributes = (str => {
                if (!str) {
                    return new Map;
                }
                const attributes = str.split(" ");
                return new Map(attributes.map((attr => {
                    const index = attr.indexOf("=");
                    return index >= 0 ? [ attr.slice(0, index), (s = attr.slice(index + 1), s.replace(/\+/g, " ")) ] : [ attr, "" ];
                    var s;
                })));
            })(open.data.slice(3)), open.data.startsWith("qv "), open.__virtual = this;
        }
        insertBefore(node, ref) {
            const parent = this.parentElement;
            if (parent) {
                const ref2 = ref || this.close;
                parent.insertBefore(node, ref2);
            } else {
                this.template.insertBefore(node, ref);
            }
            return node;
        }
        remove() {
            const parent = this.parentElement;
            if (parent) {
                const ch = Array.from(this.childNodes);
                this.template.childElementCount, parent.removeChild(this.open), this.template.append(...ch), 
                parent.removeChild(this.close);
            }
        }
        appendChild(node) {
            return this.insertBefore(node, null);
        }
        insertBeforeTo(newParent, child) {
            const ch = Array.from(this.childNodes);
            newParent.insertBefore(this.open, child);
            for (const c of ch) {
                newParent.insertBefore(c, child);
            }
            newParent.insertBefore(this.close, child), this.template.childElementCount;
        }
        appendTo(newParent) {
            this.insertBeforeTo(newParent, null);
        }
        removeChild(child) {
            this.parentElement ? this.parentElement.removeChild(child) : this.template.removeChild(child);
        }
        getAttribute(prop) {
            return this.attributes.get(prop) ?? null;
        }
        hasAttribute(prop) {
            return this.attributes.has(prop);
        }
        setAttribute(prop, value) {
            this.attributes.set(prop, value), this.open.data = updateComment(this.attributes);
        }
        removeAttribute(prop) {
            this.attributes.delete(prop), this.open.data = updateComment(this.attributes);
        }
        matches(_) {
            return false;
        }
        compareDocumentPosition(other) {
            return this.open.compareDocumentPosition(other);
        }
        closest(query) {
            const parent = this.parentElement;
            return parent ? parent.closest(query) : null;
        }
        querySelectorAll(query) {
            const result = [];
            return getChildren(this, "elements").forEach((el => {
                isQwikElement(el) && (el.matches(query) && result.push(el), result.concat(Array.from(el.querySelectorAll(query))));
            })), result;
        }
        querySelector(query) {
            for (const el of this.childNodes) {
                if (isElement(el)) {
                    if (el.matches(query)) {
                        return el;
                    }
                    const v = el.querySelector(query);
                    if (null !== v) {
                        return v;
                    }
                }
            }
            return null;
        }
        get firstChild() {
            if (this.parentElement) {
                const first = this.open.nextSibling;
                return first === this.close ? null : first;
            }
            return this.template.firstChild;
        }
        get nextSibling() {
            return this.close.nextSibling;
        }
        get previousSibling() {
            return this.open.previousSibling;
        }
        get childNodes() {
            if (!this.parentElement) {
                return this.template.childNodes;
            }
            const nodes = [];
            let node = this.open;
            for (;(node = node.nextSibling) && node !== this.close; ) {
                nodes.push(node);
            }
            return nodes;
        }
        get isConnected() {
            return this.open.isConnected;
        }
        get parentElement() {
            return this.open.parentElement;
        }
    }
    const updateComment = attributes => `qv ${(map => {
        const attributes = [];
        return map.forEach(((value, key) => {
            var s;
            value ? attributes.push(`${key}=${s = value, s.replace(/ /g, "+")}`) : attributes.push(`${key}`);
        })), attributes.join(" ");
    })(attributes)}`;
    const processVirtualNodes = node => {
        if (null == node) {
            return null;
        }
        if (isComment(node)) {
            const virtual = getVirtualElement(node);
            if (virtual) {
                return virtual;
            }
        }
        return node;
    };
    const getVirtualElement = open => {
        const virtual = open.__virtual;
        if (virtual) {
            return virtual;
        }
        if (open.data.startsWith("qv ")) {
            const close = findClose(open);
            return new VirtualElementImpl(open, close);
        }
        return null;
    };
    const findClose = open => {
        let node = open.nextSibling;
        let stack = 1;
        for (;node; ) {
            if (isComment(node)) {
                if (node.data.startsWith("qv ")) {
                    stack++;
                } else if ("/qv" === node.data && (stack--, 0 === stack)) {
                    return node;
                }
            }
            node = node.nextSibling;
        }
        throw new Error("close not found");
    };
    const isComment = node => 8 === node.nodeType;
    const getRootNode = node => null == node ? null : isVirtualElement(node) ? node.open : node;
    const createContext$1 = name => Object.freeze({
        id: fromCamelToKebabCase(name)
    });
    const useContextProvider = (context, newValue) => {
        const {get: get, set: set, ctx: ctx} = useSequentialScope();
        if (void 0 !== get) {
            return;
        }
        const hostElement = ctx.$hostElement$;
        const hostCtx = getContext(hostElement);
        let contexts = hostCtx.$contexts$;
        contexts || (hostCtx.$contexts$ = contexts = new Map), contexts.set(context.id, newValue), 
        set(true);
    };
    const resolveContext = (context, hostElement, rctx) => {
        const contextID = context.id;
        if (rctx) {
            const contexts = rctx.$localStack$;
            for (let i = contexts.length - 1; i >= 0; i--) {
                const ctx = contexts[i];
                if (hostElement = ctx.$element$, ctx.$contexts$) {
                    const found = ctx.$contexts$.get(contextID);
                    if (found) {
                        return found;
                    }
                }
            }
        }
        if (hostElement.closest) {
            const value = queryContextFromDom(hostElement, contextID);
            if (void 0 !== value) {
                return value;
            }
        }
    };
    const queryContextFromDom = (hostElement, contextId) => {
        let element = hostElement;
        for (;element; ) {
            let node = element;
            let virtual;
            for (;node && (virtual = findVirtual(node)); ) {
                const contexts = tryGetContext(virtual)?.$contexts$;
                if (contexts && contexts.has(contextId)) {
                    return contexts.get(contextId);
                }
                node = virtual;
            }
            element = element.parentElement;
        }
    };
    const findVirtual = el => {
        let node = el;
        let stack = 1;
        for (;node = node.previousSibling; ) {
            if (isComment(node)) {
                if ("/qv" === node.data) {
                    stack++;
                } else if (node.data.startsWith("qv ") && (stack--, 0 === stack)) {
                    return getVirtualElement(node);
                }
            }
        }
        return null;
    };
    const ERROR_CONTEXT = createContext$1("qk-error");
    const handleError = (err, hostElement, rctx) => {
        if (isServer()) {
            throw err;
        }
        {
            const errorStore = resolveContext(ERROR_CONTEXT, hostElement, rctx);
            if (void 0 === errorStore) {
                throw err;
            }
            errorStore.error = err;
        }
    };
    const executeComponent = (rctx, elCtx) => {
        elCtx.$dirty$ = false, elCtx.$mounted$ = true, elCtx.$slots$ = [];
        const hostElement = elCtx.$element$;
        const onRenderQRL = elCtx.$renderQrl$;
        const props = elCtx.$props$;
        const newCtx = pushRenderContext(rctx, elCtx);
        const invocatinContext = newInvokeContext(hostElement, void 0, "qRender");
        const waitOn = invocatinContext.$waitOn$ = [];
        newCtx.$cmpCtx$ = elCtx, invocatinContext.$subscriber$ = hostElement, invocatinContext.$renderCtx$ = rctx, 
        onRenderQRL.$setContainer$(rctx.$static$.$containerState$.$containerEl$);
        const onRenderFn = onRenderQRL.getFn(invocatinContext);
        return safeCall((() => onRenderFn(props)), (jsxNode => (elCtx.$attachedListeners$ = false, 
        waitOn.length > 0 ? Promise.all(waitOn).then((() => elCtx.$dirty$ ? executeComponent(rctx, elCtx) : {
            node: jsxNode,
            rctx: newCtx
        })) : elCtx.$dirty$ ? executeComponent(rctx, elCtx) : {
            node: jsxNode,
            rctx: newCtx
        })), (err => (handleError(err, hostElement, rctx), {
            node: SkipRender,
            rctx: newCtx
        })));
    };
    const createRenderContext = (doc, containerState) => ({
        $static$: {
            $doc$: doc,
            $containerState$: containerState,
            $hostElements$: new Set,
            $operations$: [],
            $postOperations$: [],
            $roots$: [],
            $addSlots$: [],
            $rmSlots$: []
        },
        $cmpCtx$: void 0,
        $localStack$: []
    });
    const pushRenderContext = (ctx, elCtx) => ({
        $static$: ctx.$static$,
        $cmpCtx$: ctx.$cmpCtx$,
        $localStack$: ctx.$localStack$.concat(elCtx)
    });
    const serializeClass = obj => {
        if (isString(obj)) {
            return obj;
        }
        if (isObject(obj)) {
            if (isArray(obj)) {
                return obj.join(" ");
            }
            {
                let buffer = "";
                let previous = false;
                for (const key of Object.keys(obj)) {
                    obj[key] && (previous && (buffer += " "), buffer += key, previous = true);
                }
                return buffer;
            }
        }
        return "";
    };
    const parseClassListRegex = /\s/;
    const parseClassList = value => value ? value.split(parseClassListRegex) : EMPTY_ARRAY;
    const stringifyStyle = obj => {
        if (null == obj) {
            return "";
        }
        if ("object" == typeof obj) {
            if (isArray(obj)) {
                throw qError(QError_stringifyClassOrStyle, obj, "style");
            }
            {
                const chunks = [];
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const value = obj[key];
                        value && chunks.push(fromCamelToKebabCase(key) + ":" + value);
                    }
                }
                return chunks.join(";");
            }
        }
        return String(obj);
    };
    const getNextIndex = ctx => intToStr(ctx.$static$.$containerState$.$elementIndex$++);
    const setQId = (rctx, ctx) => {
        const id = getNextIndex(rctx);
        ctx.$id$ = id, ctx.$element$.setAttribute("q:id", id);
    };
    const SKIPS_PROPS = [ QSlot, "q:renderFn", "children" ];
    const serializeSStyle = scopeIds => {
        const value = scopeIds.join(" ");
        if (value.length > 0) {
            return value;
        }
    };
    const renderComponent = (rctx, ctx, flags) => {
        const justMounted = !ctx.$mounted$;
        const hostElement = ctx.$element$;
        const containerState = rctx.$static$.$containerState$;
        return containerState.$hostsStaging$.delete(hostElement), containerState.$subsManager$.$clearSub$(hostElement), 
        then(executeComponent(rctx, ctx), (res => {
            const staticCtx = rctx.$static$;
            const newCtx = res.rctx;
            const invocatinContext = newInvokeContext(hostElement);
            if (staticCtx.$hostElements$.add(hostElement), invocatinContext.$subscriber$ = hostElement, 
            invocatinContext.$renderCtx$ = newCtx, justMounted) {
                if (ctx.$appendStyles$) {
                    for (const style of ctx.$appendStyles$) {
                        appendHeadStyle(staticCtx, style);
                    }
                }
                if (ctx.$scopeIds$) {
                    const value = serializeSStyle(ctx.$scopeIds$);
                    value && hostElement.setAttribute("q:sstyle", value);
                }
            }
            const processedJSXNode = processData$1(res.node, invocatinContext);
            return then(processedJSXNode, (processedJSXNode => {
                const newVdom = wrapJSX(hostElement, processedJSXNode);
                const oldVdom = getVdom(ctx);
                return then(visitJsxNode(newCtx, oldVdom, newVdom, flags), (() => {
                    ctx.$vdom$ = newVdom;
                }));
            }));
        }));
    };
    const getVdom = ctx => (ctx.$vdom$ || (ctx.$vdom$ = domToVnode(ctx.$element$)), 
    ctx.$vdom$);
    class ProcessedJSXNodeImpl {
        constructor($type$, $props$, $children$, $key$) {
            this.$type$ = $type$, this.$props$ = $props$, this.$children$ = $children$, this.$key$ = $key$, 
            this.$elm$ = null, this.$text$ = "";
        }
    }
    const wrapJSX = (element, input) => {
        const children = void 0 === input ? EMPTY_ARRAY : isArray(input) ? input : [ input ];
        const node = new ProcessedJSXNodeImpl(":virtual", {}, children, null);
        return node.$elm$ = element, node;
    };
    const processData$1 = (node, invocationContext) => {
        if (null != node && "boolean" != typeof node) {
            if (isString(node) || "number" == typeof node) {
                const newNode = new ProcessedJSXNodeImpl("#text", EMPTY_OBJ, EMPTY_ARRAY, null);
                return newNode.$text$ = String(node), newNode;
            }
            if (isJSXNode(node)) {
                return ((node, invocationContext) => {
                    const key = null != node.key ? String(node.key) : null;
                    const nodeType = node.type;
                    const props = node.props;
                    const originalChildren = props.children;
                    let textType = "";
                    if (isString(nodeType)) {
                        textType = nodeType;
                    } else {
                        if (nodeType !== Virtual) {
                            if (isFunction(nodeType)) {
                                const res = invoke(invocationContext, nodeType, props, node.key);
                                return processData$1(res, invocationContext);
                            }
                            throw qError(QError_invalidJsxNodeType, nodeType);
                        }
                        textType = ":virtual";
                    }
                    let children = EMPTY_ARRAY;
                    return null != originalChildren ? then(processData$1(originalChildren, invocationContext), (result => (void 0 !== result && (children = isArray(result) ? result : [ result ]), 
                    new ProcessedJSXNodeImpl(textType, props, children, key)))) : new ProcessedJSXNodeImpl(textType, props, children, key);
                })(node, invocationContext);
            }
            if (isArray(node)) {
                const output = promiseAll(node.flatMap((n => processData$1(n, invocationContext))));
                return then(output, (array => array.flat(100).filter(isNotNullable)));
            }
            return isPromise(node) ? node.then((node => processData$1(node, invocationContext))) : node === SkipRender ? new ProcessedJSXNodeImpl(":skipRender", EMPTY_OBJ, EMPTY_ARRAY, null) : void logWarn("A unsupported value was passed to the JSX, skipping render. Value:", node);
        }
    };
    const SVG_NS = "http://www.w3.org/2000/svg";
    const CHILDREN_PLACEHOLDER = [];
    const visitJsxNode = (ctx, oldVnode, newVnode, flags) => smartUpdateChildren(ctx, oldVnode, newVnode, "root", flags);
    const smartUpdateChildren = (ctx, oldVnode, newVnode, mode, flags) => {
        oldVnode.$elm$;
        const ch = newVnode.$children$;
        if (1 === ch.length && ":skipRender" === ch[0].$type$) {
            return;
        }
        const elm = oldVnode.$elm$;
        oldVnode.$children$ === CHILDREN_PLACEHOLDER && "HEAD" === elm.nodeName && (mode = "head", 
        flags |= 2);
        const oldCh = getVnodeChildren(oldVnode, mode);
        return oldCh.length > 0 && ch.length > 0 ? updateChildren(ctx, elm, oldCh, ch, flags) : ch.length > 0 ? addVnodes(ctx, elm, null, ch, 0, ch.length - 1, flags) : oldCh.length > 0 ? removeVnodes(ctx.$static$, oldCh, 0, oldCh.length - 1) : void 0;
    };
    const getVnodeChildren = (vnode, mode) => {
        const oldCh = vnode.$children$;
        const elm = vnode.$elm$;
        return oldCh === CHILDREN_PLACEHOLDER ? vnode.$children$ = getChildrenVnodes(elm, mode) : oldCh;
    };
    const updateChildren = (ctx, parentElm, oldCh, newCh, flags) => {
        let oldStartIdx = 0;
        let newStartIdx = 0;
        let oldEndIdx = oldCh.length - 1;
        let oldStartVnode = oldCh[0];
        let oldEndVnode = oldCh[oldEndIdx];
        let newEndIdx = newCh.length - 1;
        let newStartVnode = newCh[0];
        let newEndVnode = newCh[newEndIdx];
        let oldKeyToIdx;
        let idxInOld;
        let elmToMove;
        const results = [];
        const staticCtx = ctx.$static$;
        for (;oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx; ) {
            if (null == oldStartVnode) {
                oldStartVnode = oldCh[++oldStartIdx];
            } else if (null == oldEndVnode) {
                oldEndVnode = oldCh[--oldEndIdx];
            } else if (null == newStartVnode) {
                newStartVnode = newCh[++newStartIdx];
            } else if (null == newEndVnode) {
                newEndVnode = newCh[--newEndIdx];
            } else if (sameVnode(oldStartVnode, newStartVnode)) {
                results.push(patchVnode(ctx, oldStartVnode, newStartVnode, flags)), oldStartVnode = oldCh[++oldStartIdx], 
                newStartVnode = newCh[++newStartIdx];
            } else if (sameVnode(oldEndVnode, newEndVnode)) {
                results.push(patchVnode(ctx, oldEndVnode, newEndVnode, flags)), oldEndVnode = oldCh[--oldEndIdx], 
                newEndVnode = newCh[--newEndIdx];
            } else if (sameVnode(oldStartVnode, newEndVnode)) {
                oldStartVnode.$elm$, oldEndVnode.$elm$, results.push(patchVnode(ctx, oldStartVnode, newEndVnode, flags)), 
                insertBefore(staticCtx, parentElm, oldStartVnode.$elm$, oldEndVnode.$elm$.nextSibling), 
                oldStartVnode = oldCh[++oldStartIdx], newEndVnode = newCh[--newEndIdx];
            } else if (sameVnode(oldEndVnode, newStartVnode)) {
                oldStartVnode.$elm$, oldEndVnode.$elm$, results.push(patchVnode(ctx, oldEndVnode, newStartVnode, flags)), 
                insertBefore(staticCtx, parentElm, oldEndVnode.$elm$, oldStartVnode.$elm$), oldEndVnode = oldCh[--oldEndIdx], 
                newStartVnode = newCh[++newStartIdx];
            } else {
                if (void 0 === oldKeyToIdx && (oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)), 
                idxInOld = oldKeyToIdx[newStartVnode.$key$], void 0 === idxInOld) {
                    const newElm = createElm(ctx, newStartVnode, flags);
                    results.push(then(newElm, (newElm => {
                        insertBefore(staticCtx, parentElm, newElm, oldStartVnode.$elm$);
                    })));
                } else if (elmToMove = oldCh[idxInOld], isTagName(elmToMove, newStartVnode.$type$)) {
                    results.push(patchVnode(ctx, elmToMove, newStartVnode, flags)), oldCh[idxInOld] = void 0, 
                    elmToMove.$elm$, insertBefore(staticCtx, parentElm, elmToMove.$elm$, oldStartVnode.$elm$);
                } else {
                    const newElm = createElm(ctx, newStartVnode, flags);
                    results.push(then(newElm, (newElm => {
                        insertBefore(staticCtx, parentElm, newElm, oldStartVnode.$elm$);
                    })));
                }
                newStartVnode = newCh[++newStartIdx];
            }
        }
        if (newStartIdx <= newEndIdx) {
            const before = null == newCh[newEndIdx + 1] ? null : newCh[newEndIdx + 1].$elm$;
            results.push(addVnodes(ctx, parentElm, before, newCh, newStartIdx, newEndIdx, flags));
        }
        let wait = promiseAll(results);
        return oldStartIdx <= oldEndIdx && (wait = then(wait, (() => {
            removeVnodes(staticCtx, oldCh, oldStartIdx, oldEndIdx);
        }))), wait;
    };
    const getCh = (elm, filter) => {
        const end = isVirtualElement(elm) ? elm.close : null;
        const nodes = [];
        let node = elm.firstChild;
        for (;(node = processVirtualNodes(node)) && (filter(node) && nodes.push(node), node = node.nextSibling, 
        node !== end); ) {}
        return nodes;
    };
    const getChildren = (elm, mode) => {
        switch (mode) {
          case "root":
            return getCh(elm, isChildComponent);

          case "head":
            return getCh(elm, isHeadChildren);

          case "elements":
            return getCh(elm, isQwikElement);
        }
    };
    const getChildrenVnodes = (elm, mode) => getChildren(elm, mode).map(getVnodeFromEl);
    const getVnodeFromEl = el => isElement(el) ? tryGetContext(el)?.$vdom$ ?? domToVnode(el) : domToVnode(el);
    const domToVnode = node => {
        if (isQwikElement(node)) {
            const props = isVirtualElement(node) ? EMPTY_OBJ : getProps(node);
            const t = new ProcessedJSXNodeImpl(node.localName, props, CHILDREN_PLACEHOLDER, getKey(node));
            return t.$elm$ = node, t;
        }
        if (3 === node.nodeType) {
            const t = new ProcessedJSXNodeImpl(node.nodeName, {}, CHILDREN_PLACEHOLDER, null);
            return t.$text$ = node.data, t.$elm$ = node, t;
        }
        throw new Error("invalid node");
    };
    const getProps = node => {
        const props = {};
        const attributes = node.attributes;
        const len = attributes.length;
        for (let i = 0; i < len; i++) {
            const attr = attributes.item(i);
            const name = attr.name;
            name.includes(":") || (props[name] = "class" === name ? parseDomClass(attr.value) : attr.value);
        }
        return props;
    };
    const parseDomClass = value => parseClassList(value).filter((c => !c.startsWith("⭐️"))).join(" ");
    const isHeadChildren = node => {
        const type = node.nodeType;
        return 1 === type ? node.hasAttribute("q:head") : 111 === type;
    };
    const isSlotTemplate = node => "Q:TEMPLATE" === node.nodeName;
    const isChildComponent = node => {
        const type = node.nodeType;
        if (3 === type || 111 === type) {
            return true;
        }
        if (1 !== type) {
            return false;
        }
        const nodeName = node.nodeName;
        return "Q:TEMPLATE" !== nodeName && ("HEAD" !== nodeName || node.hasAttribute("q:head"));
    };
    const patchVnode = (rctx, oldVnode, newVnode, flags) => {
        oldVnode.$type$, newVnode.$type$;
        const elm = oldVnode.$elm$;
        const tag = newVnode.$type$;
        const staticCtx = rctx.$static$;
        const isVirtual = ":virtual" === tag;
        if (newVnode.$elm$ = elm, "#text" === tag) {
            return void (oldVnode.$text$ !== newVnode.$text$ && setProperty(staticCtx, elm, "data", newVnode.$text$));
        }
        let isSvg = !!(1 & flags);
        isSvg || "svg" !== tag || (flags |= 1, isSvg = true);
        const props = newVnode.$props$;
        const isComponent = isVirtual && "q:renderFn" in props;
        const elCtx = getContext(elm);
        if (!isComponent) {
            const listenerMap = updateProperties(elCtx, staticCtx, oldVnode.$props$, props, isSvg);
            const currentComponent = rctx.$cmpCtx$;
            if (currentComponent && !currentComponent.$attachedListeners$) {
                currentComponent.$attachedListeners$ = true;
                for (const key of Object.keys(currentComponent.li)) {
                    addQRLListener(listenerMap, key, currentComponent.li[key]), addGlobalListener(staticCtx, elm, key);
                }
            }
            for (const key of Object.keys(listenerMap)) {
                setAttribute(staticCtx, elm, key, serializeQRLs(listenerMap[key], elCtx));
            }
            if (isSvg && "foreignObject" === newVnode.$type$ && (flags &= -2, isSvg = false), 
            isVirtual && "q:s" in props) {
                const currentComponent = rctx.$cmpCtx$;
                return currentComponent.$slots$, void currentComponent.$slots$.push(newVnode);
            }
            if (void 0 !== props[dangerouslySetInnerHTML]) {
                return;
            }
            if (isVirtual && "qonce" in props) {
                return;
            }
            return smartUpdateChildren(rctx, oldVnode, newVnode, "root", flags);
        }
        let needsRender = setComponentProps$1(elCtx, rctx, props);
        return needsRender || elCtx.$renderQrl$ || elCtx.$element$.hasAttribute("q:id") || (setQId(rctx, elCtx), 
        elCtx.$renderQrl$ = props["q:renderFn"], elCtx.$renderQrl$, needsRender = true), 
        needsRender ? then(renderComponent(rctx, elCtx, flags), (() => renderContentProjection(rctx, elCtx, newVnode, flags))) : renderContentProjection(rctx, elCtx, newVnode, flags);
    };
    const renderContentProjection = (rctx, hostCtx, vnode, flags) => {
        const newChildren = vnode.$children$;
        const staticCtx = rctx.$static$;
        const splittedNewChidren = (input => {
            const output = {};
            for (const item of input) {
                const key = getSlotName(item);
                (output[key] ?? (output[key] = new ProcessedJSXNodeImpl(":virtual", {
                    "q:s": ""
                }, [], key))).$children$.push(item);
            }
            return output;
        })(newChildren);
        const slotRctx = pushRenderContext(rctx, hostCtx);
        const slotMaps = getSlotMap(hostCtx);
        for (const key of Object.keys(slotMaps.slots)) {
            if (!splittedNewChidren[key]) {
                const slotEl = slotMaps.slots[key];
                const oldCh = getChildrenVnodes(slotEl, "root");
                if (oldCh.length > 0) {
                    const slotCtx = tryGetContext(slotEl);
                    slotCtx && slotCtx.$vdom$ && (slotCtx.$vdom$.$children$ = []), removeVnodes(staticCtx, oldCh, 0, oldCh.length - 1);
                }
            }
        }
        for (const key of Object.keys(slotMaps.templates)) {
            const templateEl = slotMaps.templates[key];
            templateEl && (splittedNewChidren[key] && !slotMaps.slots[key] || (removeNode(staticCtx, templateEl), 
            slotMaps.templates[key] = void 0));
        }
        return promiseAll(Object.keys(splittedNewChidren).map((key => {
            const newVdom = splittedNewChidren[key];
            const slotElm = getSlotElement(staticCtx, slotMaps, hostCtx.$element$, key);
            const slotCtx = getContext(slotElm);
            const oldVdom = getVdom(slotCtx);
            return slotCtx.$vdom$ = newVdom, newVdom.$elm$ = slotElm, smartUpdateChildren(slotRctx, oldVdom, newVdom, "root", flags);
        })));
    };
    const addVnodes = (ctx, parentElm, before, vnodes, startIdx, endIdx, flags) => {
        const promises = [];
        let hasPromise = false;
        for (;startIdx <= endIdx; ++startIdx) {
            const ch = vnodes[startIdx];
            const elm = createElm(ctx, ch, flags);
            promises.push(elm), isPromise(elm) && (hasPromise = true);
        }
        if (hasPromise) {
            return Promise.all(promises).then((children => insertChildren(ctx.$static$, parentElm, children, before)));
        }
        insertChildren(ctx.$static$, parentElm, promises, before);
    };
    const insertChildren = (ctx, parentElm, children, before) => {
        for (const child of children) {
            insertBefore(ctx, parentElm, child, before);
        }
    };
    const removeVnodes = (ctx, nodes, startIdx, endIdx) => {
        for (;startIdx <= endIdx; ++startIdx) {
            const ch = nodes[startIdx];
            ch && (ch.$elm$, removeNode(ctx, ch.$elm$));
        }
    };
    const getSlotElement = (ctx, slotMaps, parentEl, slotName) => {
        const slotEl = slotMaps.slots[slotName];
        if (slotEl) {
            return slotEl;
        }
        const templateEl = slotMaps.templates[slotName];
        if (templateEl) {
            return templateEl;
        }
        const template = createTemplate(ctx.$doc$, slotName);
        return ((ctx, parent, newChild) => {
            ctx.$operations$.push({
                $operation$: directInsertBefore,
                $args$: [ parent, newChild, parent.firstChild ]
            });
        })(ctx, parentEl, template), slotMaps.templates[slotName] = template, template;
    };
    const getSlotName = node => node.$props$[QSlot] ?? "";
    const createElm = (rctx, vnode, flags) => {
        const tag = vnode.$type$;
        const doc = rctx.$static$.$doc$;
        if ("#text" === tag) {
            return vnode.$elm$ = ((doc, text) => doc.createTextNode(text))(doc, vnode.$text$);
        }
        let elm;
        let isHead = !!(2 & flags);
        let isSvg = !!(1 & flags);
        isSvg || "svg" !== tag || (flags |= 1, isSvg = true);
        const isVirtual = ":virtual" === tag;
        const props = vnode.$props$;
        const isComponent = "q:renderFn" in props;
        const staticCtx = rctx.$static$;
        isVirtual ? elm = (doc => {
            const open = doc.createComment("qv ");
            const close = doc.createComment("/qv");
            return new VirtualElementImpl(open, close);
        })(doc) : "head" === tag ? (elm = doc.head, flags |= 2, isHead = true) : (elm = createElement(doc, tag, isSvg), 
        flags &= -3), vnode.$elm$ = elm, isSvg && "foreignObject" === tag && (isSvg = false, 
        flags &= -2);
        const elCtx = getContext(elm);
        if (isComponent) {
            setKey(elm, vnode.$key$);
            const renderQRL = props["q:renderFn"];
            return setComponentProps$1(elCtx, rctx, props), setQId(rctx, elCtx), elCtx.$renderQrl$ = renderQRL, 
            then(renderComponent(rctx, elCtx, flags), (() => {
                let children = vnode.$children$;
                if (0 === children.length) {
                    return elm;
                }
                1 === children.length && ":skipRender" === children[0].$type$ && (children = children[0].$children$);
                const slotRctx = pushRenderContext(rctx, elCtx);
                const slotMap = getSlotMap(elCtx);
                const elements = children.map((ch => createElm(slotRctx, ch, flags)));
                return then(promiseAll(elements), (() => {
                    for (const node of children) {
                        node.$elm$, appendChild(staticCtx, getSlotElement(staticCtx, slotMap, elm, getSlotName(node)), node.$elm$);
                    }
                    return elm;
                }));
            }));
        }
        const currentComponent = rctx.$cmpCtx$;
        const isSlot = isVirtual && "q:s" in props;
        const hasRef = !isVirtual && "ref" in props;
        const listenerMap = setProperties(staticCtx, elCtx, props, isSvg);
        if (currentComponent && !isVirtual) {
            const scopedIds = currentComponent.$scopeIds$;
            if (scopedIds && scopedIds.forEach((styleId => {
                elm.classList.add(styleId);
            })), !currentComponent.$attachedListeners$) {
                currentComponent.$attachedListeners$ = true;
                for (const eventName of Object.keys(currentComponent.li)) {
                    addQRLListener(listenerMap, eventName, currentComponent.li[eventName]);
                }
            }
        }
        isSlot ? (currentComponent.$slots$, setKey(elm, vnode.$key$), directSetAttribute(elm, "q:sref", currentComponent.$id$), 
        currentComponent.$slots$.push(vnode), staticCtx.$addSlots$.push([ elm, currentComponent.$element$ ])) : setKey(elm, vnode.$key$);
        {
            const listeners = Object.keys(listenerMap);
            isHead && !isVirtual && directSetAttribute(elm, "q:head", ""), (listeners.length > 0 || hasRef) && setQId(rctx, elCtx);
            for (const key of listeners) {
                setAttribute(staticCtx, elm, key, serializeQRLs(listenerMap[key], elCtx));
            }
        }
        if (void 0 !== props[dangerouslySetInnerHTML]) {
            return elm;
        }
        let children = vnode.$children$;
        if (0 === children.length) {
            return elm;
        }
        1 === children.length && ":skipRender" === children[0].$type$ && (children = children[0].$children$);
        const promises = children.map((ch => createElm(rctx, ch, flags)));
        return then(promiseAll(promises), (() => {
            for (const node of children) {
                node.$elm$, appendChild(rctx.$static$, elm, node.$elm$);
            }
            return elm;
        }));
    };
    const getSlotMap = ctx => {
        const slotsArray = (ctx => ctx.$slots$ || (ctx.$element$.parentElement, ctx.$slots$ = readDOMSlots(ctx)))(ctx);
        const slots = {};
        const templates = {};
        const t = Array.from(ctx.$element$.childNodes).filter(isSlotTemplate);
        for (const vnode of slotsArray) {
            vnode.$elm$, slots[vnode.$key$ ?? ""] = vnode.$elm$;
        }
        for (const elm of t) {
            templates[directGetAttribute(elm, QSlot) ?? ""] = elm;
        }
        return {
            slots: slots,
            templates: templates
        };
    };
    const readDOMSlots = ctx => ((el, prop, value) => {
        const walker = ((el, prop, value) => el.ownerDocument.createTreeWalker(el, 128, {
            acceptNode(c) {
                const virtual = getVirtualElement(c);
                return virtual && directGetAttribute(virtual, "q:sref") === value ? 1 : 2;
            }
        }))(el, 0, value);
        const pars = [];
        let currentNode = null;
        for (;currentNode = walker.nextNode(); ) {
            pars.push(getVirtualElement(currentNode));
        }
        return pars;
    })(ctx.$element$.parentElement, 0, ctx.$id$).map(domToVnode);
    const checkBeforeAssign = (ctx, elm, prop, newValue) => (prop in elm && elm[prop] !== newValue && setProperty(ctx, elm, prop, newValue), 
    true);
    const dangerouslySetInnerHTML = "dangerouslySetInnerHTML";
    const PROP_HANDLER_MAP = {
        style: (ctx, elm, _, newValue) => (setProperty(ctx, elm.style, "cssText", stringifyStyle(newValue)), 
        true),
        class: (ctx, elm, _, newValue, oldValue) => {
            const oldClasses = parseClassList(oldValue);
            const newClasses = parseClassList(newValue);
            return ((ctx, elm, toRemove, toAdd) => {
                ctx ? ctx.$operations$.push({
                    $operation$: _setClasslist,
                    $args$: [ elm, toRemove, toAdd ]
                }) : _setClasslist(elm, toRemove, toAdd);
            })(ctx, elm, oldClasses.filter((c => c && !newClasses.includes(c))), newClasses.filter((c => c && !oldClasses.includes(c)))), 
            true;
        },
        value: checkBeforeAssign,
        checked: checkBeforeAssign,
        [dangerouslySetInnerHTML]: (ctx, elm, _, newValue) => (dangerouslySetInnerHTML in elm ? setProperty(ctx, elm, dangerouslySetInnerHTML, newValue) : "innerHTML" in elm && setProperty(ctx, elm, "innerHTML", newValue), 
        true),
        innerHTML: () => true
    };
    const updateProperties = (elCtx, staticCtx, oldProps, newProps, isSvg) => {
        const keys = getKeys(oldProps, newProps);
        const listenersMap = elCtx.li = {};
        if (0 === keys.length) {
            return listenersMap;
        }
        const elm = elCtx.$element$;
        for (let key of keys) {
            if ("children" === key) {
                continue;
            }
            let newValue = newProps[key];
            "className" === key && (newProps.class = newValue, key = "class"), "class" === key && (newProps.class = newValue = serializeClass(newValue));
            const oldValue = oldProps[key];
            if (oldValue === newValue) {
                continue;
            }
            if ("ref" === key) {
                newValue.current = elm;
                continue;
            }
            if (isOnProp(key)) {
                setEvent(listenersMap, key, newValue);
                continue;
            }
            const exception = PROP_HANDLER_MAP[key];
            exception && exception(staticCtx, elm, key, newValue, oldValue) || (isSvg || !(key in elm) ? setAttribute(staticCtx, elm, key, newValue) : setProperty(staticCtx, elm, key, newValue));
        }
        return listenersMap;
    };
    const getKeys = (oldProps, newProps) => {
        const keys = Object.keys(newProps);
        return keys.push(...Object.keys(oldProps).filter((p => !keys.includes(p)))), keys;
    };
    const addGlobalListener = (staticCtx, elm, prop) => {
        try {
            window.qwikevents && window.qwikevents.push(getEventName(prop));
        } catch (err) {
            logWarn(err);
        }
    };
    const setProperties = (rctx, elCtx, newProps, isSvg) => {
        const elm = elCtx.$element$;
        const keys = Object.keys(newProps);
        const listenerMap = elCtx.li;
        if (0 === keys.length) {
            return listenerMap;
        }
        for (let key of keys) {
            if ("children" === key) {
                continue;
            }
            let newValue = newProps[key];
            if ("className" === key && (newProps.class = newValue, key = "class"), "class" === key && (newProps.class = newValue = serializeClass(newValue)), 
            "ref" === key) {
                newValue.current = elm;
                continue;
            }
            if (isOnProp(key)) {
                addGlobalListener(rctx, elm, setEvent(listenerMap, key, newValue));
                continue;
            }
            const exception = PROP_HANDLER_MAP[key];
            exception && exception(rctx, elm, key, newValue, void 0) || (isSvg || !(key in elm) ? setAttribute(rctx, elm, key, newValue) : setProperty(rctx, elm, key, newValue));
        }
        return listenerMap;
    };
    const setComponentProps$1 = (ctx, rctx, expectProps) => {
        const keys = Object.keys(expectProps);
        if (0 === keys.length) {
            return false;
        }
        const qwikProps = getPropsMutator(ctx, rctx.$static$.$containerState$);
        for (const key of keys) {
            SKIPS_PROPS.includes(key) || qwikProps.set(key, expectProps[key]);
        }
        return ctx.$dirty$;
    };
    const cleanupTree = (parent, rctx, subsManager, stopSlots) => {
        if (stopSlots && parent.hasAttribute("q:s")) {
            return void rctx.$rmSlots$.push(parent);
        }
        cleanupElement(parent, subsManager);
        const ch = getChildren(parent, "elements");
        for (const child of ch) {
            cleanupTree(child, rctx, subsManager, stopSlots);
        }
    };
    const cleanupElement = (el, subsManager) => {
        const ctx = tryGetContext(el);
        ctx && cleanupContext(ctx, subsManager);
    };
    const directAppendChild = (parent, child) => {
        isVirtualElement(child) ? child.appendTo(parent) : parent.appendChild(child);
    };
    const directRemoveChild = (parent, child) => {
        isVirtualElement(child) ? child.remove() : parent.removeChild(child);
    };
    const directInsertBefore = (parent, child, ref) => {
        isVirtualElement(child) ? child.insertBeforeTo(parent, getRootNode(ref)) : parent.insertBefore(child, getRootNode(ref));
    };
    const createKeyToOldIdx = (children, beginIdx, endIdx) => {
        const map = {};
        for (let i = beginIdx; i <= endIdx; ++i) {
            const key = children[i].$key$;
            null != key && (map[key] = i);
        }
        return map;
    };
    const sameVnode = (vnode1, vnode2) => vnode1.$type$ === vnode2.$type$ && vnode1.$key$ === vnode2.$key$;
    const isTagName = (elm, tagName) => elm.$type$ === tagName;
    const useLexicalScope = () => {
        const context = getInvokeContext();
        let qrl = context.$qrl$;
        if (qrl) {
            qrl.$captureRef$;
        } else {
            const el = context.$element$;
            const container = getWrappingContainer(el);
            const ctx = getContext(el);
            qrl = parseQRL(decodeURIComponent(String(context.$url$)), container), resumeIfNeeded(container), 
            inflateQrl(qrl, ctx);
        }
        return qrl.$captureRef$;
    };
    const notifyWatch = (watch, containerState) => {
        watch.$flags$ & WatchFlagsIsDirty || (watch.$flags$ |= WatchFlagsIsDirty, void 0 !== containerState.$hostsRendering$ ? (containerState.$renderPromise$, 
        containerState.$watchStaging$.add(watch)) : (containerState.$watchNext$.add(watch), 
        scheduleFrame(containerState)));
    };
    const scheduleFrame = containerState => (void 0 === containerState.$renderPromise$ && (containerState.$renderPromise$ = getPlatform().nextTick((() => renderMarked(containerState)))), 
    containerState.$renderPromise$);
    const _hW = () => {
        const [watch] = useLexicalScope();
        notifyWatch(watch, getContainerState(getWrappingContainer(watch.$el$)));
    };
    const renderMarked = async containerState => {
        const hostsRendering = containerState.$hostsRendering$ = new Set(containerState.$hostsNext$);
        containerState.$hostsNext$.clear(), await executeWatchesBefore(containerState), 
        containerState.$hostsStaging$.forEach((host => {
            hostsRendering.add(host);
        })), containerState.$hostsStaging$.clear();
        const doc = getDocument(containerState.$containerEl$);
        const renderingQueue = Array.from(hostsRendering);
        sortNodes(renderingQueue);
        const ctx = createRenderContext(doc, containerState);
        const staticCtx = ctx.$static$;
        for (const el of renderingQueue) {
            if (!staticCtx.$hostElements$.has(el)) {
                const elCtx = getContext(el);
                if (elCtx.$renderQrl$) {
                    el.isConnected, staticCtx.$roots$.push(elCtx);
                    try {
                        await renderComponent(ctx, elCtx, getFlags(el.parentElement));
                    } catch (err) {
                        logError(err);
                    }
                }
            }
        }
        return staticCtx.$operations$.push(...staticCtx.$postOperations$), 0 === staticCtx.$operations$.length ? void postRendering(containerState, staticCtx) : getPlatform().raf((() => {
            (({$static$: ctx}) => {
                executeDOMRender(ctx);
            })(ctx), postRendering(containerState, staticCtx);
        }));
    };
    const getFlags = el => {
        let flags = 0;
        return el && (el.namespaceURI === SVG_NS && (flags |= 1), "HEAD" === el.tagName && (flags |= 2)), 
        flags;
    };
    const postRendering = async (containerState, ctx) => {
        await executeWatchesAfter(containerState, ((watch, stage) => 0 != (watch.$flags$ & WatchFlagsIsEffect) && (!stage || ctx.$hostElements$.has(watch.$el$)))), 
        containerState.$hostsStaging$.forEach((el => {
            containerState.$hostsNext$.add(el);
        })), containerState.$hostsStaging$.clear(), containerState.$hostsRendering$ = void 0, 
        containerState.$renderPromise$ = void 0, containerState.$hostsNext$.size + containerState.$watchNext$.size > 0 && scheduleFrame(containerState);
    };
    const executeWatchesBefore = async containerState => {
        const resourcesPromises = [];
        const containerEl = containerState.$containerEl$;
        const watchPromises = [];
        const isWatch = watch => 0 != (watch.$flags$ & WatchFlagsIsWatch);
        const isResourceWatch = watch => 0 != (watch.$flags$ & WatchFlagsIsResource);
        containerState.$watchNext$.forEach((watch => {
            isWatch(watch) && (watchPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), (() => watch))), 
            containerState.$watchNext$.delete(watch)), isResourceWatch(watch) && (resourcesPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), (() => watch))), 
            containerState.$watchNext$.delete(watch));
        }));
        do {
            if (containerState.$watchStaging$.forEach((watch => {
                isWatch(watch) ? watchPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), (() => watch))) : isResourceWatch(watch) ? resourcesPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), (() => watch))) : containerState.$watchNext$.add(watch);
            })), containerState.$watchStaging$.clear(), watchPromises.length > 0) {
                const watches = await Promise.all(watchPromises);
                sortWatches(watches), await Promise.all(watches.map((watch => runSubscriber(watch, containerState)))), 
                watchPromises.length = 0;
            }
        } while (containerState.$watchStaging$.size > 0);
        if (resourcesPromises.length > 0) {
            const resources = await Promise.all(resourcesPromises);
            sortWatches(resources), resources.forEach((watch => runSubscriber(watch, containerState)));
        }
    };
    const executeWatchesAfter = async (containerState, watchPred) => {
        const watchPromises = [];
        const containerEl = containerState.$containerEl$;
        containerState.$watchNext$.forEach((watch => {
            watchPred(watch, false) && (watchPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), (() => watch))), 
            containerState.$watchNext$.delete(watch));
        }));
        do {
            if (containerState.$watchStaging$.forEach((watch => {
                watchPred(watch, true) ? watchPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), (() => watch))) : containerState.$watchNext$.add(watch);
            })), containerState.$watchStaging$.clear(), watchPromises.length > 0) {
                const watches = await Promise.all(watchPromises);
                sortWatches(watches), await Promise.all(watches.map((watch => runSubscriber(watch, containerState)))), 
                watchPromises.length = 0;
            }
        } while (containerState.$watchStaging$.size > 0);
    };
    const sortNodes = elements => {
        elements.sort(((a, b) => 2 & a.compareDocumentPosition(getRootNode(b)) ? 1 : -1));
    };
    const sortWatches = watches => {
        watches.sort(((a, b) => a.$el$ === b.$el$ ? a.$index$ < b.$index$ ? -1 : 1 : 0 != (2 & a.$el$.compareDocumentPosition(getRootNode(b.$el$))) ? 1 : -1));
    };
    const CONTAINER_STATE = Symbol("ContainerState");
    const getContainerState = containerEl => {
        let set = containerEl[CONTAINER_STATE];
        return set || (containerEl[CONTAINER_STATE] = set = createContainerState(containerEl)), 
        set;
    };
    const createContainerState = containerEl => {
        const containerState = {
            $containerEl$: containerEl,
            $proxyMap$: new WeakMap,
            $subsManager$: null,
            $watchNext$: new Set,
            $watchStaging$: new Set,
            $hostsNext$: new Set,
            $hostsStaging$: new Set,
            $renderPromise$: void 0,
            $hostsRendering$: void 0,
            $envData$: {},
            $elementIndex$: 0,
            $styleIds$: new Set,
            $mutableProps$: false
        };
        return containerState.$subsManager$ = createSubscriptionManager(containerState), 
        containerState;
    };
    const createSubscriptionManager = containerState => {
        const objToSubs = new Map;
        const subsToObjs = new Map;
        const tryGetLocal = obj => (getProxyTarget(obj), objToSubs.get(obj));
        const trackSubToObj = (subscriber, map) => {
            let set = subsToObjs.get(subscriber);
            set || subsToObjs.set(subscriber, set = new Set), set.add(map);
        };
        const manager = {
            $tryGetLocal$: tryGetLocal,
            $getLocal$: (obj, initialMap) => {
                let local = tryGetLocal(obj);
                if (local) {} else {
                    const map = initialMap || new Map;
                    map.forEach(((_, key) => {
                        trackSubToObj(key, map);
                    })), objToSubs.set(obj, local = {
                        $subs$: map,
                        $addSub$(subscriber, key) {
                            if (null == key) {
                                map.set(subscriber, null);
                            } else {
                                let sub = map.get(subscriber);
                                void 0 === sub && map.set(subscriber, sub = new Set), sub && sub.add(key);
                            }
                            trackSubToObj(subscriber, map);
                        },
                        $notifySubs$(key) {
                            map.forEach(((value, subscriber) => {
                                null !== value && key && !value.has(key) || ((subscriber, containerState) => {
                                    isQwikElement(subscriber) ? ((hostElement, containerState) => {
                                        const server = isServer();
                                        server || resumeIfNeeded(containerState.$containerEl$);
                                        const ctx = getContext(hostElement);
                                        if (ctx.$renderQrl$, !ctx.$dirty$) {
                                            if (ctx.$dirty$ = true, void 0 !== containerState.$hostsRendering$) {
                                                containerState.$renderPromise$, containerState.$hostsStaging$.add(hostElement);
                                            } else {
                                                if (server) {
                                                    return void logWarn("Can not rerender in server platform");
                                                }
                                                containerState.$hostsNext$.add(hostElement), scheduleFrame(containerState);
                                            }
                                        }
                                    })(subscriber, containerState) : notifyWatch(subscriber, containerState);
                                })(subscriber, containerState);
                            }));
                        }
                    });
                }
                return local;
            },
            $clearSub$: sub => {
                const subs = subsToObjs.get(sub);
                subs && (subs.forEach((s => {
                    s.delete(sub);
                })), subsToObjs.delete(sub), subs.clear());
            }
        };
        return manager;
    };
    const _pauseFromContexts = async (allContexts, containerState) => {
        const collector = createCollector(containerState);
        const listeners = [];
        for (const ctx of allContexts) {
            const el = ctx.$element$;
            const ctxLi = ctx.li;
            for (const key of Object.keys(ctxLi)) {
                for (const qrl of ctxLi[key]) {
                    const captured = qrl.$captureRef$;
                    if (captured) {
                        for (const obj of captured) {
                            collectValue(obj, collector, true);
                        }
                    }
                    isElement(el) && listeners.push({
                        key: key,
                        qrl: qrl,
                        el: el,
                        eventName: getEventName(key)
                    });
                }
            }
            ctx.$watches$ && collector.$watches$.push(...ctx.$watches$);
        }
        if (0 === listeners.length) {
            return {
                state: {
                    ctx: {},
                    objs: [],
                    subs: []
                },
                objs: [],
                listeners: [],
                mode: "static"
            };
        }
        let promises;
        for (;(promises = collector.$promises$).length > 0; ) {
            collector.$promises$ = [], await Promise.allSettled(promises);
        }
        const canRender = collector.$elements$.length > 0;
        if (canRender) {
            for (const element of collector.$elements$) {
                collectElementData(tryGetContext(element), collector);
            }
            for (const ctx of allContexts) {
                if (ctx.$props$ && collectMutableProps(ctx.$element$, ctx.$props$, collector), ctx.$contexts$) {
                    for (const item of ctx.$contexts$.values()) {
                        collectValue(item, collector, false);
                    }
                }
            }
        }
        for (;(promises = collector.$promises$).length > 0; ) {
            collector.$promises$ = [], await Promise.allSettled(promises);
        }
        const elementToIndex = new Map;
        const objs = Array.from(collector.$objSet$.keys());
        const objToId = new Map;
        const getElementID = el => {
            let id = elementToIndex.get(el);
            return void 0 === id && (id = (el => {
                const ctx = tryGetContext(el);
                return ctx ? ctx.$id$ : null;
            })(el), id ? id = "#" + id : console.warn("Missing ID", el), elementToIndex.set(el, id)), 
            id;
        };
        const getObjId = obj => {
            let suffix = "";
            if (isMutable(obj) && (obj = obj.mut, suffix = "%"), isPromise(obj)) {
                const {value: value, resolved: resolved} = getPromiseValue(obj);
                obj = value, suffix += resolved ? "~" : "_";
            }
            if (isObject(obj)) {
                const target = getProxyTarget(obj);
                if (target) {
                    suffix += "!", obj = target;
                } else if (isQwikElement(obj)) {
                    const elID = getElementID(obj);
                    return elID ? elID + suffix : null;
                }
            }
            const id = objToId.get(obj);
            return id ? id + suffix : null;
        };
        const mustGetObjId = obj => {
            const key = getObjId(obj);
            if (null === key) {
                throw qError(QError_missingObjectId, obj);
            }
            return key;
        };
        const subsMap = new Map;
        objs.forEach((obj => {
            const proxy = containerState.$proxyMap$.get(obj);
            const flags = getProxyFlags(proxy);
            if (void 0 === flags) {
                return;
            }
            const subsObj = [];
            flags > 0 && subsObj.push({
                subscriber: "$",
                data: flags
            }), getProxySubs(proxy).forEach(((set, key) => {
                isNode(key) && isVirtualElement(key) && !collector.$elements$.includes(key) || subsObj.push({
                    subscriber: key,
                    data: set ? Array.from(set) : null
                });
            })), subsObj.length > 0 && subsMap.set(obj, subsObj);
        })), objs.sort(((a, b) => (subsMap.has(a) ? 0 : 1) - (subsMap.has(b) ? 0 : 1)));
        let count = 0;
        for (const obj of objs) {
            objToId.set(obj, intToStr(count)), count++;
        }
        if (collector.$noSerialize$.length > 0) {
            const undefinedID = objToId.get(void 0);
            for (const obj of collector.$noSerialize$) {
                objToId.set(obj, undefinedID);
            }
        }
        const subs = objs.map((obj => {
            const sub = subsMap.get(obj);
            if (!sub) {
                return;
            }
            const subsObj = {};
            return sub.forEach((({subscriber: subscriber, data: data}) => {
                if ("$" === subscriber) {
                    subsObj[subscriber] = data;
                } else {
                    const id = getObjId(subscriber);
                    null !== id && (subsObj[id] = data);
                }
            })), subsObj;
        })).filter(isNotNullable);
        const convertedObjs = objs.map((obj => {
            if (null === obj) {
                return null;
            }
            const typeObj = typeof obj;
            switch (typeObj) {
              case "undefined":
                return UNDEFINED_PREFIX;

              case "string":
              case "number":
              case "boolean":
                return obj;

              default:
                const value = serializeValue(obj, getObjId, containerState);
                if (void 0 !== value) {
                    return value;
                }
                if ("object" === typeObj) {
                    if (isArray(obj)) {
                        return obj.map(mustGetObjId);
                    }
                    if (isSerializableObject(obj)) {
                        const output = {};
                        for (const key of Object.keys(obj)) {
                            output[key] = mustGetObjId(obj[key]);
                        }
                        return output;
                    }
                }
            }
            throw qError(QError_verifySerializable, obj);
        }));
        const meta = {};
        allContexts.forEach((ctx => {
            const node = ctx.$element$;
            const ref = ctx.$refMap$;
            const props = ctx.$props$;
            const contexts = ctx.$contexts$;
            const watches = ctx.$watches$;
            const renderQrl = ctx.$renderQrl$;
            const seq = ctx.$seq$;
            const metaValue = {};
            const elementCaptured = isVirtualElement(node) && collector.$elements$.includes(node);
            let add = false;
            if (ref.length > 0) {
                const value = ref.map(mustGetObjId).join(" ");
                value && (metaValue.r = value, add = true);
            }
            if (canRender) {
                if (elementCaptured && props && (metaValue.h = mustGetObjId(props) + " " + mustGetObjId(renderQrl), 
                add = true), watches && watches.length > 0) {
                    const value = watches.map(getObjId).filter(isNotNullable).join(" ");
                    value && (metaValue.w = value, add = true);
                }
                if (elementCaptured && seq && seq.length > 0) {
                    const value = seq.map(mustGetObjId).join(" ");
                    metaValue.s = value, add = true;
                }
                if (contexts) {
                    const serializedContexts = [];
                    contexts.forEach(((value, key) => {
                        serializedContexts.push(`${key}=${mustGetObjId(value)}`);
                    }));
                    const value = serializedContexts.join(" ");
                    value && (metaValue.c = value, add = true);
                }
            }
            if (add) {
                const elementID = getElementID(node);
                meta[elementID] = metaValue;
            }
        }));
        for (const watch of collector.$watches$) {
            destroyWatch(watch);
        }
        return {
            state: {
                ctx: meta,
                objs: convertedObjs,
                subs: subs
            },
            objs: objs,
            listeners: listeners,
            mode: canRender ? "render" : "listeners"
        };
    };
    const getNodesInScope = (parent, predicate) => {
        predicate(parent);
        const walker = parent.ownerDocument.createTreeWalker(parent, 129, {
            acceptNode: node => isContainer(node) ? 2 : predicate(node) ? 1 : 3
        });
        const pars = [];
        let currentNode = null;
        for (;currentNode = walker.nextNode(); ) {
            pars.push(processVirtualNodes(currentNode));
        }
        return pars;
    };
    const reviveNestedObjects = (obj, getObject, parser) => {
        if (!parser.fill(obj) && obj && "object" == typeof obj) {
            if (isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    const value = obj[i];
                    "string" == typeof value ? obj[i] = getObject(value) : reviveNestedObjects(value, getObject, parser);
                }
            } else if (isSerializableObject(obj)) {
                for (const key of Object.keys(obj)) {
                    const value = obj[key];
                    "string" == typeof value ? obj[key] = getObject(value) : reviveNestedObjects(value, getObject, parser);
                }
            }
        }
    };
    const OBJECT_TRANSFORMS = {
        "!": (obj, containerState) => containerState.$proxyMap$.get(obj) ?? getOrCreateProxy(obj, containerState),
        "%": obj => mutable(obj),
        "~": obj => Promise.resolve(obj),
        _: obj => Promise.reject(obj)
    };
    const collectMutableProps = (el, props, collector) => {
        const subs = getProxySubs(props);
        subs && subs.has(el) && collectElement(el, collector);
    };
    const createCollector = containerState => ({
        $containerState$: containerState,
        $seen$: new Set,
        $objSet$: new Set,
        $noSerialize$: [],
        $elements$: [],
        $watches$: [],
        $promises$: []
    });
    const collectDeferElement = (el, collector) => {
        collector.$elements$.includes(el) || collector.$elements$.push(el);
    };
    const collectElement = (el, collector) => {
        if (collector.$elements$.includes(el)) {
            return;
        }
        const ctx = tryGetContext(el);
        ctx && (collector.$elements$.push(el), collectElementData(ctx, collector));
    };
    const collectElementData = (ctx, collector) => {
        if (ctx.$props$ && collectValue(ctx.$props$, collector, false), ctx.$renderQrl$ && collectValue(ctx.$renderQrl$, collector, false), 
        ctx.$seq$) {
            for (const obj of ctx.$seq$) {
                collectValue(obj, collector, false);
            }
        }
        if (ctx.$watches$) {
            for (const obj of ctx.$watches$) {
                collectValue(obj, collector, false);
            }
        }
        if (ctx.$contexts$) {
            for (const obj of ctx.$contexts$.values()) {
                collectValue(obj, collector, false);
            }
        }
    };
    const PROMISE_VALUE = Symbol();
    const getPromiseValue = promise => promise[PROMISE_VALUE];
    const collectValue = (obj, collector, leaks) => {
        if (null !== obj) {
            const objType = typeof obj;
            const seen = collector.$seen$;
            switch (objType) {
              case "function":
                if (seen.has(obj)) {
                    return;
                }
                if (seen.add(obj), !fastShouldSerialize(obj)) {
                    return collector.$objSet$.add(void 0), void collector.$noSerialize$.push(obj);
                }
                if (isQrl(obj)) {
                    if (collector.$objSet$.add(obj), obj.$captureRef$) {
                        for (const item of obj.$captureRef$) {
                            collectValue(item, collector, leaks);
                        }
                    }
                    return;
                }
                break;

              case "object":
                {
                    if (seen.has(obj)) {
                        return;
                    }
                    if (seen.add(obj), !fastShouldSerialize(obj)) {
                        return collector.$objSet$.add(void 0), void collector.$noSerialize$.push(obj);
                    }
                    if (isPromise(obj)) {
                        return void collector.$promises$.push((promise = obj, promise.then((value => {
                            const v = {
                                resolved: true,
                                value: value
                            };
                            return promise[PROMISE_VALUE] = v, value;
                        }), (value => {
                            const v = {
                                resolved: false,
                                value: value
                            };
                            return promise[PROMISE_VALUE] = v, value;
                        }))).then((value => {
                            collectValue(value, collector, leaks);
                        })));
                    }
                    const target = getProxyTarget(obj);
                    const input = obj;
                    if (target) {
                        if (leaks && ((proxy, collector) => {
                            const subs = getProxySubs(proxy);
                            if (!collector.$seen$.has(subs)) {
                                collector.$seen$.add(subs);
                                for (const key of Array.from(subs.keys())) {
                                    isNode(key) && isVirtualElement(key) ? collectDeferElement(key, collector) : collectValue(key, collector, true);
                                }
                            }
                        })(input, collector), obj = target, seen.has(obj)) {
                            return;
                        }
                        if (seen.add(obj), isResourceReturn(obj)) {
                            return collector.$objSet$.add(target), collectValue(obj.promise, collector, leaks), 
                            void collectValue(obj.resolved, collector, leaks);
                        }
                    } else if (isNode(obj)) {
                        return;
                    }
                    if (isArray(obj)) {
                        for (let i = 0; i < obj.length; i++) {
                            collectValue(input[i], collector, leaks);
                        }
                    } else {
                        for (const key of Object.keys(obj)) {
                            collectValue(input[key], collector, leaks);
                        }
                    }
                    break;
                }
            }
        }
        var promise;
        collector.$objSet$.add(obj);
    };
    const isContainer = el => isElement(el) && el.hasAttribute("q:container");
    const hasQId = el => {
        const node = processVirtualNodes(el);
        return !!isQwikElement(node) && node.hasAttribute("q:id");
    };
    const intToStr = nu => nu.toString(36);
    const strToInt = nu => parseInt(nu, 36);
    const getEventName = attribute => {
        const colonPos = attribute.indexOf(":");
        return attribute.slice(colonPos + 1).replace(/-./g, (x => x[1].toUpperCase()));
    };
    const WatchFlagsIsEffect = 1;
    const WatchFlagsIsWatch = 2;
    const WatchFlagsIsDirty = 4;
    const WatchFlagsIsCleanup = 8;
    const WatchFlagsIsResource = 16;
    const useWatchQrl = (qrl, opts) => {
        const {get: get, set: set, ctx: ctx, i: i} = useSequentialScope();
        if (get) {
            return;
        }
        const el = ctx.$hostElement$;
        const containerState = ctx.$renderCtx$.$static$.$containerState$;
        const watch = new Watch(WatchFlagsIsDirty | WatchFlagsIsWatch, i, el, qrl, void 0);
        const elCtx = getContext(el);
        set(true), qrl.$resolveLazy$(containerState.$containerEl$), elCtx.$watches$ || (elCtx.$watches$ = []), 
        elCtx.$watches$.push(watch), waitAndRun(ctx, (() => runSubscriber(watch, containerState, ctx.$renderCtx$))), 
        isServer() && useRunWatch(watch, opts?.eagerness);
    };
    const useWatch$ = implicit$FirstArg(useWatchQrl);
    const useClientEffectQrl = (qrl, opts) => {
        const {get: get, set: set, i: i, ctx: ctx} = useSequentialScope();
        if (get) {
            return;
        }
        const el = ctx.$hostElement$;
        const watch = new Watch(WatchFlagsIsEffect, i, el, qrl, void 0);
        const eagerness = opts?.eagerness ?? "visible";
        const elCtx = getContext(el);
        const containerState = ctx.$renderCtx$.$static$.$containerState$;
        set(true), elCtx.$watches$ || (elCtx.$watches$ = []), elCtx.$watches$.push(watch), 
        useRunWatch(watch, eagerness), isServer() || (qrl.$resolveLazy$(containerState.$containerEl$), 
        notifyWatch(watch, containerState));
    };
    const useClientEffect$ = implicit$FirstArg(useClientEffectQrl);
    const useServerMountQrl = mountQrl => {
        const {get: get, set: set, ctx: ctx} = useSequentialScope();
        if (!get) {
            if (!isServer()) {
                throw qError(QError_canNotMountUseServerMount, ctx.$hostElement$);
            }
            waitAndRun(ctx, mountQrl), set(true);
        }
    };
    const useServerMount$ = implicit$FirstArg(useServerMountQrl);
    const useMountQrl = mountQrl => {
        const {get: get, set: set, ctx: ctx} = useSequentialScope();
        get || (mountQrl.$resolveLazy$(ctx.$renderCtx$.$static$.$containerState$.$containerEl$), 
        waitAndRun(ctx, mountQrl), set(true));
    };
    const useMount$ = implicit$FirstArg(useMountQrl);
    const isResourceWatch = watch => !!watch.$resource$;
    const runSubscriber = (watch, containerState, rctx) => (watch.$flags$, isResourceWatch(watch) ? runResource(watch, containerState) : runWatch(watch, containerState, rctx));
    const runResource = (watch, containerState, waitOn) => {
        watch.$flags$ &= ~WatchFlagsIsDirty, cleanupWatch(watch);
        const el = watch.$el$;
        const invokationContext = newInvokeContext(el, void 0, "WatchEvent");
        const {$subsManager$: subsManager} = containerState;
        const watchFn = watch.$qrl$.getFn(invokationContext, (() => {
            subsManager.$clearSub$(watch);
        }));
        const cleanups = [];
        const resource = watch.$resource$;
        const resourceTarget = unwrapProxy(resource);
        const opts = {
            track: (obj, prop) => {
                const target = getProxyTarget(obj);
                return target ? subsManager.$getLocal$(target).$addSub$(watch, prop) : logErrorAndStop(codeToText(QError_trackUseStore), obj), 
                prop ? obj[prop] : obj;
            },
            cleanup(callback) {
                cleanups.push(callback);
            },
            previous: resourceTarget.resolved
        };
        let resolve;
        let reject;
        let done = false;
        const setState = (resolved, value) => !done && (done = true, resolved ? (done = true, 
        resource.state = "resolved", resource.resolved = value, resource.error = void 0, 
        resolve(value)) : (done = true, resource.state = "rejected", resource.resolved = void 0, 
        resource.error = value, reject(value)), true);
        invoke(invokationContext, (() => {
            resource.state = "pending", resource.resolved = void 0, resource.promise = new Promise(((r, re) => {
                resolve = r, reject = re;
            }));
        })), watch.$destroy$ = noSerialize((() => {
            cleanups.forEach((fn => fn()));
        }));
        const promise = safeCall((() => then(waitOn, (() => watchFn(opts)))), (value => {
            setState(true, value);
        }), (reason => {
            setState(false, reason);
        }));
        const timeout = resourceTarget.timeout;
        return timeout ? Promise.race([ promise, delay(timeout).then((() => {
            setState(false, "timeout") && cleanupWatch(watch);
        })) ]) : promise;
    };
    const runWatch = (watch, containerState, rctx) => {
        watch.$flags$ &= ~WatchFlagsIsDirty, cleanupWatch(watch);
        const hostElement = watch.$el$;
        const invokationContext = newInvokeContext(hostElement, void 0, "WatchEvent");
        const {$subsManager$: subsManager} = containerState;
        const watchFn = watch.$qrl$.getFn(invokationContext, (() => {
            subsManager.$clearSub$(watch);
        }));
        const cleanups = [];
        watch.$destroy$ = noSerialize((() => {
            cleanups.forEach((fn => fn()));
        }));
        const opts = {
            track: (obj, prop) => {
                const target = getProxyTarget(obj);
                return target ? subsManager.$getLocal$(target).$addSub$(watch, prop) : logErrorAndStop(codeToText(QError_trackUseStore), obj), 
                prop ? obj[prop] : obj;
            },
            cleanup(callback) {
                cleanups.push(callback);
            }
        };
        return safeCall((() => watchFn(opts)), (returnValue => {
            isFunction(returnValue) && cleanups.push(returnValue);
        }), (reason => {
            handleError(reason, hostElement, rctx);
        }));
    };
    const cleanupWatch = watch => {
        const destroy = watch.$destroy$;
        if (destroy) {
            watch.$destroy$ = void 0;
            try {
                destroy();
            } catch (err) {
                logError(err);
            }
        }
    };
    const destroyWatch = watch => {
        watch.$flags$ & WatchFlagsIsCleanup ? (watch.$flags$ &= ~WatchFlagsIsCleanup, (0, 
        watch.$qrl$)()) : cleanupWatch(watch);
    };
    const useRunWatch = (watch, eagerness) => {
        "load" === eagerness ? useOn("qinit", getWatchHandlerQrl(watch)) : "visible" === eagerness && useOn("qvisible", getWatchHandlerQrl(watch));
    };
    const getWatchHandlerQrl = watch => {
        const watchQrl = watch.$qrl$;
        return createQRL(watchQrl.$chunk$, "_hW", _hW, null, null, [ watch ], watchQrl.$symbol$);
    };
    class Watch {
        constructor($flags$, $index$, $el$, $qrl$, $resource$) {
            this.$flags$ = $flags$, this.$index$ = $index$, this.$el$ = $el$, this.$qrl$ = $qrl$, 
            this.$resource$ = $resource$;
        }
    }
    const useResourceQrl = (qrl, opts) => {
        const {get: get, set: set, i: i, ctx: ctx} = useSequentialScope();
        if (null != get) {
            return get;
        }
        const containerState = ctx.$renderCtx$.$static$.$containerState$;
        const resource = createResourceReturn(containerState, opts);
        const el = ctx.$hostElement$;
        const watch = new Watch(WatchFlagsIsDirty | WatchFlagsIsResource, i, el, qrl, resource);
        const previousWait = Promise.all(ctx.$waitOn$.slice());
        const elCtx = getContext(el);
        return runResource(watch, containerState, previousWait), elCtx.$watches$ || (elCtx.$watches$ = []), 
        elCtx.$watches$.push(watch), set(resource), resource;
    };
    const _createResourceReturn = opts => ({
        __brand: "resource",
        promise: void 0,
        resolved: void 0,
        error: void 0,
        state: "pending",
        timeout: opts?.timeout
    });
    const createResourceReturn = (containerState, opts, initialPromise) => {
        const result = _createResourceReturn(opts);
        return result.promise = initialPromise, createProxy(result, containerState, 0, void 0);
    };
    const isResourceReturn = obj => isObject(obj) && "resource" === obj.__brand;
    const UNDEFINED_PREFIX = "";
    const QRLSerializer = {
        prefix: "",
        test: v => isQrl(v),
        serialize: (obj, getObjId, containerState) => stringifyQRL(obj, {
            $getObjId$: getObjId
        }),
        prepare: (data, containerState) => parseQRL(data, containerState.$containerEl$),
        fill: (qrl, getObject) => {
            qrl.$capture$ && qrl.$capture$.length > 0 && (qrl.$captureRef$ = qrl.$capture$.map(getObject), 
            qrl.$capture$ = null);
        }
    };
    const WatchSerializer = {
        prefix: "",
        test: v => {
            return isObject(obj = v) && obj instanceof Watch;
            var obj;
        },
        serialize: (obj, getObjId) => ((watch, getObjId) => {
            let value = `${intToStr(watch.$flags$)} ${intToStr(watch.$index$)} ${getObjId(watch.$qrl$)} ${getObjId(watch.$el$)}`;
            return isResourceWatch(watch) && (value += ` ${getObjId(watch.$resource$)}`), value;
        })(obj, getObjId),
        prepare: data => (data => {
            const [flags, index, qrl, el, resource] = data.split(" ");
            return new Watch(strToInt(flags), strToInt(index), el, qrl, resource);
        })(data),
        fill: (watch, getObject) => {
            watch.$el$ = getObject(watch.$el$), watch.$qrl$ = getObject(watch.$qrl$), watch.$resource$ && (watch.$resource$ = getObject(watch.$resource$));
        }
    };
    const ResourceSerializer = {
        prefix: "",
        test: v => isResourceReturn(v),
        serialize: (obj, getObjId) => ((resource, getObjId) => {
            const state = resource.state;
            return "resolved" === state ? `0 ${getObjId(resource.resolved)}` : "pending" === state ? "1" : `2 ${getObjId(resource.error)}`;
        })(obj, getObjId),
        prepare: data => (data => {
            const [first, id] = data.split(" ");
            const result = _createResourceReturn(void 0);
            return result.promise = Promise.resolve(), "0" === first ? (result.state = "resolved", 
            result.resolved = id) : "1" === first ? (result.state = "pending", result.promise = new Promise((() => {}))) : "2" === first && (result.state = "rejected", 
            result.error = id), result;
        })(data),
        fill: (resource, getObject) => {
            if ("resolved" === resource.state) {
                resource.resolved = getObject(resource.resolved), resource.promise = Promise.resolve(resource.resolved);
            } else if ("rejected" === resource.state) {
                const p = Promise.reject(resource.error);
                p.catch((() => null)), resource.error = getObject(resource.error), resource.promise = p;
            }
        }
    };
    const URLSerializer = {
        prefix: "",
        test: v => v instanceof URL,
        serialize: obj => obj.href,
        prepare: data => new URL(data),
        fill: void 0
    };
    const DateSerializer = {
        prefix: "",
        test: v => v instanceof Date,
        serialize: obj => obj.toISOString(),
        prepare: data => new Date(data),
        fill: void 0
    };
    const RegexSerializer = {
        prefix: "",
        test: v => v instanceof RegExp,
        serialize: obj => `${obj.flags} ${obj.source}`,
        prepare: data => {
            const space = data.indexOf(" ");
            const source = data.slice(space + 1);
            const flags = data.slice(0, space);
            return new RegExp(source, flags);
        },
        fill: void 0
    };
    const ErrorSerializer = {
        prefix: "",
        test: v => v instanceof Error,
        serialize: obj => obj.message,
        prepare: text => {
            const err = new Error(text);
            return err.stack = void 0, err;
        },
        fill: void 0
    };
    const DocumentSerializer = {
        prefix: "",
        test: v => isDocument(v),
        serialize: void 0,
        prepare: (_, _c, doc) => doc,
        fill: void 0
    };
    const SERIALIZABLE_STATE = Symbol("serializable-data");
    const ComponentSerializer = {
        prefix: "",
        test: obj => isQwikComponent(obj),
        serialize: (obj, getObjId, containerState) => {
            const [qrl] = obj[SERIALIZABLE_STATE];
            return stringifyQRL(qrl, {
                $getObjId$: getObjId
            });
        },
        prepare: (data, containerState) => {
            const optionsIndex = data.indexOf("{");
            const qrlString = -1 == optionsIndex ? data : data.slice(0, optionsIndex);
            const qrl = parseQRL(qrlString, containerState.$containerEl$);
            return componentQrl(qrl);
        },
        fill: (component, getObject) => {
            const [qrl] = component[SERIALIZABLE_STATE];
            qrl.$capture$ && qrl.$capture$.length > 0 && (qrl.$captureRef$ = qrl.$capture$.map(getObject), 
            qrl.$capture$ = null);
        }
    };
    const serializers = [ QRLSerializer, WatchSerializer, ResourceSerializer, URLSerializer, DateSerializer, RegexSerializer, ErrorSerializer, DocumentSerializer, ComponentSerializer, {
        prefix: "",
        test: obj => "function" == typeof obj && void 0 !== obj.__qwik_serializable__,
        serialize: obj => obj.toString(),
        prepare: data => {
            const fn = new Function("return " + data)();
            return fn.__qwik_serializable__ = true, fn;
        },
        fill: void 0
    } ];
    const serializeValue = (obj, getObjID, containerState) => {
        for (const s of serializers) {
            if (s.test(obj)) {
                let value = s.prefix;
                return s.serialize && (value += s.serialize(obj, getObjID, containerState)), value;
            }
        }
    };
    const getOrCreateProxy = (target, containerState, flags = 0) => containerState.$proxyMap$.get(target) || createProxy(target, containerState, flags, void 0);
    const createProxy = (target, containerState, flags, subs) => {
        unwrapProxy(target), containerState.$proxyMap$.has(target), isObject(target), isSerializableObject(target) || isArray(target);
        const manager = containerState.$subsManager$.$getLocal$(target, subs);
        const proxy = new Proxy(target, new ReadWriteProxyHandler(containerState, manager, flags));
        return containerState.$proxyMap$.set(target, proxy), proxy;
    };
    const QOjectTargetSymbol = Symbol();
    const QOjectSubsSymbol = Symbol();
    const QOjectFlagsSymbol = Symbol();
    class ReadWriteProxyHandler {
        constructor($containerState$, $manager$, $flags$) {
            this.$containerState$ = $containerState$, this.$manager$ = $manager$, this.$flags$ = $flags$;
        }
        get(target, prop) {
            if ("symbol" == typeof prop) {
                return prop === QOjectTargetSymbol ? target : prop === QOjectFlagsSymbol ? this.$flags$ : prop === QOjectSubsSymbol ? this.$manager$.$subs$ : target[prop];
            }
            let subscriber;
            const invokeCtx = tryGetInvokeContext();
            const recursive = 0 != (1 & this.$flags$);
            const immutable = 0 != (2 & this.$flags$);
            invokeCtx && (subscriber = invokeCtx.$subscriber$);
            let value = target[prop];
            if (isMutable(value) ? value = value.mut : immutable && (subscriber = null), subscriber) {
                const isA = isArray(target);
                this.$manager$.$addSub$(subscriber, isA ? void 0 : prop);
            }
            return recursive ? wrap(value, this.$containerState$) : value;
        }
        set(target, prop, newValue) {
            if ("symbol" == typeof prop) {
                return target[prop] = newValue, true;
            }
            if (0 != (2 & this.$flags$)) {
                throw qError(QError_immutableProps);
            }
            const unwrappedNewValue = 0 != (1 & this.$flags$) ? unwrapProxy(newValue) : newValue;
            return isArray(target) ? (target[prop] = unwrappedNewValue, this.$manager$.$notifySubs$(), 
            true) : (target[prop] !== unwrappedNewValue && (target[prop] = unwrappedNewValue, 
            this.$manager$.$notifySubs$(prop)), true);
        }
        has(target, property) {
            return property === QOjectTargetSymbol || property === QOjectFlagsSymbol || Object.prototype.hasOwnProperty.call(target, property);
        }
        ownKeys(target) {
            let subscriber = null;
            const invokeCtx = tryGetInvokeContext();
            return invokeCtx && (subscriber = invokeCtx.$subscriber$), subscriber && this.$manager$.$addSub$(subscriber), 
            Object.getOwnPropertyNames(target);
        }
    }
    const wrap = (value, containerState) => {
        if (isQrl(value)) {
            return value;
        }
        if (isObject(value)) {
            if (Object.isFrozen(value)) {
                return value;
            }
            const nakedValue = unwrapProxy(value);
            return nakedValue !== value || isNode(nakedValue) ? value : shouldSerialize(nakedValue) ? containerState.$proxyMap$.get(value) || getOrCreateProxy(value, containerState, 1) : value;
        }
        return value;
    };
    const noSerializeSet = new WeakSet;
    const shouldSerialize = obj => !isObject(obj) && !isFunction(obj) || !noSerializeSet.has(obj);
    const fastShouldSerialize = obj => !noSerializeSet.has(obj);
    const noSerialize = input => (null != input && noSerializeSet.add(input), input);
    const mutable = v => new MutableImpl(v);
    class MutableImpl {
        constructor(mut) {
            this.mut = mut;
        }
    }
    const isMutable = v => v instanceof MutableImpl;
    const unwrapProxy = proxy => isObject(proxy) ? getProxyTarget(proxy) ?? proxy : proxy;
    const getProxyTarget = obj => obj[QOjectTargetSymbol];
    const getProxySubs = obj => obj[QOjectSubsSymbol];
    const getProxyFlags = obj => {
        if (isObject(obj)) {
            return obj[QOjectFlagsSymbol];
        }
    };
    const resumeIfNeeded = containerEl => {
        "paused" === directGetAttribute(containerEl, "q:container") && ((containerEl => {
            if (!isContainer(containerEl)) {
                return void logWarn("Skipping hydration because parent element is not q:container");
            }
            const doc = getDocument(containerEl);
            const script = (parentElm => {
                let child = parentElm.lastElementChild;
                for (;child; ) {
                    if ("SCRIPT" === child.tagName && "qwik/json" === directGetAttribute(child, "type")) {
                        return child;
                    }
                    child = child.previousElementSibling;
                }
            })(containerEl === doc.documentElement ? doc.body : containerEl);
            if (!script) {
                return void logWarn("Skipping hydration qwik/json metadata was not found.");
            }
            script.remove();
            const containerState = getContainerState(containerEl);
            ((containerEl, containerState) => {
                const head = containerEl.ownerDocument.head;
                containerEl.querySelectorAll("style[q\\:style]").forEach((el => {
                    containerState.$styleIds$.add(directGetAttribute(el, "q:style")), head.appendChild(el);
                }));
            })(containerEl, containerState);
            const meta = JSON.parse((script.textContent || "{}").replace(/\\x3C(\/?script)/g, "<$1"));
            const elements = new Map;
            const getObject = id => ((id, elements, objs, containerState) => {
                if ("string" == typeof id && id.length, id.startsWith("#")) {
                    return elements.has(id), elements.get(id);
                }
                const index = strToInt(id);
                objs.length;
                let obj = objs[index];
                for (let i = id.length - 1; i >= 0; i--) {
                    const code = id[i];
                    const transform = OBJECT_TRANSFORMS[code];
                    if (!transform) {
                        break;
                    }
                    obj = transform(obj, containerState);
                }
                return obj;
            })(id, elements, meta.objs, containerState);
            let maxId = 0;
            getNodesInScope(containerEl, hasQId).forEach((el => {
                const id = directGetAttribute(el, "q:id");
                const ctx = getContext(el);
                ctx.$id$ = id, isElement(el) && (ctx.$vdom$ = domToVnode(el)), elements.set("#" + id, el), 
                maxId = Math.max(maxId, strToInt(id));
            })), containerState.$elementIndex$ = ++maxId;
            const parser = ((getObject, containerState, doc) => {
                const map = new Map;
                return {
                    prepare(data) {
                        for (const s of serializers) {
                            const prefix = s.prefix;
                            if (data.startsWith(prefix)) {
                                const value = s.prepare(data.slice(prefix.length), containerState, doc);
                                return s.fill && map.set(value, s), value;
                            }
                        }
                        return data;
                    },
                    fill(obj) {
                        const serializer = map.get(obj);
                        return !!serializer && (serializer.fill(obj, getObject, containerState), true);
                    }
                };
            })(getObject, containerState, doc);
            ((objs, subs, getObject, containerState, parser) => {
                for (let i = 0; i < objs.length; i++) {
                    const value = objs[i];
                    isString(value) && (objs[i] = value === UNDEFINED_PREFIX ? void 0 : parser.prepare(value));
                }
                for (let i = 0; i < subs.length; i++) {
                    const value = objs[i];
                    const sub = subs[i];
                    if (sub) {
                        const converted = new Map;
                        let flags = 0;
                        for (const key of Object.keys(sub)) {
                            const v = sub[key];
                            if ("$" === key) {
                                flags = v;
                                continue;
                            }
                            const el = getObject(key);
                            if (!el) {
                                logWarn("QWIK can not revive subscriptions because of missing element ID", key, value);
                                continue;
                            }
                            const set = null === v ? null : new Set(v);
                            converted.set(el, set);
                        }
                        createProxy(value, containerState, flags, converted);
                    }
                }
            })(meta.objs, meta.subs, getObject, containerState, parser);
            for (const obj of meta.objs) {
                reviveNestedObjects(obj, getObject, parser);
            }
            for (const elementID of Object.keys(meta.ctx)) {
                elementID.startsWith("#");
                const ctxMeta = meta.ctx[elementID];
                const el = elements.get(elementID);
                const ctx = getContext(el);
                const refMap = ctxMeta.r;
                const seq = ctxMeta.s;
                const host = ctxMeta.h;
                const contexts = ctxMeta.c;
                const watches = ctxMeta.w;
                if (refMap && (isElement(el), ctx.$refMap$ = refMap.split(" ").map(getObject), ctx.li = getDomListeners(ctx, containerEl)), 
                seq && (ctx.$seq$ = seq.split(" ").map(getObject)), watches && (ctx.$watches$ = watches.split(" ").map(getObject)), 
                contexts) {
                    ctx.$contexts$ = new Map;
                    for (const part of contexts.split(" ")) {
                        const [key, value] = part.split("=");
                        ctx.$contexts$.set(key, getObject(value));
                    }
                }
                if (host) {
                    const [props, renderQrl] = host.split(" ");
                    const styleIds = el.getAttribute("q:sstyle");
                    ctx.$scopeIds$ = styleIds ? styleIds.split(" ") : null, ctx.$mounted$ = true, ctx.$props$ = getObject(props), 
                    ctx.$renderQrl$ = getObject(renderQrl);
                }
            }
            var el;
            directSetAttribute(containerEl, "q:container", "resumed"), logDebug("Container resumed"), 
            (el = containerEl) && "function" == typeof CustomEvent && el.dispatchEvent(new CustomEvent("qresume", {
                detail: void 0,
                bubbles: true,
                composed: true
            }));
        })(containerEl), appendQwikDevTools(containerEl));
    };
    const appendQwikDevTools = containerEl => {
        containerEl.qwik = {
            pause: () => (async (elmOrDoc, defaultParentJSON) => {
                const doc = getDocument(elmOrDoc);
                const documentElement = doc.documentElement;
                const containerEl = isDocument(elmOrDoc) ? documentElement : elmOrDoc;
                if ("paused" === directGetAttribute(containerEl, "q:container")) {
                    throw qError(QError_containerAlreadyPaused);
                }
                const parentJSON = containerEl === doc.documentElement ? doc.body : containerEl;
                const data = await (async containerEl => {
                    const containerState = getContainerState(containerEl);
                    const contexts = getNodesInScope(containerEl, hasQId).map(tryGetContext);
                    return _pauseFromContexts(contexts, containerState);
                })(containerEl);
                const script = doc.createElement("script");
                return directSetAttribute(script, "type", "qwik/json"), script.textContent = JSON.stringify(data.state, void 0, void 0).replace(/<(\/?script)/g, "\\x3C$1"), 
                parentJSON.appendChild(script), directSetAttribute(containerEl, "q:container", "paused"), 
                data;
            })(containerEl),
            state: getContainerState(containerEl)
        };
    };
    const tryGetContext = element => element._qc_;
    const getContext = element => {
        let ctx = tryGetContext(element);
        return ctx || (element._qc_ = ctx = {
            $dirty$: false,
            $mounted$: false,
            $attachedListeners$: false,
            $id$: "",
            $element$: element,
            $refMap$: [],
            li: {},
            $watches$: null,
            $seq$: null,
            $slots$: null,
            $scopeIds$: null,
            $appendStyles$: null,
            $props$: null,
            $vdom$: null,
            $renderQrl$: null,
            $contexts$: null
        }), ctx;
    };
    const cleanupContext = (ctx, subsManager) => {
        const el = ctx.$element$;
        ctx.$watches$?.forEach((watch => {
            subsManager.$clearSub$(watch), destroyWatch(watch);
        })), ctx.$renderQrl$ && subsManager.$clearSub$(el), ctx.$renderQrl$ = null, ctx.$seq$ = null, 
        ctx.$watches$ = null, ctx.$dirty$ = false, el._qc_ = void 0;
    };
    const PREFIXES = [ "on", "window:on", "document:on" ];
    const SCOPED = [ "on", "on-window", "on-document" ];
    const normalizeOnProp = prop => {
        let scope = "on";
        for (let i = 0; i < PREFIXES.length; i++) {
            const prefix = PREFIXES[i];
            if (prop.startsWith(prefix)) {
                scope = SCOPED[i], prop = prop.slice(prefix.length);
                break;
            }
        }
        return scope + ":" + (prop.startsWith("-") ? fromCamelToKebabCase(prop.slice(1)) : prop.toLowerCase());
    };
    const createProps = (target, containerState) => createProxy(target, containerState, 2);
    const getPropsMutator = (ctx, containerState) => {
        let props = ctx.$props$;
        props || (ctx.$props$ = props = createProps({}, containerState));
        const target = getProxyTarget(props);
        const manager = containerState.$subsManager$.$getLocal$(target);
        return {
            set(prop, value) {
                let oldValue = target[prop];
                let mut = false;
                isMutable(oldValue) && (oldValue = oldValue.mut), containerState.$mutableProps$ ? (mut = true, 
                isMutable(value) ? (value = value.mut, target[prop] = value) : target[prop] = mutable(value)) : (target[prop] = value, 
                isMutable(value) && (value = value.mut, mut = true)), oldValue !== value && manager.$notifySubs$(prop);
            }
        };
    };
    const inflateQrl = (qrl, elCtx) => (qrl.$capture$, qrl.$captureRef$ = qrl.$capture$.map((idx => {
        const int = parseInt(idx, 10);
        const obj = elCtx.$refMap$[int];
        return elCtx.$refMap$.length, obj;
    })));
    const logError = (message, ...optionalParams) => {
        const err = message instanceof Error ? message : new Error(message);
        return "function" == typeof globalThis._handleError && message instanceof Error ? globalThis._handleError(message, optionalParams) : console.error("%cQWIK ERROR", "", err.message, ...printParams(optionalParams), err.stack), 
        err;
    };
    const logErrorAndStop = (message, ...optionalParams) => logError(message, ...optionalParams);
    const logWarn = (message, ...optionalParams) => {};
    const logDebug = (message, ...optionalParams) => {};
    const printParams = optionalParams => optionalParams;
    const QError_stringifyClassOrStyle = 0;
    const QError_verifySerializable = 3;
    const QError_setProperty = 6;
    const QError_useMethodOutsideContext = 14;
    const QError_immutableProps = 17;
    const QError_useInvokeContext = 20;
    const QError_containerAlreadyPaused = 21;
    const QError_canNotMountUseServerMount = 22;
    const QError_invalidJsxNodeType = 25;
    const QError_trackUseStore = 26;
    const QError_missingObjectId = 27;
    const qError = (code, ...parts) => {
        const text = codeToText(code);
        return logErrorAndStop(text, ...parts);
    };
    const codeToText = code => `Code(${code})`;
    const isQrl = value => "function" == typeof value && "function" == typeof value.getSymbol;
    const createQRL = (chunk, symbol, symbolRef, symbolFn, capture, captureRef, refSymbol) => {
        let _containerEl;
        const setContainer = el => {
            _containerEl || (_containerEl = el);
        };
        const resolve = async containerEl => {
            if (containerEl && setContainer(containerEl), symbolRef) {
                return symbolRef;
            }
            if (symbolFn) {
                return symbolRef = symbolFn().then((module => symbolRef = module[symbol]));
            }
            {
                if (!_containerEl) {
                    throw new Error(`QRL '${chunk}#${symbol || "default"}' does not have an attached container`);
                }
                const symbol2 = getPlatform().importSymbol(_containerEl, chunk, symbol);
                return symbolRef = then(symbol2, (ref => symbolRef = ref));
            }
        };
        const resolveLazy = containerEl => symbolRef || resolve(containerEl);
        const invokeFn = (currentCtx, beforeFn) => (...args) => {
            const fn = resolveLazy();
            return then(fn, (fn => {
                if (isFunction(fn)) {
                    if (beforeFn && false === beforeFn()) {
                        return;
                    }
                    const context = {
                        ...createInvokationContext(currentCtx),
                        $qrl$: QRL
                    };
                    return emitUsedSymbol(symbol, context.$element$), invoke(context, fn, ...args);
                }
                throw qError(10);
            }));
        };
        const createInvokationContext = invoke => null == invoke ? newInvokeContext() : isArray(invoke) ? newInvokeContextFromTuple(invoke) : invoke;
        const invokeQRL = async function(...args) {
            const fn = invokeFn();
            return await fn(...args);
        };
        const resolvedSymbol = refSymbol ?? symbol;
        const hash = getSymbolHash(resolvedSymbol);
        const QRL = invokeQRL;
        const methods = {
            getSymbol: () => resolvedSymbol,
            getHash: () => hash,
            resolve: resolve,
            $resolveLazy$: resolveLazy,
            $setContainer$: setContainer,
            $chunk$: chunk,
            $symbol$: symbol,
            $refSymbol$: refSymbol,
            $hash$: hash,
            getFn: invokeFn,
            $capture$: capture,
            $captureRef$: captureRef
        };
        return Object.assign(invokeQRL, methods);
    };
    const getSymbolHash = symbolName => {
        const index = symbolName.lastIndexOf("_");
        return index > -1 ? symbolName.slice(index + 1) : symbolName;
    };
    const emitUsedSymbol = (symbol, element) => {
        isServer() || "object" != typeof document || document.dispatchEvent(new CustomEvent("qsymbol", {
            bubbles: false,
            detail: {
                symbol: symbol,
                element: element,
                timestamp: performance.now()
            }
        }));
    };
    let runtimeSymbolId = 0;
    const EXTRACT_IMPORT_PATH = /\(\s*(['"])([^\1]+)\1\s*\)/;
    const EXTRACT_SELF_IMPORT = /Promise\s*\.\s*resolve/;
    const EXTRACT_FILE_NAME = /[\\/(]([\w\d.\-_]+\.(js|ts)x?):/;
    const QRLcache = new Map;
    const qrl = (chunkOrFn, symbol, lexicalScopeCapture = EMPTY_ARRAY) => {
        let chunk = "";
        let symbolFn = null;
        if (isString(chunkOrFn)) {
            chunk = chunkOrFn;
        } else {
            if (!isFunction(chunkOrFn)) {
                throw qError(12, chunkOrFn);
            }
            {
                symbolFn = chunkOrFn;
                const cached = QRLcache.get(symbol);
                if (cached) {
                    chunk = cached;
                } else {
                    let match;
                    const srcCode = String(chunkOrFn);
                    if ((match = srcCode.match(EXTRACT_IMPORT_PATH)) && match[2]) {
                        chunk = match[2];
                    } else {
                        if (!(match = srcCode.match(EXTRACT_SELF_IMPORT))) {
                            throw qError(11, srcCode);
                        }
                        {
                            const ref = "QWIK-SELF";
                            const frames = new Error(ref).stack.split("\n");
                            const start = frames.findIndex((f => f.includes(ref)));
                            match = frames[start + 2].match(EXTRACT_FILE_NAME), chunk = match ? match[1] : "main";
                        }
                    }
                    QRLcache.set(symbol, chunk);
                }
            }
        }
        return createQRL(chunk, symbol, null, symbolFn, null, lexicalScopeCapture, null);
    };
    const stringifyQRL = (qrl, opts = {}) => {
        let symbol = qrl.$symbol$;
        let chunk = qrl.$chunk$;
        const refSymbol = qrl.$refSymbol$ ?? symbol;
        const platform = getPlatform();
        if (platform) {
            const result = platform.chunkForSymbol(refSymbol);
            result && (chunk = result[1], qrl.$refSymbol$ || (symbol = result[0]));
        }
        chunk.startsWith("./") && (chunk = chunk.slice(2));
        const parts = [ chunk ];
        symbol && "default" !== symbol && parts.push("#", symbol);
        const capture = qrl.$capture$;
        const captureRef = qrl.$captureRef$;
        if (captureRef && captureRef.length) {
            if (opts.$getObjId$) {
                const capture = captureRef.map(opts.$getObjId$);
                parts.push(`[${capture.join(" ")}]`);
            } else if (opts.$addRefMap$) {
                const capture = captureRef.map(opts.$addRefMap$);
                parts.push(`[${capture.join(" ")}]`);
            }
        } else {
            capture && capture.length > 0 && parts.push(`[${capture.join(" ")}]`);
        }
        return parts.join("");
    };
    const serializeQRLs = (existingQRLs, elCtx) => {
        var value;
        (function(value) {
            return value && "number" == typeof value.nodeType;
        })(value = elCtx.$element$) && value.nodeType;
        const opts = {
            $element$: elCtx.$element$,
            $addRefMap$: obj => addToArray(elCtx.$refMap$, obj)
        };
        return existingQRLs.map((qrl => stringifyQRL(qrl, opts))).join("\n");
    };
    const parseQRL = (qrl, containerEl) => {
        const endIdx = qrl.length;
        const hashIdx = indexOf(qrl, 0, "#");
        const captureIdx = indexOf(qrl, hashIdx, "[");
        const chunkEndIdx = Math.min(hashIdx, captureIdx);
        const chunk = qrl.substring(0, chunkEndIdx);
        const symbolStartIdx = hashIdx == endIdx ? hashIdx : hashIdx + 1;
        const symbolEndIdx = captureIdx;
        const symbol = symbolStartIdx == symbolEndIdx ? "default" : qrl.substring(symbolStartIdx, symbolEndIdx);
        const captureStartIdx = captureIdx;
        const captureEndIdx = endIdx;
        const capture = captureStartIdx === captureEndIdx ? EMPTY_ARRAY : qrl.substring(captureStartIdx + 1, captureEndIdx - 1).split(" ");
        "/runtimeQRL" === chunk && logError(codeToText(2), qrl);
        const iQrl = createQRL(chunk, symbol, null, null, capture, null, null);
        return containerEl && iQrl.$setContainer$(containerEl), iQrl;
    };
    const indexOf = (text, startIdx, char) => {
        const endIdx = text.length;
        const charIdx = text.indexOf(char, startIdx == endIdx ? 0 : startIdx);
        return -1 == charIdx ? endIdx : charIdx;
    };
    const addToArray = (array, obj) => {
        const index = array.indexOf(obj);
        return -1 === index ? (array.push(obj), array.length - 1) : index;
    };
    const $ = expression => ((symbol, lexicalScopeCapture = EMPTY_ARRAY) => createQRL("/runtimeQRL", "s" + runtimeSymbolId++, symbol, null, null, lexicalScopeCapture, null))(expression);
    const componentQrl = onRenderQrl => {
        function QwikComponent(props, key) {
            const hash = onRenderQrl.$hash$;
            return jsx(Virtual, {
                "q:renderFn": onRenderQrl,
                ...props
            }, hash + ":" + (key || ""));
        }
        return QwikComponent[SERIALIZABLE_STATE] = [ onRenderQrl ], QwikComponent;
    };
    const isQwikComponent = component => "function" == typeof component && void 0 !== component[SERIALIZABLE_STATE];
    const flattenArray = (array, dst) => {
        dst || (dst = []);
        for (const item of array) {
            isArray(item) ? flattenArray(item, dst) : dst.push(item);
        }
        return dst;
    };
    const renderNodeVirtual = (node, elCtx, extraNodes, ssrCtx, stream, flags, beforeClose) => {
        const props = node.props;
        const renderQrl = props["q:renderFn"];
        if (renderQrl) {
            return elCtx.$renderQrl$ = renderQrl, renderSSRComponent(ssrCtx, stream, elCtx, node, flags, beforeClose);
        }
        let virtualComment = "\x3c!--qv" + renderVirtualAttributes(props);
        const isSlot = "q:s" in props;
        const key = null != node.key ? String(node.key) : null;
        if (isSlot && (ssrCtx.hostCtx?.$id$, virtualComment += " q:sref=" + ssrCtx.hostCtx.$id$), 
        null != key && (virtualComment += " q:key=" + key), virtualComment += "--\x3e", 
        stream.write(virtualComment), extraNodes) {
            for (const node of extraNodes) {
                renderNodeElementSync(node.type, node.props, stream);
            }
        }
        const promise = walkChildren(props.children, ssrCtx, stream, flags);
        return then(promise, (() => {
            if (!isSlot && !beforeClose) {
                return void stream.write(CLOSE_VIRTUAL);
            }
            let promise;
            if (isSlot) {
                const content = ssrCtx.projectedChildren?.[key];
                content && (ssrCtx.projectedChildren[key] = void 0, promise = processData(content, ssrCtx.projectedContext, stream, flags));
            }
            return beforeClose && (promise = then(promise, (() => beforeClose(stream)))), then(promise, (() => {
                stream.write(CLOSE_VIRTUAL);
            }));
        }));
    };
    const CLOSE_VIRTUAL = "\x3c!--/qv--\x3e";
    const renderVirtualAttributes = attributes => {
        let text = "";
        for (const prop of Object.keys(attributes)) {
            if ("children" === prop) {
                continue;
            }
            const value = attributes[prop];
            null != value && (text += " " + ("" === value ? prop : prop + "=" + value));
        }
        return text;
    };
    const renderNodeElementSync = (tagName, attributes, stream) => {
        if (stream.write("<" + tagName + (attributes => {
            let text = "";
            for (const prop of Object.keys(attributes)) {
                if ("dangerouslySetInnerHTML" === prop) {
                    continue;
                }
                const value = attributes[prop];
                null != value && (text += " " + ("" === value ? prop : prop + '="' + value + '"'));
            }
            return text;
        })(attributes) + ">"), !!emptyElements[tagName]) {
            return;
        }
        const innerHTML = attributes.dangerouslySetInnerHTML;
        null != innerHTML && stream.write(innerHTML), stream.write(`</${tagName}>`);
    };
    const renderSSRComponent = (ssrCtx, stream, elCtx, node, flags, beforeClose) => (setComponentProps(ssrCtx.rctx, elCtx, node.props), 
    then(executeComponent(ssrCtx.rctx, elCtx), (res => {
        const hostElement = elCtx.$element$;
        const newCtx = res.rctx;
        const invocationContext = newInvokeContext(hostElement, void 0);
        invocationContext.$subscriber$ = hostElement, invocationContext.$renderCtx$ = newCtx;
        const projectedContext = {
            ...ssrCtx,
            rctx: newCtx
        };
        const newSSrContext = {
            ...ssrCtx,
            projectedChildren: splitProjectedChildren(node.props.children, ssrCtx),
            projectedContext: projectedContext,
            rctx: newCtx,
            invocationContext: invocationContext
        };
        const extraNodes = [];
        if (elCtx.$appendStyles$) {
            const array = 4 & flags ? ssrCtx.headNodes : extraNodes;
            for (const style of elCtx.$appendStyles$) {
                array.push(jsx("style", {
                    "q:style": style.styleId,
                    dangerouslySetInnerHTML: style.content
                }));
            }
        }
        const newID = getNextIndex(ssrCtx.rctx);
        const scopeId = elCtx.$scopeIds$ ? serializeSStyle(elCtx.$scopeIds$) : void 0;
        const processedNode = jsx(node.type, {
            "q:sstyle": scopeId,
            "q:id": newID,
            children: res.node
        }, node.key);
        return elCtx.$id$ = newID, ssrCtx.$contexts$.push(elCtx), newSSrContext.hostCtx = elCtx, 
        renderNodeVirtual(processedNode, elCtx, extraNodes, newSSrContext, stream, flags, (stream => beforeClose ? then(renderQTemplates(newSSrContext, stream), (() => beforeClose(stream))) : renderQTemplates(newSSrContext, stream)));
    })));
    const renderQTemplates = (ssrContext, stream) => {
        const projectedChildren = ssrContext.projectedChildren;
        if (projectedChildren) {
            const nodes = Object.keys(projectedChildren).map((slotName => {
                const value = projectedChildren[slotName];
                if (value) {
                    return jsx("q:template", {
                        [QSlot]: slotName,
                        hidden: "",
                        "aria-hidden": "true",
                        children: value
                    });
                }
            }));
            return processData(nodes, ssrContext, stream, 0, void 0);
        }
    };
    const splitProjectedChildren = (children, ssrCtx) => {
        const flatChildren = flatVirtualChildren(children, ssrCtx);
        if (null === flatChildren) {
            return;
        }
        const slotMap = {};
        for (const child of flatChildren) {
            let slotName = "";
            isJSXNode(child) && (slotName = child.props[QSlot] ?? "");
            let array = slotMap[slotName];
            array || (slotMap[slotName] = array = []), array.push(child);
        }
        return slotMap;
    };
    const createContext = nodeType => getContext({
        nodeType: nodeType,
        _qc_: null
    });
    const renderNode = (node, ssrCtx, stream, flags, beforeClose) => {
        const tagName = node.type;
        if ("string" == typeof tagName) {
            const key = node.key;
            const props = node.props;
            const elCtx = createContext(1);
            const isHead = "head" === tagName;
            const hostCtx = ssrCtx.hostCtx;
            let openingElement = "<" + tagName + ((elCtx, attributes) => {
                let text = "";
                for (const prop of Object.keys(attributes)) {
                    if ("children" === prop || "key" === prop || "class" === prop || "className" === prop || "dangerouslySetInnerHTML" === prop) {
                        continue;
                    }
                    const value = attributes[prop];
                    if ("ref" === prop) {
                        value.current = elCtx.$element$;
                        continue;
                    }
                    if (isOnProp(prop)) {
                        setEvent(elCtx.li, prop, value);
                        continue;
                    }
                    const attrName = processPropKey(prop);
                    const attrValue = processPropValue(attrName, value);
                    null != attrValue && (text += " " + ("" === value ? attrName : attrName + '="' + escapeAttr(attrValue) + '"'));
                }
                return text;
            })(elCtx, props);
            let classStr = stringifyClass(props.class ?? props.className);
            if (hostCtx && (hostCtx.$scopeIds$ && (classStr = hostCtx.$scopeIds$.join(" ") + " " + classStr), 
            !hostCtx.$attachedListeners$)) {
                hostCtx.$attachedListeners$ = true;
                for (const eventName of Object.keys(hostCtx.li)) {
                    addQRLListener(elCtx.li, eventName, hostCtx.li[eventName]);
                }
            }
            isHead && (flags |= 1), classStr = classStr.trim(), classStr && (openingElement += ' class="' + classStr + '"');
            const listeners = Object.keys(elCtx.li);
            for (const key of listeners) {
                openingElement += " " + key + '="' + serializeQRLs(elCtx.li[key], elCtx) + '"';
            }
            if (null != key && (openingElement += ' q:key="' + key + '"'), "ref" in props || listeners.length > 0) {
                const newID = getNextIndex(ssrCtx.rctx);
                openingElement += ' q:id="' + newID + '"', elCtx.$id$ = newID, ssrCtx.$contexts$.push(elCtx);
            }
            if (1 & flags && (openingElement += " q:head"), openingElement += ">", stream.write(openingElement), 
            emptyElements[tagName]) {
                return;
            }
            const innerHTML = props.dangerouslySetInnerHTML;
            if (null != innerHTML) {
                return stream.write(String(innerHTML)), void stream.write(`</${tagName}>`);
            }
            isHead || (flags &= -2), "html" === tagName ? flags |= 4 : flags &= -5;
            const promise = processData(props.children, ssrCtx, stream, flags);
            return then(promise, (() => {
                if (isHead) {
                    for (const node of ssrCtx.headNodes) {
                        renderNodeElementSync(node.type, node.props, stream);
                    }
                    ssrCtx.headNodes.length = 0;
                }
                if (beforeClose) {
                    return then(beforeClose(stream), (() => {
                        stream.write(`</${tagName}>`);
                    }));
                }
                stream.write(`</${tagName}>`);
            }));
        }
        if (tagName === Virtual) {
            const elCtx = createContext(111);
            return renderNodeVirtual(node, elCtx, void 0, ssrCtx, stream, flags, beforeClose);
        }
        if (tagName === SSRComment) {
            return void stream.write("\x3c!--" + node.props.data + "--\x3e");
        }
        if (tagName === InternalSSRStream) {
            return (async (node, ssrCtx, stream, flags) => {
                stream.write("\x3c!--qkssr-f--\x3e");
                const generator = node.props.children;
                let value;
                if (isFunction(generator)) {
                    const v = generator({
                        write(chunk) {
                            stream.write(chunk), stream.write("\x3c!--qkssr-f--\x3e");
                        }
                    });
                    if (isPromise(v)) {
                        return v;
                    }
                    value = v;
                } else {
                    value = generator;
                }
                for await (const chunk of value) {
                    await processData(chunk, ssrCtx, stream, flags, void 0), stream.write("\x3c!--qkssr-f--\x3e");
                }
            })(node, ssrCtx, stream, flags);
        }
        const res = invoke(ssrCtx.invocationContext, tagName, node.props, node.key);
        return processData(res, ssrCtx, stream, flags, beforeClose);
    };
    const processData = (node, ssrCtx, stream, flags, beforeClose) => {
        if (null != node && "boolean" != typeof node) {
            if (isString(node) || "number" == typeof node) {
                stream.write(escapeHtml(String(node)));
            } else {
                if (isJSXNode(node)) {
                    return renderNode(node, ssrCtx, stream, flags, beforeClose);
                }
                if (isArray(node)) {
                    return walkChildren(node, ssrCtx, stream, flags);
                }
                if (isPromise(node)) {
                    return stream.write("\x3c!--qkssr-f--\x3e"), node.then((node => processData(node, ssrCtx, stream, flags, beforeClose)));
                }
                logWarn("A unsupported value was passed to the JSX, skipping render. Value:", node);
            }
        }
    };
    function walkChildren(children, ssrContext, stream, flags) {
        if (null == children) {
            return;
        }
        if (!isArray(children)) {
            return processData(children, ssrContext, stream, flags);
        }
        if (1 === children.length) {
            return processData(children[0], ssrContext, stream, flags);
        }
        if (0 === children.length) {
            return;
        }
        let currentIndex = 0;
        const buffers = [];
        return children.reduce(((prevPromise, child, index) => {
            const buffer = [];
            buffers.push(buffer);
            const rendered = processData(child, ssrContext, prevPromise ? {
                write(chunk) {
                    currentIndex === index ? stream.write(chunk) : buffer.push(chunk);
                }
            } : stream, flags);
            return isPromise(rendered) || prevPromise ? then(rendered, (() => then(prevPromise, (() => {
                currentIndex++, buffers.length > currentIndex && buffers[currentIndex].forEach((chunk => stream.write(chunk)));
            })))) : void currentIndex++;
        }), void 0);
    }
    const flatVirtualChildren = (children, ssrCtx) => {
        if (null == children) {
            return null;
        }
        const result = _flatVirtualChildren(children, ssrCtx);
        const nodes = isArray(result) ? result : [ result ];
        return 0 === nodes.length ? null : nodes;
    };
    const stringifyClass = str => {
        if (!str) {
            return "";
        }
        if ("string" == typeof str) {
            return str;
        }
        if (Array.isArray(str)) {
            return str.join(" ");
        }
        const output = [];
        for (const key in str) {
            Object.prototype.hasOwnProperty.call(str, key) && str[key] && output.push(key);
        }
        return output.join(" ");
    };
    const _flatVirtualChildren = (children, ssrCtx) => {
        if (null == children) {
            return null;
        }
        if (isArray(children)) {
            return children.flatMap((c => _flatVirtualChildren(c, ssrCtx)));
        }
        if (isJSXNode(children) && isFunction(children.type) && children.type !== SSRComment && children.type !== InternalSSRStream && children.type !== Virtual) {
            const res = invoke(ssrCtx.invocationContext, children.type, children.props, children.key);
            return flatVirtualChildren(res, ssrCtx);
        }
        return children;
    };
    const setComponentProps = (rctx, ctx, expectProps) => {
        const keys = Object.keys(expectProps);
        if (0 === keys.length) {
            return;
        }
        const target = {};
        ctx.$props$ = createProps(target, rctx.$static$.$containerState$);
        for (const key of keys) {
            "children" !== key && "q:renderFn" !== key && (target[key] = expectProps[key]);
        }
    };
    function processPropKey(prop) {
        return "htmlFor" === prop ? "for" : prop;
    }
    function processPropValue(prop, value) {
        return "style" === prop ? stringifyStyle(value) : false === value || null == value ? null : true === value ? "" : String(value);
    }
    const emptyElements = {
        area: true,
        base: true,
        basefont: true,
        bgsound: true,
        br: true,
        col: true,
        embed: true,
        frame: true,
        hr: true,
        img: true,
        input: true,
        keygen: true,
        link: true,
        meta: true,
        param: true,
        source: true,
        track: true,
        wbr: true
    };
    const ESCAPE_HTML = /[&<>]/g;
    const ESCAPE_ATTRIBUTES = /[&"]/g;
    const escapeHtml = s => s.replace(ESCAPE_HTML, (c => {
        switch (c) {
          case "&":
            return "&amp;";

          case "<":
            return "&lt;";

          case ">":
            return "&gt;";

          default:
            return "";
        }
    }));
    const escapeAttr = s => s.replace(ESCAPE_ATTRIBUTES, (c => {
        switch (c) {
          case "&":
            return "&amp;";

          case '"':
            return "&quot;";

          default:
            return "";
        }
    }));
    const useStore = (initialState, opts) => {
        const {get: get, set: set, ctx: ctx} = useSequentialScope();
        if (null != get) {
            return get;
        }
        const value = isFunction(initialState) ? initialState() : initialState;
        if (false === opts?.reactive) {
            return set(value), value;
        }
        {
            const containerState = ctx.$renderCtx$.$static$.$containerState$;
            const newStore = createProxy(value, containerState, opts?.recursive ?? false ? 1 : 0, void 0);
            return set(newStore), newStore;
        }
    };
    function useEnvData(key, defaultValue) {
        return useInvokeContext().$renderCtx$.$static$.$containerState$.$envData$[key] ?? defaultValue;
    }
    const useUserContext = useEnvData;
    const STYLE_CACHE = new Map;
    const getScopedStyles = (css, scopeId) => {
        let styleCss = STYLE_CACHE.get(scopeId);
        return styleCss || STYLE_CACHE.set(scopeId, styleCss = scopeStylesheet(css, scopeId)), 
        styleCss;
    };
    const scopeStylesheet = (css, scopeId) => {
        const end = css.length;
        const out = [];
        const stack = [];
        let idx = 0;
        let lastIdx = idx;
        let mode = rule;
        let lastCh = 0;
        for (;idx < end; ) {
            let ch = css.charCodeAt(idx++);
            ch === BACKSLASH && (idx++, ch = A);
            const arcs = STATE_MACHINE[mode];
            for (let i = 0; i < arcs.length; i++) {
                const arc = arcs[i];
                const [expectLastCh, expectCh, newMode] = arc;
                if ((expectLastCh === lastCh || expectLastCh === ANY || expectLastCh === IDENT && isIdent(lastCh) || expectLastCh === WHITESPACE && isWhiteSpace(lastCh)) && (expectCh === ch || expectCh === ANY || expectCh === IDENT && isIdent(ch) || expectCh === NOT_IDENT && !isIdent(ch) && ch !== DOT || expectCh === WHITESPACE && isWhiteSpace(ch)) && (3 == arc.length || lookAhead(arc))) {
                    if (arc.length > 3 && (ch = css.charCodeAt(idx - 1)), newMode === EXIT || newMode == EXIT_INSERT_SCOPE) {
                        newMode === EXIT_INSERT_SCOPE && (mode !== starSelector || shouldNotInsertScoping() ? isChainedSelector(ch) || insertScopingSelector(idx - (expectCh == NOT_IDENT ? 1 : expectCh == CLOSE_PARENTHESIS ? 2 : 0)) : (isChainedSelector(ch) ? flush(idx - 2) : insertScopingSelector(idx - 2), 
                        lastIdx++)), expectCh === NOT_IDENT && (idx--, ch = lastCh);
                        do {
                            mode = stack.pop() || rule, mode === pseudoGlobal && (flush(idx - 1), lastIdx++);
                        } while (isSelfClosingRule(mode));
                    } else {
                        stack.push(mode), mode === pseudoGlobal && newMode === rule ? (flush(idx - 8), lastIdx = idx) : newMode === pseudoElement && insertScopingSelector(idx - 2), 
                        mode = newMode;
                    }
                    break;
                }
            }
            lastCh = ch;
        }
        return flush(idx), out.join("");
        function flush(idx) {
            out.push(css.substring(lastIdx, idx)), lastIdx = idx;
        }
        function insertScopingSelector(idx) {
            mode === pseudoGlobal || shouldNotInsertScoping() || (flush(idx), out.push(".", "⭐️", scopeId));
        }
        function lookAhead(arc) {
            let prefix = 0;
            if (css.charCodeAt(idx) === DASH) {
                for (let i = 1; i < 10; i++) {
                    if (css.charCodeAt(idx + i) === DASH) {
                        prefix = i + 1;
                        break;
                    }
                }
            }
            words: for (let arcIndx = 3; arcIndx < arc.length; arcIndx++) {
                const txt = arc[arcIndx];
                for (let i = 0; i < txt.length; i++) {
                    if ((css.charCodeAt(idx + i + prefix) | LOWERCASE) !== txt.charCodeAt(i)) {
                        continue words;
                    }
                }
                return idx += txt.length + prefix, true;
            }
            return false;
        }
        function shouldNotInsertScoping() {
            return -1 !== stack.indexOf(pseudoGlobal) || -1 !== stack.indexOf(atRuleSelector);
        }
    };
    const isIdent = ch => ch >= _0 && ch <= _9 || ch >= A && ch <= Z || ch >= a && ch <= z || ch >= 128 || ch === UNDERSCORE || ch === DASH;
    const isChainedSelector = ch => ch === COLON || ch === DOT || ch === OPEN_BRACKET || ch === HASH || isIdent(ch);
    const isSelfClosingRule = mode => mode === atRuleBlock || mode === atRuleSelector || mode === atRuleInert || mode === pseudoGlobal;
    const isWhiteSpace = ch => ch === SPACE || ch === TAB || ch === NEWLINE || ch === CARRIAGE_RETURN;
    const rule = 0;
    const starSelector = 2;
    const pseudoGlobal = 5;
    const pseudoElement = 6;
    const atRuleSelector = 10;
    const atRuleBlock = 11;
    const atRuleInert = 12;
    const EXIT = 17;
    const EXIT_INSERT_SCOPE = 18;
    const ANY = 0;
    const IDENT = 1;
    const NOT_IDENT = 2;
    const WHITESPACE = 3;
    const TAB = 9;
    const NEWLINE = 10;
    const CARRIAGE_RETURN = 13;
    const SPACE = 32;
    const HASH = 35;
    const CLOSE_PARENTHESIS = 41;
    const DASH = 45;
    const DOT = 46;
    const _0 = 48;
    const _9 = 57;
    const COLON = 58;
    const A = 65;
    const Z = 90;
    const OPEN_BRACKET = 91;
    const BACKSLASH = 92;
    const UNDERSCORE = 95;
    const LOWERCASE = 32;
    const a = 97;
    const z = 122;
    const STRINGS_COMMENTS = [ [ ANY, 39, 14 ], [ ANY, 34, 15 ], [ ANY, 47, 16, "*" ] ];
    const STATE_MACHINE = [ [ [ ANY, 42, starSelector ], [ ANY, OPEN_BRACKET, 7 ], [ ANY, COLON, pseudoElement, ":" ], [ ANY, COLON, pseudoGlobal, "global" ], [ ANY, COLON, 3, "has", "host-context", "not", "where", "is", "matches", "any" ], [ ANY, COLON, 4 ], [ ANY, IDENT, 1 ], [ ANY, DOT, 1 ], [ ANY, HASH, 1 ], [ ANY, 64, atRuleSelector, "keyframe" ], [ ANY, 64, atRuleBlock, "media", "supports" ], [ ANY, 64, atRuleInert ], [ ANY, 123, 13 ], [ 47, 42, 16 ], [ ANY, 59, EXIT ], [ ANY, 125, EXIT ], [ ANY, CLOSE_PARENTHESIS, EXIT ], ...STRINGS_COMMENTS ], [ [ ANY, NOT_IDENT, EXIT_INSERT_SCOPE ] ], [ [ ANY, NOT_IDENT, EXIT_INSERT_SCOPE ] ], [ [ ANY, 40, rule ], [ ANY, NOT_IDENT, EXIT_INSERT_SCOPE ] ], [ [ ANY, 40, 8 ], [ ANY, NOT_IDENT, EXIT_INSERT_SCOPE ] ], [ [ ANY, 40, rule ], [ ANY, NOT_IDENT, EXIT ] ], [ [ ANY, NOT_IDENT, EXIT ] ], [ [ ANY, 93, EXIT_INSERT_SCOPE ], [ ANY, 39, 14 ], [ ANY, 34, 15 ] ], [ [ ANY, CLOSE_PARENTHESIS, EXIT ], ...STRINGS_COMMENTS ], [ [ ANY, 125, EXIT ], ...STRINGS_COMMENTS ], [ [ ANY, 125, EXIT ], [ WHITESPACE, IDENT, 1 ], [ ANY, COLON, pseudoGlobal, "global" ], [ ANY, 123, 13 ], ...STRINGS_COMMENTS ], [ [ ANY, 123, rule ], [ ANY, 59, EXIT ], ...STRINGS_COMMENTS ], [ [ ANY, 59, EXIT ], [ ANY, 123, 9 ], ...STRINGS_COMMENTS ], [ [ ANY, 125, EXIT ], [ ANY, 123, 13 ], [ ANY, 40, 8 ], ...STRINGS_COMMENTS ], [ [ ANY, 39, EXIT ] ], [ [ ANY, 34, EXIT ] ], [ [ 42, 47, EXIT ] ] ];
    const useStylesQrl = styles => {
        _useStyles(styles, (str => str), false);
    };
    const useStyles$ = implicit$FirstArg(useStylesQrl);
    const useStylesScopedQrl = styles => {
        _useStyles(styles, getScopedStyles, true);
    };
    const useStylesScoped$ = implicit$FirstArg(useStylesScopedQrl);
    const _useStyles = (styleQrl, transform, scoped) => {
        const {get: get, set: set, ctx: ctx, i: i} = useSequentialScope();
        if (get) {
            return get;
        }
        const renderCtx = ctx.$renderCtx$;
        const styleId = (index = i, `${((text, hash = 0) => {
            if (0 === text.length) {
                return hash;
            }
            for (let i = 0; i < text.length; i++) {
                hash = (hash << 5) - hash + text.charCodeAt(i), hash |= 0;
            }
            return Number(Math.abs(hash)).toString(36);
        })(styleQrl.$hash$)}-${index}`);
        var index;
        const containerState = renderCtx.$static$.$containerState$;
        const elCtx = getContext(ctx.$hostElement$);
        if (set(styleId), elCtx.$appendStyles$ || (elCtx.$appendStyles$ = []), elCtx.$scopeIds$ || (elCtx.$scopeIds$ = []), 
        scoped && elCtx.$scopeIds$.push((styleId => "⭐️" + styleId)(styleId)), ((containerState, styleId) => containerState.$styleIds$.has(styleId))(containerState, styleId)) {
            return styleId;
        }
        containerState.$styleIds$.add(styleId);
        const value = styleQrl.$resolveLazy$(containerState.$containerEl$);
        const appendStyle = styleText => {
            elCtx.$appendStyles$, elCtx.$appendStyles$.push({
                styleId: styleId,
                content: transform(styleText, styleId)
            });
        };
        return isPromise(value) ? ctx.$waitOn$.push(value.then(appendStyle)) : appendStyle(value), 
        styleId;
    };
    exports.$ = $, exports.Fragment = Fragment, exports.Resource = props => {
        if (props.onRejected && (props.value.promise.catch((() => {})), "rejected" === props.value.state)) {
            return props.onRejected(props.value.error);
        }
        if (props.onPending) {
            const state = props.value.state;
            if ("pending" === state) {
                return props.onPending();
            }
            if ("resolved" === state) {
                return props.onResolved(props.value.resolved);
            }
            if ("rejected" === state) {
                throw props.value.error;
            }
        }
        const promise = props.value.promise.then(useBindInvokeContext(props.onResolved), useBindInvokeContext(props.onRejected));
        return jsx(Fragment, {
            children: promise
        });
    }, exports.SSRComment = SSRComment, exports.SSRStream = (props, key) => jsx(RenderOnce, {
        children: jsx(InternalSSRStream, props)
    }, key), exports.SSRStreamBlock = props => [ jsx(SSRComment, {
        data: "qkssr-pu"
    }), props.children, jsx(SSRComment, {
        data: "qkssr-po"
    }) ], exports.SkipRender = SkipRender, exports.Slot = props => {
        const name = props.name ?? "";
        return jsx(Virtual, {
            "q:s": ""
        }, name);
    }, exports._hW = _hW, exports._pauseFromContexts = _pauseFromContexts, exports._useMutableProps = (element, mutable) => {
        const ctx = getWrappingContainer(element);
        getContainerState(ctx).$mutableProps$ = mutable;
    }, exports.component$ = onMount => componentQrl($(onMount)), exports.componentQrl = componentQrl, 
    exports.createContext = createContext$1, exports.getPlatform = getPlatform, exports.h = function(type, props, ...children) {
        const normalizedProps = {
            children: arguments.length > 2 ? flattenArray(children) : EMPTY_ARRAY
        };
        let key;
        let i;
        for (i in props) {
            "key" == i ? key = props[i] : normalizedProps[i] = props[i];
        }
        return new JSXNodeImpl(type, normalizedProps, key);
    }, exports.implicit$FirstArg = implicit$FirstArg, exports.inlinedQrl = (symbol, symbolName, lexicalScopeCapture = EMPTY_ARRAY) => createQRL("/inlinedQRL", symbolName, symbol, null, null, lexicalScopeCapture, null), 
    exports.jsx = jsx, exports.jsxDEV = jsx, exports.jsxs = jsx, exports.mutable = mutable, 
    exports.noSerialize = noSerialize, exports.qrl = qrl, exports.render = async (parent, jsxNode, opts) => {
        isJSXNode(jsxNode) || (jsxNode = jsx(jsxNode, null));
        const doc = getDocument(parent);
        const containerEl = isDocument(docOrElm = parent) ? docOrElm.documentElement : docOrElm;
        var docOrElm;
        (containerEl => {
            directSetAttribute(containerEl, "q:version", "0.9.0"), directSetAttribute(containerEl, "q:container", "resumed"), 
            directSetAttribute(containerEl, "q:render", "dom");
        })(containerEl);
        const containerState = getContainerState(containerEl);
        const envData = opts?.envData;
        envData && Object.assign(containerState.$envData$, envData), containerState.$hostsRendering$ = new Set, 
        containerState.$renderPromise$ = (async (parent, jsxNode, doc, containerState, containerEl) => {
            const ctx = createRenderContext(doc, containerState);
            const staticCtx = ctx.$static$;
            try {
                const processedNodes = await processData$1(jsxNode);
                const rootJsx = domToVnode(parent);
                await visitJsxNode(ctx, rootJsx, wrapJSX(parent, processedNodes), 0);
            } catch (err) {
                logError(err);
            }
            return staticCtx.$operations$.push(...staticCtx.$postOperations$), executeDOMRender(staticCtx), 
            staticCtx;
        })(containerEl, jsxNode, doc, containerState);
        const renderCtx = await containerState.$renderPromise$;
        await postRendering(containerState, renderCtx);
    }, exports.renderSSR = async (node, opts) => {
        const root = opts.containerTagName;
        const containerEl = createContext(1).$element$;
        const containerState = createContainerState(containerEl);
        const rctx = createRenderContext({
            nodeType: 9
        }, containerState);
        const headNodes = opts.beforeContent ?? [];
        const ssrCtx = {
            rctx: rctx,
            $contexts$: [],
            projectedChildren: void 0,
            projectedContext: void 0,
            hostCtx: void 0,
            invocationContext: void 0,
            headNodes: "html" === root ? headNodes : []
        };
        const containerAttributes = {
            ...opts.containerAttributes,
            "q:container": "paused",
            "q:version": "0.9.0",
            "q:render": "ssr",
            "q:base": opts.base,
            children: "html" === root ? [ node ] : [ headNodes, node ]
        };
        containerState.$envData$ = {
            url: opts.url,
            ...opts.envData
        }, node = jsx(root, containerAttributes), containerState.$hostsRendering$ = new Set, 
        containerState.$renderPromise$ = Promise.resolve().then((() => (async (node, ssrCtx, stream, containerState, opts) => {
            const beforeClose = opts.beforeClose;
            return await renderNode(node, ssrCtx, stream, 0, beforeClose ? stream => {
                const result = beforeClose(ssrCtx.$contexts$, containerState);
                return processData(result, ssrCtx, stream, 0, void 0);
            } : void 0), ssrCtx.rctx.$static$;
        })(node, ssrCtx, opts.stream, containerState, opts))), await containerState.$renderPromise$;
    }, exports.setPlatform = plt => _platform = plt, exports.useCleanup$ = useCleanup$, 
    exports.useCleanupQrl = useCleanupQrl, exports.useClientEffect$ = useClientEffect$, 
    exports.useClientEffectQrl = useClientEffectQrl, exports.useContext = (context, defaultValue) => {
        const {get: get, set: set, ctx: ctx} = useSequentialScope();
        if (void 0 !== get) {
            return get;
        }
        const value = resolveContext(context, ctx.$hostElement$, ctx.$renderCtx$);
        if (void 0 !== value) {
            return set(value);
        }
        if (void 0 !== defaultValue) {
            return set(defaultValue);
        }
        throw qError(13, context.id);
    }, exports.useContextProvider = useContextProvider, exports.useEnvData = useEnvData, 
    exports.useErrorBoundary = () => {
        const store = useStore({
            error: void 0
        });
        return useOn("error-boundary", qrl("/runtime", "error", [ store ])), useContextProvider(ERROR_CONTEXT, store), 
        store;
    }, exports.useLexicalScope = useLexicalScope, exports.useMount$ = useMount$, exports.useMountQrl = useMountQrl, 
    exports.useOn = useOn, exports.useOnDocument = (event, eventQrl) => _useOn(`document:on-${event}`, eventQrl), 
    exports.useOnWindow = (event, eventQrl) => _useOn(`window:on-${event}`, eventQrl), 
    exports.useRef = current => useStore({
        current: current
    }), exports.useResource$ = (generatorFn, opts) => useResourceQrl($(generatorFn), opts), 
    exports.useResourceQrl = useResourceQrl, exports.useServerMount$ = useServerMount$, 
    exports.useServerMountQrl = useServerMountQrl, exports.useStore = useStore, exports.useStyles$ = useStyles$, 
    exports.useStylesQrl = useStylesQrl, exports.useStylesScoped$ = useStylesScoped$, 
    exports.useStylesScopedQrl = useStylesScopedQrl, exports.useUserContext = useUserContext, 
    exports.useWatch$ = useWatch$, exports.useWatchQrl = useWatchQrl, exports.version = "0.9.0", 
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
}));
