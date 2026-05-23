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
  const walk = (root) => {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else translateElement(node);
    }
  };
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      walk(document.body);
    });
  };
  const start = () => {
    walk(document.body);
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: attrs
    });
    window.__ANTIGRAVITY_ZH_TRANSLATOR__ = { translations, rerun: () => walk(document.body) };
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();`;
}
