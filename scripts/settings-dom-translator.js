export function buildSettingsDomTranslator(translations) {
  return `
(() => {
  const translations = ${JSON.stringify(translations)};
  const attrs = ["aria-label", "title", "placeholder", "data-tooltip-content"];
  const normalize = (value) => value.replace(/\\s+/g, " ").trim();
  const phraseEntries = Object.entries(translations)
    .filter(([from]) => from.length > 12 || /[\\s.,:;!?()[\\]/-]/.test(from))
    .sort((a, b) => b[0].length - a[0].length);
  const replacePhrases = (value) => {
    let next = value;
    for (const [from, to] of phraseEntries) {
      if (next.includes(from)) next = next.split(from).join(to);
    }
    return next;
  };
  const translateExact = (value) => {
    if (!value || typeof value !== "string") return value;
    if (Object.prototype.hasOwnProperty.call(translations, value)) return translations[value];
    const trimmed = value.trim();
    if (Object.prototype.hasOwnProperty.call(translations, trimmed)) {
      return value.replace(trimmed, translations[trimmed]);
    }
    const normalized = normalize(value);
    if (Object.prototype.hasOwnProperty.call(translations, normalized)) {
      return translations[normalized];
    }
    const refreshMatch = normalized.match(/^Refreshes in (.+)$/);
    if (refreshMatch) {
      const duration = refreshMatch[1]
        .replace(/\\bhours\\b/g, "小时")
        .replace(/\\bhour\\b/g, "小时")
        .replace(/\\bminutes\\b/g, "分钟")
        .replace(/\\bminute\\b/g, "分钟");
      return "将在 " + duration + " 后刷新";
    }
    const replaced = replacePhrases(value);
    if (replaced !== value) return replaced;
    const replacedNormalized = replacePhrases(normalized);
    if (replacedNormalized !== normalized) return replacedNormalized;
    return value;
  };
  const translateTextNode = (node) => {
    const next = translateExact(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  };
  const translateElement = (element) => {
    for (const attr of attrs) {
      if (element.hasAttribute?.(attr)) {
        const current = element.getAttribute(attr);
        const next = translateExact(current);
        if (next !== current) element.setAttribute(attr, next);
      }
    }
  };
  const translateDocumentTitle = () => {
    const next = translateExact(document.title);
    if (next !== document.title) document.title = next;
  };
  let pending = false;
  const activeShadowRoots = new Set();
  const observedRoots = new Set();
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      walk(document.body);
      for (const root of activeShadowRoots) {
        walk(root);
      }
    });
  };
  const observeRoot = (root) => {
    if (!root || observedRoots.has(root)) return;
    observedRoots.add(root);
    const observer = new MutationObserver(schedule);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: attrs
    });
  };
  const registerShadowRoot = (shadowRoot) => {
    if (!shadowRoot || activeShadowRoots.has(shadowRoot)) return;
    activeShadowRoots.add(shadowRoot);
    observeRoot(shadowRoot);
    walk(shadowRoot);
  };
  const walk = (root) => {
    if (!root) return;
    translateDocumentTitle();
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      translateElement(root);
      if (root.shadowRoot) {
        registerShadowRoot(root.shadowRoot);
      }
    }
    let child = root.firstChild;
    while (child) {
      walk(child);
      child = child.nextSibling;
    }
  };
  const start = () => {
    walk(document.body);
    observeRoot(document.documentElement);
    const originalAttachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(init) {
      const shadowRoot = originalAttachShadow.call(this, init);
      if (shadowRoot) {
        registerShadowRoot(shadowRoot);
      }
      return shadowRoot;
    };
    window.__ANTIGRAVITY_ZH_TRANSLATOR__ = {
      translations,
      rerun: () => {
        walk(document.body);
        for (const root of activeShadowRoots) {
          walk(root);
        }
      }
    };
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();`;
}
