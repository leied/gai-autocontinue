(function exposeRules(root, factory) {
  const rules = factory();
  root.GaiAutoContinueRules = rules;

  if (typeof module === "object" && module.exports) {
    module.exports = rules;
  }
})(globalThis, function createRules() {
  "use strict";

  function normalizeText(value) {
    return String(value ?? "")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isContinueLabel(value) {
    const text = normalizeText(value).replace(/[.!]+$/, "");
    return text === "yes, continue" || text === "yes continue";
  }

  function isDeclineLabel(value) {
    const text = normalizeText(value).replace(/[.!]+$/, "");
    return text === "no thanks";
  }

  function hasPromptTitle(value) {
    const text = normalizeText(value);
    return (
      text.includes("continue with this search?") ||
      text.includes("continue with this search")
    );
  }

  function hasWarningCopy(value) {
    const text = normalizeText(value);
    return (
      text.includes("malicious queries") &&
      text.includes("unsafe or harmful actions")
    );
  }

  function hasAiModeFlag(value) {
    try {
      return new URL(value).searchParams.get("udm") === "50";
    } catch {
      return false;
    }
  }

  return {
    normalizeText,
    isContinueLabel,
    isDeclineLabel,
    hasPromptTitle,
    hasWarningCopy,
    hasAiModeFlag
  };
});
