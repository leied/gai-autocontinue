"use strict";

const enabledInput = document.querySelector("#enabled");
const status = document.querySelector("#status");
const clickCount = document.querySelector("#click-count");

function renderStatus(enabled) {
  status.textContent = enabled
    ? "Enabled — matching prompts will be confirmed."
    : "Paused — prompts will be left alone.";
}

chrome.storage.local
  .get({ enabled: true, clickCount: 0 })
  .then((settings) => {
    enabledInput.checked = settings.enabled;
    clickCount.textContent = String(settings.clickCount);
    renderStatus(settings.enabled);
  });

enabledInput.addEventListener("change", async () => {
  const enabled = enabledInput.checked;
  await chrome.storage.local.set({ enabled });
  renderStatus(enabled);
});
