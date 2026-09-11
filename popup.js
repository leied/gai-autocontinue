"use strict";

// Firefox exposes the promise-based `browser` namespace; Chromium only has `chrome`.
const api = globalThis.browser ?? globalThis.chrome;

const enabledInput = document.querySelector("#enabled");
const status = document.querySelector("#status");
const clickCount = document.querySelector("#click-count");

function renderStatus(enabled) {
  status.textContent = enabled
    ? "Enabled — matching prompts will be confirmed."
    : "Paused — prompts will be left alone.";
}

api.storage.local
  .get({ enabled: true, clickCount: 0 })
  .then((settings) => {
    enabledInput.checked = settings.enabled;
    clickCount.textContent = String(settings.clickCount);
    renderStatus(settings.enabled);
  });

enabledInput.addEventListener("change", async () => {
  const enabled = enabledInput.checked;
  await api.storage.local.set({ enabled });
  renderStatus(enabled);
});
