# Google AI Search Auto-Continue

A small Chromium extension that automatically clicks **Yes, continue** on Google's
**Continue with this search?** warning dialog.

It does not hide the dialog with CSS. The content script watches Google pages for
new UI, requires the URL query parameter `udm=50`, verifies the dialog title, warning
text, **No thanks** option, and visible **Yes, continue** button, then performs a real
button click. This makes it work with Google's client-side navigation while reducing
the chance of clicking an unrelated button.

## Install in Chrome / Chromium

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this project directory.
5. Reload any Google tabs that were already open.

Click the extension's toolbar icon to pause or resume it. It is enabled by default.

## Privacy and scope

- Runs only on `google.com` and `www.google.com` — not on any other Google subdomain
  (no Gmail, Docs, Drive) — and clicks only when `udm=50` is set.
- Uses no network requests and collects no browsing or query data.
- Stores only the enabled toggle, the number of prompts handled, and the last-click
  timestamp in local extension storage.

## Important

This deliberately bypasses a Google safety confirmation. Enable it only if you want
every matching prompt accepted automatically. Google may change the prompt's wording
or markup; the extension intentionally stops clicking if its safety checks no longer
match.

## Development

Run the zero-dependency tests with:

```sh
npm test
```
