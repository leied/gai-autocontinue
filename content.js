(() => {
  "use strict";

  // Firefox exposes the promise-based `browser` namespace; Chromium only has `chrome`.
  const api = globalThis.browser ?? globalThis.chrome;
  const rules = globalThis.GaiAutoContinueRules;
  const CLICKABLE_SELECTOR = "button, [role='button']";
  const MAX_ANCESTOR_DEPTH = 10;
  const CLICK_DELAY_MS = 100;
  const RESCAN_DEBOUNCE_MS = 40;
  const CLICK_COOLDOWN_MS = 1200;

  let enabled = true;
  let observer;
  let rescanTimer;
  let lastClickAt = 0;
  const handledButtons = new WeakSet();

  function elementLabel(element) {
    return (
      element.getAttribute("aria-label") ||
      element.innerText ||
      element.textContent ||
      ""
    );
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement) || !element.isConnected) {
      return false;
    }

    const style = getComputedStyle(element);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.pointerEvents === "none" ||
      Number(style.opacity) === 0
    ) {
      return false;
    }

    return element.getClientRects().length > 0;
  }

  function isUsableButton(element) {
    return (
      isVisible(element) &&
      !element.matches(":disabled") &&
      element.getAttribute("aria-disabled") !== "true"
    );
  }

  function rootHasDeclineButton(root) {
    return Array.from(root.querySelectorAll(CLICKABLE_SELECTOR)).some((element) =>
      rules.isDeclineLabel(elementLabel(element))
    );
  }

  function isWarningPrompt(root) {
    const text = root.innerText || root.textContent || "";
    return (
      rules.hasPromptTitle(text) &&
      rules.hasWarningCopy(text) &&
      rootHasDeclineButton(root)
    );
  }

  function findPromptRoot(button) {
    const explicitDialog = button.closest("[role='dialog'], [aria-modal='true']");
    if (explicitDialog && isWarningPrompt(explicitDialog)) {
      return explicitDialog;
    }

    let ancestor = button.parentElement;
    for (let depth = 0; ancestor && depth < MAX_ANCESTOR_DEPTH; depth += 1) {
      if (isWarningPrompt(ancestor)) {
        return ancestor;
      }
      ancestor = ancestor.parentElement;
    }

    return null;
  }

  async function recordClick() {
    try {
      const { clickCount = 0 } = await api.storage.local.get("clickCount");
      await api.storage.local.set({
        clickCount: clickCount + 1,
        lastClickedAt: Date.now()
      });
    } catch {
      // The click should still succeed if extension storage is unavailable.
    }
  }

  function clickAfterValidation(button, promptRoot) {
    handledButtons.add(button);

    window.setTimeout(() => {
      if (
        !enabled ||
        !rules.hasAiModeFlag(window.location.href) ||
        Date.now() - lastClickAt < CLICK_COOLDOWN_MS ||
        !isUsableButton(button) ||
        !promptRoot.isConnected ||
        !isWarningPrompt(promptRoot) ||
        !rules.isContinueLabel(elementLabel(button))
      ) {
        return;
      }

      lastClickAt = Date.now();
      button.click();
      void recordClick();
    }, CLICK_DELAY_MS);
  }

  function scan() {
    rescanTimer = undefined;
    if (
      !enabled ||
      !document.documentElement ||
      !rules.hasAiModeFlag(window.location.href)
    ) {
      return;
    }

    const buttons = document.querySelectorAll(CLICKABLE_SELECTOR);
    for (const button of buttons) {
      if (
        handledButtons.has(button) ||
        !rules.isContinueLabel(elementLabel(button)) ||
        !isUsableButton(button)
      ) {
        continue;
      }

      const promptRoot = findPromptRoot(button);
      if (promptRoot) {
        clickAfterValidation(button, promptRoot);
        return;
      }
    }
  }

  function scheduleScan() {
    if (rescanTimer === undefined) {
      rescanTimer = window.setTimeout(scan, RESCAN_DEBOUNCE_MS);
    }
  }

  function startObserver() {
    if (observer || !document.documentElement) {
      return;
    }

    observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-disabled", "aria-hidden", "style", "class"]
    });
    scheduleScan();
  }

  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.enabled) {
      enabled = changes.enabled.newValue !== false;
      if (enabled) {
        scheduleScan();
      }
    }
  });

  async function initialize() {
    try {
      const settings = await api.storage.local.get({ enabled: true });
      enabled = settings.enabled;
    } catch {
      enabled = true;
    }

    if (document.documentElement) {
      startObserver();
    } else {
      document.addEventListener("DOMContentLoaded", startObserver, { once: true });
    }
  }

  void initialize();
})();
